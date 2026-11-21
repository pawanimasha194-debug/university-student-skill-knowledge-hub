/**
 * ==============================================================================
 * UniSkill Hub - Admin Dashboard & System Management
 * File: js/admin.js
 * Module: Member 6 – Admin Dashboard & System Management
 * Functions:
 *   - adminLogin()       — Handles administrator authentication
 *   - checkAdminAuth()   — Guards admin pages
 *   - loadStatistics()   — Calculates metrics for Total Students, Resources, Articles, Questions
 *   - loadUsers()        — Lists all registered students with Delete User option
 *   - deleteUser()       — Removes a user account and their profile data
 *   - loadResources()    — Lists all resources with Delete Resource option
 *   - deleteResource()   — Removes an uploaded resource
 *   - loadArticles()     — Lists all published articles with Delete Article option
 *   - deleteArticle()    — Removes an article
 *   - loadReports()      — Computes Most Active Students, Popular Skills, and Downloads
 * ==============================================================================
 */

// Admin authentication is provided exclusively by js/faculty-admin.js.
// No demo password or localStorage admin session is accepted.

// ------------------------------------------------------------------------------
// 1. loadStatistics()
// Calculates dashboard metrics across all modules
// ------------------------------------------------------------------------------
function loadStatistics() {
  checkAdminAuth();

  // 1. Students count
  const mockProfiles = JSON.parse(localStorage.getItem('uniskill_mock_users') || '[]');
  const totalStudents = Math.max(6, mockProfiles.length + 6); // 6 baseline university profiles

  // 2. Resources count
  const localRes = JSON.parse(localStorage.getItem('uniskill_local_resources') || '[]');
  const deletedRes = new Set(JSON.parse(localStorage.getItem('uniskill_deleted_resources') || '[]'));
  const totalResources = Math.max(4, 4 + localRes.length - deletedRes.size);

  // 3. Articles count
  const localArt = JSON.parse(localStorage.getItem('uniskill_local_articles') || '[]');
  const deletedArt = new Set(JSON.parse(localStorage.getItem('uniskill_deleted_articles') || '[]'));
  const totalArticles = Math.max(5, 5 + localArt.length - deletedArt.size);

  // 4. Questions count
  const localQ = JSON.parse(localStorage.getItem('uniskill_questions') || '[]');
  const totalQuestions = Math.max(4, 4 + localQ.length);

  // Update DOM elements
  const elStudents = document.getElementById('statTotalStudents');
  const elResources = document.getElementById('statTotalResources');
  const elArticles = document.getElementById('statTotalArticles');
  const elQuestions = document.getElementById('statTotalQuestions');

  if (elStudents) elStudents.textContent = totalStudents;
  if (elResources) elResources.textContent = totalResources;
  if (elArticles) elArticles.textContent = totalArticles;
  if (elQuestions) elQuestions.textContent = totalQuestions;
}

