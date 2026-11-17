/**
 * ==============================================================================
 * UniSkill Hub - Skill Directory & Peer Connection System
 * File: js/skills.js
 * Module: Member 4 – Skill Directory & Peer Connection System
 * Functions:
 *   - searchStudents()      — Filters directory by text, faculty, skill, and year
 *   - connectStudent()      — Sends a connection request to another student
 *   - acceptRequest()       — Accepts a pending connection request
 *   - rejectRequest()       — Rejects/cancels a connection request
 *   - loadConnections()     — Loads pending, accepted, and suggested peers
 *   - loadStudentProfile()  — Loads individual student profile with bio and contributions
 * ==============================================================================
 */

// Global state for students directory
let allStudents = [];
let filteredStudents = [];
let currentSkillFilter = 'all';
let currentFacultyFilter = 'all';
let currentYearFilter = 'all';
let studentSearchText = '';

// Sample students across university faculties for instant demo presentation
const defaultSampleStudents = [
  {
    id: 'usr_samudi_01',
    full_name: 'Samudi Wijesinghe',
    email: 'samudi.w@university.ac.lk',
    faculty: 'Faculty of Applied Sciences',
    degree: 'BSc in Applied Sciences',
    academic_year: '3rd Year',
    profile_image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    bio: 'Statistics and applied mathematics undergraduate. Passionate about regression analysis, predictive modeling, and helping 1st year students master probability concepts.',
    skills: ['Statistics', 'Mathematics', 'Java', 'R Programming', 'Data Analysis']
  },
  {
    id: 'usr_kaveen_02',
    full_name: 'Kaveen Perera',
    email: 'kaveen.p@university.ac.lk',
    faculty: 'Faculty of Computing & Technology',
    degree: 'BSc in Computing & IT',
    academic_year: '3rd Year',
    profile_image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    bio: 'Software development enthusiast focusing on database normalization, system architecture, and Python scripting for automation. Always eager to collaborate on hackathons.',
    skills: ['Python', 'SQL', 'Database Design', 'Software Engineering', 'Web Development']
  },
  {
    id: 'usr_tharushi_03',
    full_name: 'Tharushi Fernando',
    email: 'tharushi.f@university.ac.lk',
    faculty: 'Faculty of Science',
    degree: 'BSc in Biological Sciences',
    academic_year: '4th Year',
    profile_image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    bio: 'Senior student conducting undergraduate research in computational biology and bioinformatics. Strong advocate for efficient exam preparation and study routines.',
    skills: ['Bioinformatics', 'Python', 'Research', 'Academic Writing', 'Biostatistics']
  },
  {
    id: 'usr_malith_04',
    full_name: 'Malith Jayasuriya',
    email: 'malith.j@university.ac.lk',
    faculty: 'Faculty of Engineering',
    degree: 'BSc in Electrical & Electronic Engineering',
    academic_year: '2nd Year',
    profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    bio: 'Engineering undergraduate interested in embedded systems, graph theory algorithms, and circuit simulation using MATLAB.',
    skills: ['C++', 'MATLAB', 'Graph Theory', 'Algorithms', 'Hardware Design']
  },
  {
    id: 'usr_ananya_05',
    full_name: 'Ananya Sharma',
    email: 'ananya.s@university.ac.lk',
    faculty: 'Faculty of Computing & Technology',
    degree: 'BSc in Information Systems',
    academic_year: '2nd Year',
    profile_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    bio: 'UI/UX enthusiast with a love for accessible web design, frontend prototyping, and student research proposal writing.',
    skills: ['UI/UX Design', 'JavaScript', 'HTML5/CSS3', 'Figma', 'Technical Writing']
  },
  {
    id: 'usr_dinuka_06',
    full_name: 'Dinuka Senanayake',
    email: 'dinuka.s@university.ac.lk',
    faculty: 'Faculty of Management Studies',
    degree: 'BSc in Business Information Systems',
    academic_year: '3rd Year',
    profile_image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    bio: 'Bridging business and technology. Experienced in agile project management, business process modeling, and data analytics.',
    skills: ['Business Analysis', 'SQL', 'Project Management', 'Agile', 'Communication']
  }
];