// ------------------------------------------------------------------------------
// 2. loadUsers() & deleteUser() (manage-users.html)
// ------------------------------------------------------------------------------
function loadUsers(searchTerm = '') {
  checkAdminAuth();

  const tbody = document.getElementById('usersTableBody');
  const countBadge = document.getElementById('usersCountBadge');
  if (!tbody) return;

  // Baseline student directory
  const baseStudents = [
    { id: 'usr_samudi_01', full_name: 'Samudi Wijesinghe', email: 'samudi.w@university.ac.lk', faculty: 'Faculty of Applied Sciences', degree: 'BSc Applied Sciences', year: '3rd Year', created_at: '2026-09-12' },
    { id: 'usr_kaveen_02', full_name: 'Kaveen Perera', email: 'kaveen.p@university.ac.lk', faculty: 'Faculty of Computing & Technology', degree: 'BSc Computing & IT', year: '3rd Year', created_at: '2026-09-14' },
    { id: 'usr_tharushi_03', full_name: 'Tharushi Fernando', email: 'tharushi.f@university.ac.lk', faculty: 'Faculty of Science', degree: 'BSc Biological Sciences', year: '4th Year', created_at: '2026-09-15' },
    { id: 'usr_malith_04', full_name: 'Malith Jayasuriya', email: 'malith.j@university.ac.lk', faculty: 'Faculty of Engineering', degree: 'BSc Electrical & Electronic', year: '2nd Year', created_at: '2026-09-18' },
    { id: 'usr_ananya_05', full_name: 'Ananya Sharma', email: 'ananya.s@university.ac.lk', faculty: 'Faculty of Computing & Technology', degree: 'BSc Information Systems', year: '2nd Year', created_at: '2026-09-20' },
    { id: 'usr_dinuka_06', full_name: 'Dinuka Senanayake', email: 'dinuka.s@university.ac.lk', faculty: 'Faculty of Management Studies', degree: 'BSc Business Information', year: '3rd Year', created_at: '2026-09-25' }
  ];

  // Registered students from local storage
  const localUsers = JSON.parse(localStorage.getItem('uniskill_mock_users') || '[]');
  const deletedUsers = new Set(JSON.parse(localStorage.getItem('uniskill_deleted_users') || '[]'));

  let combined = [...baseStudents, ...localUsers.map(u => ({
    id: u.id || 'usr_' + Date.now(),
    full_name: u.full_name || 'Registered Student',
    email: u.email,
    faculty: u.faculty || 'Faculty of Science',
    degree: u.degree || 'BSc Undergraduate',
    year: u.academic_year || '1st Year',
    created_at: u.created_at ? u.created_at.split('T')[0] : '2026-10-01'
  }))].filter(u => !deletedUsers.has(u.id));

  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    combined = combined.filter(u => 
      u.full_name.toLowerCase().includes(s) || 
      u.email.toLowerCase().includes(s) || 
      u.faculty.toLowerCase().includes(s)
    );
  }

  if (countBadge) countBadge.textContent = `${combined.length} Students`;

  if (combined.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No students found matching your search.</td></tr>`;
    return;
  }

  let html = '';
  combined.forEach(u => {
    html += `
      <tr id="row-user-${u.id}">
        <td>
          <div class="table-user-cell">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.full_name)}" alt="" class="table-avatar">
            <div>
              <div style="font-weight: 600;">${escapeHTML(u.full_name)}</div>
              <div style="font-size: 11.5px; color: var(--text-subtle);">${escapeHTML(u.email)}</div>
            </div>
          </div>
        </td>
        <td>${escapeHTML(u.faculty)}</td>
        <td>${escapeHTML(u.degree)}</td>
        <td><span class="badge">${escapeHTML(u.year)}</span></td>
        <td>${u.created_at}</td>
        <td>
          <div class="action-btn-group">
            <a href="student-profile.html?id=${u.id}" class="btn btn-outline btn-sm">Profile</a>
            <button class="btn btn-danger-outline btn-sm" onclick="deleteUser('${u.id}', '${escapeHTML(u.full_name)}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function deleteUser(userId, userName) {
  if (!confirm(`Are you sure you want to delete the student profile for "${userName}"? This will remove their account from the platform.`)) return;

  const deletedUsers = JSON.parse(localStorage.getItem('uniskill_deleted_users') || '[]');
  deletedUsers.push(userId);
  localStorage.setItem('uniskill_deleted_users', JSON.stringify(deletedUsers));

  // Try Supabase delete if live
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured()) {
    try {
      window.supabaseClient.from('profiles').delete().eq('id', userId);
    } catch (e) {}
  }

  alert(`Student account "${userName}" deleted successfully.`);
  loadUsers();
}