// ------------------------------------------------------------------------------
// Helper: Get logged-in student
// ------------------------------------------------------------------------------
function getActiveStudent() {
  if (typeof getCurrentStudent === 'function') {
    return getCurrentStudent();
  }
  const sessionStr = localStorage.getItem('uniskill_active_session');
  if (sessionStr) {
    try {
      const parsed = JSON.parse(sessionStr);
      return parsed.profile || parsed.user || null;
    } catch (e) {}
  }
  return {
    id: 'guest_user',
    full_name: 'Student User',
    faculty: 'Faculty of Science',
    degree: 'BSc Computer Science',
    profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student'
  };
}

// ------------------------------------------------------------------------------
// Connection Storage Helpers (Local + Supabase)
// ------------------------------------------------------------------------------
function getStoredConnections() {
  return JSON.parse(localStorage.getItem('uniskill_connections') || '[]');
}

function saveStoredConnections(conns) {
  localStorage.setItem('uniskill_connections', JSON.stringify(conns));
}

// Get connection status between current user and target student
function getConnectionStatus(targetId) {
  const current = getActiveStudent();
  if (!current || !current.id) return 'none';

  const conns = getStoredConnections();
  const match = conns.find(c => 
    (c.sender_id === current.id && c.receiver_id === targetId) ||
    (c.receiver_id === current.id && c.sender_id === targetId)
  );

  if (!match) return 'none';
  if (match.status === 'accepted') return 'accepted';
  if (match.status === 'pending') {
    return match.sender_id === current.id ? 'pending_sent' : 'pending_received';
  }
  return 'none';
}

// ------------------------------------------------------------------------------
// 1. loadStudentsDirectory()
// Loads profiles from Supabase profiles table, merged with sample data
// ------------------------------------------------------------------------------
async function loadStudentsDirectory() {
  const container = document.getElementById('studentsGridContainer');
  const countBadge = document.getElementById('studentsCountBadge');
  if (!container) return;

  container.innerHTML = '<div class="spinner-wrapper"><div class="spinner"></div><p style="margin-top: 10px; color: var(--text-muted); font-size: 13px;">Loading student skill directory...</p></div>';

  let liveProfiles = [];
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured()) {
    try {
      const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .limit(40);

      if (!error && data && data.length > 0) {
        liveProfiles = data.map(p => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          faculty: p.faculty || 'Faculty of Science',
          degree: p.degree || 'Undergraduate Degree',
          academic_year: p.academic_year || '2nd Year',
          profile_image: p.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.full_name)}`,
          bio: p.bio || 'Undergraduate student sharing skills on UniSkill Hub.',
          skills: typeof p.skills === 'string' 
            ? p.skills.split(',').map(s => s.trim()).filter(Boolean) 
            : (p.skills || ['Web Development'])
        }));
      }
    } catch (e) {
      console.warn('Skills directory fetch from Supabase warning:', e);
    }
  }

  // Merge with default sample profiles, deduplicating by ID
  const map = new Map();
  defaultSampleStudents.forEach(s => map.set(s.id, s));
  liveProfiles.forEach(p => map.set(p.id, p));

  const current = getActiveStudent();
  // Filter out the logged-in student from the peer directory
  allStudents = Array.from(map.values()).filter(s => !current || s.id !== current.id);
  filteredStudents = [...allStudents];

  if (countBadge) {
    countBadge.textContent = `${filteredStudents.length} Students`;
  }

  renderStudentsGrid(container, filteredStudents);
}

// ------------------------------------------------------------------------------
// renderStudentsGrid()
// Renders student cards into the grid
// ------------------------------------------------------------------------------
function renderStudentsGrid(container, students) {
  if (!container) return;

  if (!students || students.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No Students Found</div>
        <div class="empty-state-desc">No student matches your current filter or search criteria. Try selecting "All" or a different skill.</div>
      </div>
    `;
    return;
  }

  let html = '';
  students.forEach(student => {
    const status = getConnectionStatus(student.id);
    let btnHtml = '';

    if (status === 'accepted') {
      btnHtml = `<button class="btn-connect-state btn-connect-accepted" disabled>Connected ✓</button>`;
    } else if (status === 'pending_sent') {
      btnHtml = `<button class="btn-connect-state btn-connect-pending" disabled>Request Sent ⏳</button>`;
    } else if (status === 'pending_received') {
      btnHtml = `<button class="btn btn-primary btn-sm btn-block" onclick="acceptRequest('${student.id}')">Accept Request</button>`;
    } else {
      btnHtml = `<button class="btn btn-outline btn-sm btn-block" onclick="connectStudent('${student.id}')">+ Connect</button>`;
    }

    const skillsHtml = (student.skills || [])
      .slice(0, 4)
      .map(sk => `<span class="skill-pill">${escapeHTML(sk)}</span>`)
      .join('');

    const repScore = window.AcademicCore ? window.AcademicCore.calculateAcademicReputation(student.id).score : 90;

    html += `
      <div class="student-directory-card" id="card-${student.id}">
        <div class="student-card-banner"></div>
        <div class="student-card-avatar-wrap">
          <img 
            src="${student.profile_image}" 
            alt="${escapeHTML(student.full_name)}" 
            class="student-card-avatar"
            onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=student'"
          >
        </div>
        <div class="student-card-body">
          <a href="student-profile.html?id=${student.id}" class="student-card-name">${escapeHTML(student.full_name)}</a>
          <div style="margin: 2px 0 4px;">
            <span style="font-size: 11px; font-weight: 700; color: var(--primary-color); background: var(--primary-light); padding: 2px 6px; border-radius: 10px;">
              🎓 Score: ${repScore}/100
            </span>
          </div>
          <div class="student-card-faculty">${escapeHTML(student.faculty)}</div>
          <div class="student-card-degree">${escapeHTML(student.degree)} • ${escapeHTML(student.academic_year || 'Undergraduate')}</div>
          
          <div class="student-card-skills">
            ${skillsHtml}
          </div>

          <div class="student-card-actions">
            ${btnHtml}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ------------------------------------------------------------------------------
// 2. searchStudents()
// Filters directory by search text, faculty, skill, and academic year
// ------------------------------------------------------------------------------
function searchStudents(query) {
  if (query !== undefined) studentSearchText = query.toLowerCase().trim();

  filteredStudents = allStudents.filter(student => {
    // 1. Text Search across name, degree, bio, and skills
    if (studentSearchText) {
      const nameMatch = student.full_name.toLowerCase().includes(studentSearchText);
      const degreeMatch = (student.degree || '').toLowerCase().includes(studentSearchText);
      const bioMatch = (student.bio || '').toLowerCase().includes(studentSearchText);
      const skillMatch = (student.skills || []).some(s => s.toLowerCase().includes(studentSearchText));
      if (!nameMatch && !degreeMatch && !bioMatch && !skillMatch) return false;
    }

    // 2. Faculty Filter
    if (currentFacultyFilter !== 'all') {
      if (student.faculty !== currentFacultyFilter) return false;
    }

    // 3. Year Filter
    if (currentYearFilter !== 'all') {
      if (student.academic_year !== currentYearFilter) return false;
    }

    // 4. Skill Filter
    if (currentSkillFilter !== 'all') {
      const hasSkill = (student.skills || []).some(s => 
        s.toLowerCase() === currentSkillFilter.toLowerCase()
      );
      if (!hasSkill) return false;
    }

    return true;
  });

  const countBadge = document.getElementById('studentsCountBadge');
  if (countBadge) {
    countBadge.textContent = `${filteredStudents.length} Students`;
  }

  const container = document.getElementById('studentsGridContainer');
  renderStudentsGrid(container, filteredStudents);
}

function filterByFaculty(faculty) {
  currentFacultyFilter = faculty;
  searchStudents();
}

function filterByYear(year) {
  currentYearFilter = year;
  searchStudents();
}

function filterBySkill(skill) {
  currentSkillFilter = skill;
  searchStudents();
}

// ------------------------------------------------------------------------------
// 3. connectStudent()
// Sends a peer connection request to another student
// ------------------------------------------------------------------------------
async function connectStudent(targetStudentId) {
  const current = getActiveStudent();
  if (!current || !current.id) {
    alert('Please log in to connect with fellow students.');
    window.location.href = 'login.html';
    return;
  }

  const conns = getStoredConnections();
  const existing = conns.find(c => 
    (c.sender_id === current.id && c.receiver_id === targetStudentId) ||
    (c.receiver_id === current.id && c.sender_id === targetStudentId)
  );

  if (existing) {
    alert('A connection request already exists with this student.');
    return;
  }

  const newConn = {
    id: 'conn-' + Date.now(),
    sender_id: current.id,
    receiver_id: targetStudentId,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  // 1. Try Supabase insert
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && current.id !== 'guest_user') {
    try {
      await window.supabaseClient.from('connections').insert({
        sender_id: current.id,
        receiver_id: targetStudentId,
        status: 'pending'
      });
    } catch (e) {
      console.warn('Supabase connect insert error:', e);
    }
  }

  // 2. Persist locally
  conns.push(newConn);
  saveStoredConnections(conns);

  // 3. Create a notification for the receiver
  createNotification(
    targetStudentId,
    `${current.full_name || 'A student'} sent you a peer connection request.`
  );

  alert('Connection request sent successfully!');

  // Refresh current view
  if (document.getElementById('studentsGridContainer')) {
    renderStudentsGrid(document.getElementById('studentsGridContainer'), filteredStudents);
  }
  if (document.getElementById('profileConnectBtn')) {
    updateProfileConnectButton(targetStudentId);
  }
}

// ------------------------------------------------------------------------------
// 4. acceptRequest() & rejectRequest()
// Handles pending requests in connections.html
// ------------------------------------------------------------------------------
async function acceptRequest(senderId) {
  const current = getActiveStudent();
  const conns = getStoredConnections();

  const match = conns.find(c => 
    (c.sender_id === senderId && c.receiver_id === current.id) ||
    (c.receiver_id === senderId && c.sender_id === current.id)
  );

  if (match) {
    match.status = 'accepted';
  } else {
    conns.push({
      id: 'conn-' + Date.now(),
      sender_id: senderId,
      receiver_id: current.id,
      status: 'accepted',
      created_at: new Date().toISOString()
    });
  }

  // Supabase update
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && current.id !== 'guest_user') {
    try {
      await window.supabaseClient
        .from('connections')
        .update({ status: 'accepted' })
        .match({ sender_id: senderId, receiver_id: current.id });
    } catch (e) {}
  }

  saveStoredConnections(conns);

  createNotification(
    senderId,
    `${current.full_name || 'A student'} accepted your peer connection request.`
  );

  alert('Connection request accepted!');

  if (typeof loadConnections === 'function') {
    loadConnections();
  }
}

async function rejectRequest(senderId) {
  if (!confirm('Are you sure you want to decline this connection request?')) return;

  const current = getActiveStudent();
  let conns = getStoredConnections();

  conns = conns.filter(c => 
    !( (c.sender_id === senderId && c.receiver_id === current.id) ||
       (c.receiver_id === senderId && c.sender_id === current.id) )
  );

  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && current.id !== 'guest_user') {
    try {
      await window.supabaseClient
        .from('connections')
        .delete()
        .match({ sender_id: senderId, receiver_id: current.id });
    } catch (e) {}
  }

  saveStoredConnections(conns);

  if (typeof loadConnections === 'function') {
    loadConnections();
  }
}

// ------------------------------------------------------------------------------
// 5. loadConnections()
// Renders pending, accepted, and suggested connections in connections.html
// ------------------------------------------------------------------------------
async function loadConnections() {
  const pendingContainer = document.getElementById('pendingRequestsContainer');
  const acceptedContainer = document.getElementById('acceptedConnectionsContainer');
  const suggestedContainer = document.getElementById('suggestedPeersContainer');

  const pendingBadge = document.getElementById('pendingCountBadge');
  const acceptedBadge = document.getElementById('acceptedCountBadge');

  const current = getActiveStudent();
  const conns = getStoredConnections();

  // Find all known students
  const allKnown = [...defaultSampleStudents];

  // 1. Pending received requests
  const pendingRequests = conns.filter(c => 
    c.receiver_id === current.id && c.status === 'pending'
  );

  // 2. Accepted connections
  const acceptedList = conns.filter(c => 
    (c.sender_id === current.id || c.receiver_id === current.id) && c.status === 'accepted'
  );

  if (pendingBadge) pendingBadge.textContent = pendingRequests.length;
  if (acceptedBadge) acceptedBadge.textContent = acceptedList.length;

  // Render Pending
  if (pendingContainer) {
    if (pendingRequests.length === 0) {
      pendingContainer.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-state-icon">📬</div>
          <div class="empty-state-title">No Pending Requests</div>
          <div class="empty-state-desc">You do not have any pending peer invitations at this moment.</div>
        </div>
      `;
    } else {
      let pHtml = '';
      pendingRequests.forEach(req => {
        const student = allKnown.find(s => s.id === req.sender_id) || {
          id: req.sender_id,
          full_name: 'University Student',
          faculty: 'Faculty of Science',
          degree: 'Undergraduate',
          profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student'
        };

        pHtml += `
          <div class="connection-item">
            <div class="connection-item-left">
              <img src="${student.profile_image}" alt="${escapeHTML(student.full_name)}" class="connection-avatar">
              <div class="connection-info">
                <h4><a href="student-profile.html?id=${student.id}">${escapeHTML(student.full_name)}</a></h4>
                <p>${escapeHTML(student.faculty)} • ${escapeHTML(student.degree)}</p>
                <span style="font-size: 11px; color: var(--text-subtle);">Sent connection invitation</span>
              </div>
            </div>
            <div class="connection-actions">
              <button class="btn btn-primary btn-sm" onclick="acceptRequest('${student.id}')">Accept</button>
              <button class="btn btn-secondary btn-sm" onclick="rejectRequest('${student.id}')">Decline</button>
            </div>
          </div>
        `;
      });
      pendingContainer.innerHTML = pHtml;
    }
  }

  // Render Accepted
  if (acceptedContainer) {
    if (acceptedList.length === 0) {
      acceptedContainer.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-state-icon">👥</div>
          <div class="empty-state-title">No Accepted Connections Yet</div>
          <div class="empty-state-desc">Discover students in your faculty or with shared academic skills to grow your network!</div>
          <a href="skills.html" class="btn btn-primary" style="margin-top: 10px;">Find Peers in Skill Directory</a>
        </div>
      `;
    } else {
      let aHtml = '';
      acceptedList.forEach(c => {
        const otherId = c.sender_id === current.id ? c.receiver_id : c.sender_id;
        const student = allKnown.find(s => s.id === otherId) || {
          id: otherId,
          full_name: 'Connected Peer',
          faculty: 'Faculty of Computing',
          degree: 'BSc Software Engineering',
          profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=peer'
        };

        aHtml += `
          <div class="connection-item">
            <div class="connection-item-left">
              <img src="${student.profile_image}" alt="${escapeHTML(student.full_name)}" class="connection-avatar">
              <div class="connection-info">
                <h4><a href="student-profile.html?id=${student.id}">${escapeHTML(student.full_name)}</a></h4>
                <p>${escapeHTML(student.faculty)} • ${escapeHTML(student.degree)}</p>
                <span style="font-size: 11.5px; color: var(--success-color); font-weight: 600;">Connected Peer ✓</span>
              </div>
            </div>
            <div class="connection-actions">
              <a href="student-profile.html?id=${student.id}" class="btn btn-outline btn-sm">View Profile</a>
              <button class="btn btn-secondary btn-sm" onclick="rejectRequest('${student.id}')">Remove</button>
            </div>
          </div>
        `;
      });
      acceptedContainer.innerHTML = aHtml;
    }
  }

  // Render Suggested
  if (suggestedContainer) {
    const connectedIds = new Set([
      current.id,
      ...conns.map(c => c.sender_id),
      ...conns.map(c => c.receiver_id)
    ]);

    const suggestions = allKnown.filter(s => !connectedIds.has(s.id));
    if (suggestions.length === 0) {
      suggestedContainer.innerHTML = `<p style="font-size: 13px; color: var(--text-muted); text-align: center;">You have connected with all suggested students!</p>`;
    } else {
      let sHtml = '';
      suggestions.slice(0, 3).forEach(s => {
        sHtml += `
          <div class="connection-item">
            <div class="connection-item-left">
              <img src="${s.profile_image}" alt="${escapeHTML(s.full_name)}" class="connection-avatar">
              <div class="connection-info">
                <h4><a href="student-profile.html?id=${s.id}">${escapeHTML(s.full_name)}</a></h4>
                <p>${escapeHTML(s.faculty)} • ${escapeHTML(s.degree)}</p>
              </div>
            </div>
            <div class="connection-actions">
              <button class="btn btn-outline btn-sm" onclick="connectStudent('${s.id}')">+ Connect</button>
            </div>
          </div>
        `;
      });
      suggestedContainer.innerHTML = sHtml;
    }
  }
}

// ------------------------------------------------------------------------------
// 6. loadStudentProfile()
// Loads full profile in student-profile.html
// ------------------------------------------------------------------------------
async function loadStudentProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  let studentId = urlParams.get('id');

  const current = getActiveStudent();
  if (!studentId || studentId === 'me') {
    studentId = current ? current.id : 'usr_samudi_01';
  }

  // Look up student
  const allKnown = [...defaultSampleStudents];
  let student = allKnown.find(s => s.id === studentId);

  // If not found in samples, try current student profile
  if (!student && current && (current.id === studentId || studentId === 'me')) {
    student = current;
  }

  if (!student) {
    student = {
      id: studentId,
      full_name: 'Undergraduate Student',
      faculty: 'Faculty of Science',
      degree: 'BSc Computer Science',
      academic_year: '3rd Year',
      bio: 'Undergraduate student sharing academic knowledge on UniSkill Hub.',
      profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
      skills: ['Web Development', 'Problem Solving']
    };
  }

  // Populate UI elements
  const nameEl = document.getElementById('profileName');
  const facultyEl = document.getElementById('profileFaculty');
  const degreeEl = document.getElementById('profileDegree');
  const yearEl = document.getElementById('profileYear');
  const bioEl = document.getElementById('profileBio');
  const avatarEl = document.getElementById('profileAvatar');
  const skillsWrap = document.getElementById('profileSkillsWrap');

  if (nameEl) nameEl.textContent = student.full_name;
  if (facultyEl) facultyEl.textContent = student.faculty;
  if (degreeEl) degreeEl.textContent = student.degree;
  if (yearEl) yearEl.textContent = student.academic_year || 'Undergraduate';
  if (bioEl) bioEl.textContent = student.bio || 'Undergraduate student sharing skills on UniSkill Hub.';
  if (avatarEl && student.profile_image) avatarEl.src = student.profile_image;

  // 1. Render Academic Reputation & Badges (Feature 2 & 18)
  if (window.AcademicCore) {
    const rep = window.AcademicCore.calculateAcademicReputation(student.id);
    const repScoreEl = document.getElementById('profileReputationScore');
    const repBarEl = document.getElementById('profileReputationBar');
    const badgesAreaEl = document.getElementById('profileBadgesArea');

    if (repScoreEl) repScoreEl.textContent = `${rep.score} / 100`;
    if (repBarEl) repBarEl.style.width = `${rep.score}%`;

    if (badgesAreaEl) {
      badgesAreaEl.innerHTML = rep.badges.map(b => 
        `<span class="academic-badge top-tutor" title="${escapeHTML(b.description)}">${b.icon} ${escapeHTML(b.name)}</span>`
      ).join(' ');
    }
  }

  // 2. Render Verified Skills & Endorsement Cards (Feature 1)
  const verifiedContainer = document.getElementById('verifiedSkillsContainer');
  if (verifiedContainer && student.skills) {
    const arr = Array.isArray(student.skills) 
      ? student.skills 
      : student.skills.split(',').map(s => s.trim()).filter(Boolean);

    verifiedContainer.innerHTML = arr.map(sk => {
      const stats = window.AcademicCore ? window.AcademicCore.getSkillStats(student.id, sk) : {
        averageRating: 4.9,
        reviewCount: 4,
        endorsementCount: 42,
        recentFeedback: 'Very good programmer. Clear, practical explanations.'
      };

      const starsHTML = '⭐'.repeat(Math.round(stats.averageRating));

      return `
        <div class="verified-skill-card">
          <div class="verified-skill-top">
            <div>
              <span class="verified-skill-name">${escapeHTML(sk)}</span>
              <span class="star-rating" style="margin-left: 8px;">
                ${starsHTML}
                <span class="star-rating-count"><strong>${stats.averageRating}</strong> (${stats.reviewCount} reviews)</span>
              </span>
            </div>
            <div>
              <span class="verified-counter-badge">✓ Verified by ${stats.endorsementCount} students</span>
            </div>
          </div>

          <div class="verified-feedback-quote">
            " ${escapeHTML(stats.recentFeedback)} "
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
            <button class="btn btn-outline btn-sm" onclick="openEndorseModal('${escapeHTML(sk)}', '${student.id}', '${escapeHTML(student.full_name)}')">
              ★ Endorse & Review Skill
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Fallback for simple pills wrap if present
  if (skillsWrap && student.skills) {
    skillsWrap.innerHTML = '';
    const arr = Array.isArray(student.skills) 
      ? student.skills 
      : student.skills.split(',').map(s => s.trim());
    arr.forEach(sk => {
      const pill = document.createElement('span');
      pill.className = 'skill-pill';
      pill.textContent = sk;
      skillsWrap.appendChild(pill);
    });
  }

  // Update Connect Button on Profile
  updateProfileConnectButton(student.id);

  // Load this student's uploaded resources & articles
  loadStudentContributions(student.id);
}

function updateProfileConnectButton(targetId) {
  const btn = document.getElementById('profileConnectBtn');
  if (!btn) return;

  const current = getActiveStudent();
  if (current && current.id === targetId) {
    btn.style.display = 'none'; // Cannot connect with self
    return;
  }

  const status = getConnectionStatus(targetId);
  if (status === 'accepted') {
    btn.className = 'btn-connect-state btn-connect-accepted';
    btn.textContent = 'Connected ✓';
    btn.disabled = true;
  } else if (status === 'pending_sent') {
    btn.className = 'btn-connect-state btn-connect-pending';
    btn.textContent = 'Invitation Pending ⏳';
    btn.disabled = true;
  } else if (status === 'pending_received') {
    btn.className = 'btn btn-primary btn-sm';
    btn.textContent = 'Accept Connection Request';
    btn.onclick = () => acceptRequest(targetId);
  } else {
    btn.className = 'btn btn-primary btn-sm';
    btn.textContent = '+ Connect';
    btn.onclick = () => connectStudent(targetId);
  }
}

function loadStudentContributions(studentId) {
  const resWrap = document.getElementById('studentResourcesContainer');
  const artWrap = document.getElementById('studentArticlesContainer');

  // Shared resources
  const localResources = JSON.parse(localStorage.getItem('uniskill_local_resources') || '[]');
  const studentRes = localResources.filter(r => r.user_id === studentId);

  if (resWrap) {
    if (studentRes.length === 0) {
      resWrap.innerHTML = `<p style="font-size: 13px; color: var(--text-muted);">No shared resources uploaded yet.</p>`;
    } else {
      resWrap.innerHTML = studentRes.map(r => `
        <div style="padding: 10px 0; border-bottom: 1px solid var(--border-color);">
          <div style="font-weight: 600; font-size: 13.5px;"><a href="resources/resource-details.html?id=${r.id}">${escapeHTML(r.title)}</a></div>
          <span style="font-size: 11.5px; color: var(--text-subtle);">${escapeHTML(r.category_name || 'Resource')} • ${escapeHTML(r.file_size || 'PDF')}</span>
        </div>
      `).join('');
    }
  }

  // Articles
  const localArticles = JSON.parse(localStorage.getItem('uniskill_local_articles') || '[]');
  const studentArt = localArticles.filter(a => a.user_id === studentId);

  if (artWrap) {
    if (studentArt.length === 0) {
      artWrap.innerHTML = `<p style="font-size: 13px; color: var(--text-muted);">No knowledge articles published yet.</p>`;
    } else {
      artWrap.innerHTML = studentArt.map(a => `
        <div style="padding: 10px 0; border-bottom: 1px solid var(--border-color);">
          <div style="font-weight: 600; font-size: 13.5px;"><a href="articles/article-details.html?id=${a.id}">${escapeHTML(a.title)}</a></div>
          <span style="font-size: 11.5px; color: var(--text-subtle);">${escapeHTML(a.category || 'Article')}</span>
        </div>
      `).join('');
    }
  }
}

// ------------------------------------------------------------------------------
// Helper: System Notification Creator
// ------------------------------------------------------------------------------
function createNotification(targetUserId, message) {
  const notifs = JSON.parse(localStorage.getItem('uniskill_notifications') || '[]');
  const newNotif = {
    id: 'notif-' + Date.now(),
    user_id: targetUserId,
    message: message,
    is_read: false,
    created_at: new Date().toISOString()
  };
  notifs.unshift(newNotif);
  localStorage.setItem('uniskill_notifications', JSON.stringify(notifs));
}

// ------------------------------------------------------------------------------
// Verified Skill Endorsement & Review Modals (Feature 1)
// ------------------------------------------------------------------------------
function openEndorseModal(skillName, studentId, studentName) {
  const current = getActiveStudent();
  if (current && current.id === studentId) {
    alert('Students cannot endorse their own skills. Academic endorsements must be verified by classmates!');
    return;
  }

  const modal = document.getElementById('endorseSkillModal');
  if (!modal) return;

  document.getElementById('endorseSkillName').value = skillName;
  document.getElementById('endorseStudentId').value = studentId;
  const header = document.getElementById('endorseModalHeader');
  if (header) {
    header.innerHTML = `Endorse <strong>${escapeHTML(studentName || 'Student')}</strong> for academic skill: <strong>${escapeHTML(skillName)}</strong>.`;
  }
  setSkillRating(5);
  modal.classList.add('active');
}

function setSkillRating(stars) {
  const input = document.getElementById('endorseRatingVal');
  if (input) input.value = stars;
  const spans = document.querySelectorAll('#skillStarSelectArea span');
  spans.forEach((span, idx) => {
    span.style.color = (idx < stars) ? '#f59e0b' : '#d1d5db';
  });
}

function handleSkillEndorsementSubmit(e) {
  e.preventDefault();
  const skillName = document.getElementById('endorseSkillName').value;
  const studentId = document.getElementById('endorseStudentId').value;
  const rating = document.getElementById('endorseRatingVal').value;
  const feedback = document.getElementById('endorseFeedbackInput').value;

  if (window.AcademicCore) {
    const res = window.AcademicCore.submitSkillReview(studentId, skillName, rating, feedback);
    if (res.success) {
      alert(res.message);
      closeModal('endorseSkillModal');
      // Reload profile to reflect new endorsements
      loadStudentProfile();
    } else {
      alert(res.message);
    }
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}