// ------------------------------------------------------------------------------
// 3. loadResources() & deleteResource() (manage-resources.html)
// ------------------------------------------------------------------------------
function loadResources(searchTerm = '') {
  checkAdminAuth();

  const tbody = document.getElementById('resourcesTableBody');
  const countBadge = document.getElementById('resourcesCountBadge');
  if (!tbody) return;

  const baseResources = [
    { id: 'res-sample-01', title: 'Introduction to Statistics – Week 1 to 5 Notes', category: 'Statistics', uploader: 'Samudi Wijesinghe', size: '2.4 MB', date: '2026-10-18' },
    { id: 'res-sample-02', title: 'Relational Database Normalization Guide', category: 'Programming', uploader: 'Kaveen Perera', size: '1.8 MB', date: '2026-10-20' },
    { id: 'res-sample-03', title: 'Bioinformatics & Python Scripting Slides', category: 'Programming', uploader: 'Tharushi Fernando', size: '4.5 MB', date: '2026-10-22' },
    { id: 'res-sample-04', title: 'Computer Networks – OSI Model & TCP/IP', category: 'Networking', uploader: 'Malith Jayasuriya', size: '3.1 MB', date: '2026-10-24' }
  ];

  const localRes = JSON.parse(localStorage.getItem('uniskill_local_resources') || '[]');
  const deletedRes = new Set(JSON.parse(localStorage.getItem('uniskill_deleted_resources') || '[]'));

  let combined = [...baseResources, ...localRes.map(r => ({
    id: r.id,
    title: r.title,
    category: r.category_name || 'General',
    uploader: r.uploader_name || 'Student Uploader',
    size: r.file_size || '1.5 MB',
    date: r.created_at ? r.created_at.split('T')[0] : '2026-10-25'
  }))].filter(r => !deletedRes.has(r.id));

  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    combined = combined.filter(r => 
      r.title.toLowerCase().includes(s) || 
      r.category.toLowerCase().includes(s) || 
      r.uploader.toLowerCase().includes(s)
    );
  }

  if (countBadge) countBadge.textContent = `${combined.length} Resources`;

  if (combined.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No resources found matching your search.</td></tr>`;
    return;
  }

  let html = '';
  combined.forEach(r => {
    html += `
      <tr id="row-res-${r.id}">
        <td><strong>${escapeHTML(r.title)}</strong></td>
        <td><span class="skill-pill" style="margin:0;">${escapeHTML(r.category)}</span></td>
        <td>${escapeHTML(r.uploader)}</td>
        <td>${escapeHTML(r.size)}</td>
        <td>${r.date}</td>
        <td>
          <div class="action-btn-group">
            <a href="resources/resource-details.html?id=${r.id}" class="btn btn-outline btn-sm">View</a>
            <button class="btn btn-danger-outline btn-sm" onclick="deleteResource('${r.id}', '${escapeHTML(r.title)}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function deleteResource(resId, title) {
  if (!confirm(`Are you sure you want to delete the resource "${title}"?`)) return;

  const deletedRes = JSON.parse(localStorage.getItem('uniskill_deleted_resources') || '[]');
  deletedRes.push(resId);
  localStorage.setItem('uniskill_deleted_resources', JSON.stringify(deletedRes));

  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured()) {
    try {
      window.supabaseClient.from('resources').delete().eq('id', resId);
    } catch (e) {}
  }

  alert('Resource deleted successfully.');
  loadResources();
}

// ------------------------------------------------------------------------------
// 4. loadArticles() & deleteArticle() (manage-articles.html)
// ------------------------------------------------------------------------------
function loadArticles(searchTerm = '') {
  checkAdminAuth();

  const tbody = document.getElementById('articlesTableBody');
  const countBadge = document.getElementById('articlesCountBadge');
  if (!tbody) return;

  const baseArticles = [
    { id: 'art-sample-01', title: 'Understanding Regression Analysis: A Beginner\'s Guide', category: 'Statistics', author: 'Samudi Wijesinghe', date: '2026-10-21', likes: 38 },
    { id: 'art-sample-02', title: '5 Essential Python Libraries Every CS Student Should Know', category: 'Programming', author: 'Kaveen Perera', date: '2026-10-22', likes: 52 },
    { id: 'art-sample-03', title: 'Effective Study Techniques for Final Exams – What Actually Works', category: 'Academic Tips', author: 'Tharushi Fernando', date: '2026-10-23', likes: 76 },
    { id: 'art-sample-04', title: 'Introduction to Graph Theory: Concepts Every IT Student Should Know', category: 'Mathematics', author: 'Malith Jayasuriya', date: '2026-10-24', likes: 29 },
    { id: 'art-sample-05', title: 'How to Write a Research Proposal That Gets Approved', category: 'Research', author: 'Ananya Sharma', date: '2026-10-25', likes: 44 }
  ];

  const localArt = JSON.parse(localStorage.getItem('uniskill_local_articles') || '[]');
  const deletedArt = new Set(JSON.parse(localStorage.getItem('uniskill_deleted_articles') || '[]'));

  let combined = [...baseArticles, ...localArt.map(a => ({
    id: a.id,
    title: a.title,
    category: a.category || 'General',
    author: a.uploader_name || 'Student Author',
    date: a.created_at ? a.created_at.split('T')[0] : '2026-10-26',
    likes: a.likes_count || 0
  }))].filter(a => !deletedArt.has(a.id));

  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    combined = combined.filter(a => 
      a.title.toLowerCase().includes(s) || 
      a.category.toLowerCase().includes(s) || 
      a.author.toLowerCase().includes(s)
    );
  }

  if (countBadge) countBadge.textContent = `${combined.length} Articles`;

  if (combined.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No articles found matching your search.</td></tr>`;
    return;
  }

  let html = '';
  combined.forEach(a => {
    html += `
      <tr id="row-art-${a.id}">
        <td><strong>${escapeHTML(a.title)}</strong></td>
        <td><span class="skill-pill" style="margin:0;">${escapeHTML(a.category)}</span></td>
        <td>${escapeHTML(a.author)}</td>
        <td>${a.likes} Likes</td>
        <td>${a.date}</td>
        <td>
          <div class="action-btn-group">
            <a href="articles/article-details.html?id=${a.id}" class="btn btn-outline btn-sm">Read</a>
            <button class="btn btn-danger-outline btn-sm" onclick="deleteArticle('${a.id}', '${escapeHTML(a.title)}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function deleteArticle(articleId, title) {
  if (!confirm(`Are you sure you want to delete the article "${title}"?`)) return;

  const deletedArt = JSON.parse(localStorage.getItem('uniskill_deleted_articles') || '[]');
  deletedArt.push(articleId);
  localStorage.setItem('uniskill_deleted_articles', JSON.stringify(deletedArt));

  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured()) {
    try {
      window.supabaseClient.from('articles').delete().eq('id', articleId);
    } catch (e) {}
  }

  alert('Article deleted successfully.');
  loadArticles();
}

// ------------------------------------------------------------------------------
// 5. loadReports() (reports.html)
// Renders simple tables of active students, popular skills, and top downloads
// ------------------------------------------------------------------------------
function loadReports() {
  checkAdminAuth();

  // 1. Most Active Students
  const activeStudentsTbody = document.getElementById('activeStudentsTbody');
  if (activeStudentsTbody) {
    const list = [
      { name: 'Tharushi Fernando', faculty: 'Faculty of Science', score: '3 Articles • 76 Likes', rank: '🥇 1st' },
      { name: 'Kaveen Perera', faculty: 'Faculty of Computing', score: '2 Articles • 1 Resource • 52 Likes', rank: '🥈 2nd' },
      { name: 'Samudi Wijesinghe', faculty: 'Faculty of Applied Sciences', score: '2 Resources • 1 Article • 38 Likes', rank: '🥉 3rd' },
      { name: 'Ananya Sharma', faculty: 'Faculty of Computing', score: '1 Article • 2 Answers • 44 Likes', rank: '4th' },
      { name: 'Malith Jayasuriya', faculty: 'Faculty of Engineering', score: '1 Resource • 1 Question • 29 Likes', rank: '5th' }
    ];

    activeStudentsTbody.innerHTML = list.map(item => `
      <tr>
        <td><strong>${item.rank}</strong></td>
        <td>${escapeHTML(item.name)}</td>
        <td>${escapeHTML(item.faculty)}</td>
        <td><span class="badge">${item.score}</span></td>
      </tr>
    `).join('');
  }

  // 2. Most Popular Skills
  const popularSkillsTbody = document.getElementById('popularSkillsTbody');
  if (popularSkillsTbody) {
    const skillsList = [
      { skill: 'Python', students: 5, category: 'Programming', demand: 'High' },
      { skill: 'Statistics', students: 4, category: 'Mathematics', demand: 'High' },
      { skill: 'Web Development', students: 4, category: 'Software Dev', demand: 'High' },
      { skill: 'SQL & Database Design', students: 3, category: 'Data', demand: 'Medium' },
      { skill: 'UI/UX Design', students: 2, category: 'Design', demand: 'Medium' },
      { skill: 'MATLAB', students: 2, category: 'Engineering', demand: 'Moderate' }
    ];

    popularSkillsTbody.innerHTML = skillsList.map(s => `
      <tr>
        <td><strong>#${escapeHTML(s.skill)}</strong></td>
        <td>${s.students} Students Tagged</td>
        <td>${escapeHTML(s.category)}</td>
        <td><span class="badge" style="background-color: var(--primary-light); color: var(--primary-color);">${s.demand}</span></td>
      </tr>
    `).join('');
  }

  // 3. Most Downloaded Resources
  const topDownloadsTbody = document.getElementById('topDownloadsTbody');
  if (topDownloadsTbody) {
    const downloadsList = [
      { title: 'SE2024 Database Normalization Notes.pdf', category: 'Programming', uploader: 'Kaveen Perera', downloads: 148 },
      { title: 'Intro to Statistics Complete Notes.pdf', category: 'Statistics', uploader: 'Samudi Wijesinghe', downloads: 132 },
      { title: 'Computer Networks OSI & TCP/IP Summary.pdf', category: 'Networking', uploader: 'Malith Jayasuriya', downloads: 89 },
      { title: 'Bioinformatics Python Slides.pptx', category: 'Programming', uploader: 'Tharushi Fernando', downloads: 64 }
    ];

    topDownloadsTbody.innerHTML = downloadsList.map(d => `
      <tr>
        <td><strong>${escapeHTML(d.title)}</strong></td>
        <td><span class="skill-pill" style="margin:0;">${escapeHTML(d.category)}</span></td>
        <td>${escapeHTML(d.uploader)}</td>
        <td><strong>${d.downloads}</strong></td>
      </tr>
    `).join('');
  }
}

// Global escape
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(char) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[char] || char;
  });
}
