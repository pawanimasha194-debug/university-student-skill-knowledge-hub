/**
 * ==============================================================================
 * UniSkill Hub - Learning Resource Management
 * File: js/resources.js
 * Module: Member 2 – Learning Resource Management & Storage
 * Functions:
 *   - loadResources()
 *   - searchResources()
 *   - filterResources()
 *   - bookmarkResource()
 * ==============================================================================
 */

// Global state for resources list
let allResources = [];
let userBookmarks = new Set();
let currentCategory = 'all';
let currentFaculty = 'all';
let currentSort = 'newest';
let searchQuery = '';
let showOnlyBookmarked = false;

// Sample initial resources for demonstration if database is fresh
const defaultSampleResources = [
  {
    id: 'res-sample-01',
    user_id: 'usr_samudi_01',
    title: 'Introduction to Statistics – Week 1 to 5 Lecture Notes',
    description: 'Comprehensive undergraduate lecture summaries covering probability distributions, binomial & normal distributions, hypothesis testing, and past paper question walk-throughs.',
    category_id: 2,
    category_name: 'Statistics',
    faculty: 'Faculty of Applied Sciences',
    uploader_name: 'Samudi Wijesinghe',
    uploader_image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    uploader_degree: 'BSc Applied Sciences',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_name: 'Intro_to_Statistics_Complete_Notes.pdf',
    file_size: '2.4 MB',
    file_type: 'pdf',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'res-sample-02',
    user_id: 'usr_kaveen_02',
    title: 'Relational Database Normalization (1NF to BCNF) Guide',
    description: 'Handcrafted exam revision cheat sheet with step-by-step table decompositions, functional dependency diagrams, and sample database solutions for Software Engineering students.',
    category_id: 3,
    category_name: 'Programming',
    faculty: 'Faculty of Computing & Technology',
    uploader_name: 'Kaveen Perera',
    uploader_image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    uploader_degree: 'BSc Computing & IT',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_name: 'Database_Normalization_Guide.pdf',
    file_size: '1.8 MB',
    file_type: 'pdf',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'res-sample-03',
    user_id: 'usr_tharushi_03',
    title: 'Bioinformatics & Python Scripting Lecture Slides',
    description: 'Complete presentation slides explaining Python biopython library, DNA sequence alignment algorithms, and fasta format processing.',
    category_id: 3,
    category_name: 'Programming',
    faculty: 'Faculty of Science',
    uploader_name: 'Tharushi Fernando',
    uploader_image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    uploader_degree: 'Faculty of Science',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_name: 'Bioinformatics_Python_Slides.pptx',
    file_size: '4.5 MB',
    file_type: 'pptx',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'res-sample-04',
    user_id: 'usr_malith_04',
    title: 'Computer Networks – OSI Model & TCP/IP Protocol Analysis',
    description: 'Concise summary of network layers, packet encapsulation, subnetting equations, and routing protocols (OSPF, BGP) for mid-semester evaluations.',
    category_id: 4,
    category_name: 'Networking',
    faculty: 'Faculty of Engineering',
    uploader_name: 'Malith Jayasuriya',
    uploader_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    uploader_degree: 'BSc Engineering',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_name: 'Computer_Networks_OSI_Summary.docx',
    file_size: '1.2 MB',
    file_type: 'docx',
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'res-sample-05',
    user_id: 'usr_ananya_05',
    title: 'Linear Algebra & Matrix Operations for Data Science',
    description: 'Step-by-step formulas, eigenvalues, eigenvectors, and matrix decompositions commonly used in machine learning algorithms.',
    category_id: 1,
    category_name: 'Mathematics',
    faculty: 'Faculty of Applied Sciences',
    uploader_name: 'Ananya Sharma',
    uploader_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    uploader_degree: 'BSc Information Systems',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_name: 'Linear_Algebra_Matrices_Summary.pdf',
    file_size: '3.1 MB',
    file_type: 'pdf',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Check if active user session is present
  updateNavUser();

  // Check URL query parameters for active filter (e.g., ?filter=bookmarked or ?category=Statistics)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('filter') === 'bookmarked') {
    showOnlyBookmarked = true;
    const bookmarkToggleBtn = document.getElementById('filterBookmarkedBtn');
    if (bookmarkToggleBtn) bookmarkToggleBtn.classList.add('active');
  }

  if (urlParams.get('category')) {
    currentCategory = urlParams.get('category');
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) categorySelect.value = currentCategory;
  }

  // Load resources and user bookmarks
  await loadUserBookmarks();
  await loadResources();

  // Attach search and filter event listeners
  setupEventListeners();
});

/**
 * ------------------------------------------------------------------------------
 * Setup DOM Event Listeners for Search & Filters
 * ------------------------------------------------------------------------------
 */
function setupEventListeners() {
  const searchInput = document.getElementById('resourceSearchInput');
  const categorySelect = document.getElementById('categorySelect');
  const facultySelect = document.getElementById('facultySelect');
  const sortSelect = document.getElementById('sortSelect');
  const bookmarkToggleBtn = document.getElementById('filterBookmarkedBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      searchResources();
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      filterResources();
    });
  }

  if (facultySelect) {
    facultySelect.addEventListener('change', (e) => {
      currentFaculty = e.target.value;
      filterResources();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      filterResources();
    });
  }

  if (bookmarkToggleBtn) {
    bookmarkToggleBtn.addEventListener('click', () => {
      showOnlyBookmarked = !showOnlyBookmarked;
      bookmarkToggleBtn.classList.toggle('active', showOnlyBookmarked);
      filterResources();
    });
  }
}

/**
 * ------------------------------------------------------------------------------
 * 1. loadResources()
 * Fetches learning resources from Supabase Database or Local Storage
 * ------------------------------------------------------------------------------
 */
async function loadResources() {
  const container = document.getElementById('resourcesFeedContainer');
  const totalCountEl = document.getElementById('totalResourcesCount');

  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
      <div class="spinner" style="border-top-color: var(--primary-color); width: 28px; height: 28px; margin-bottom: 12px;"></div>
      <p>Loading learning resources...</p>
    </div>
  `;

  try {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase client is not available.');
    const { data, error } = await client.from('resources')
      .select('id,user_id,title,description,category_id,file_url,file_name,file_size,created_at,categories(category_name),profiles:user_id(full_name,faculty,degree,profile_image)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    allResources = (data || []).map(item => ({
      ...item,
      category_name: item.categories?.category_name || 'General',
      faculty: item.profiles?.faculty || 'University Student',
      uploader_name: item.profiles?.full_name || 'Student Uploader',
      uploader_image: item.profiles?.profile_image || '',
      uploader_degree: item.profiles?.degree || 'Undergraduate',
      file_type: getFileExtension(item.file_name),
      file_size: item.file_size || 'Unknown size'
    }));

    // Update count in UI
    if (totalCountEl) totalCountEl.textContent = allResources.length;

    // Apply current filters and render
    filterResources();

  } catch (err) {
    console.error('Error loading resources:', err);
    container.innerHTML = `
      <div class="empty-state-box">
        <p>Could not load resources. Please refresh the page.</p>
      </div>
    `;
  }
}

/**
 * ------------------------------------------------------------------------------
 * 2. searchResources()
 * Filters resources in real-time by search query
 * ------------------------------------------------------------------------------
 */
function searchResources() {
  filterResources();
}

/**
 * ------------------------------------------------------------------------------
 * 3. filterResources()
 * Filters by category, faculty, bookmarks, and sorts the list
 * ------------------------------------------------------------------------------
 */
function filterResources() {
  const container = document.getElementById('resourcesFeedContainer');
  const countEl = document.getElementById('showingCount');
  if (!container) return;

  let filtered = [...allResources];

  // A. Filter by Category
  if (currentCategory && currentCategory !== 'all') {
    filtered = filtered.filter(item => 
      item.category_name && item.category_name.toLowerCase() === currentCategory.toLowerCase()
    );
  }

  // B. Filter by Faculty
  if (currentFaculty && currentFaculty !== 'all') {
    filtered = filtered.filter(item => 
      item.faculty && item.faculty.toLowerCase().includes(currentFaculty.toLowerCase())
    );
  }

  // C. Filter by Bookmarked only
  if (showOnlyBookmarked) {
    filtered = filtered.filter(item => userBookmarks.has(item.id));
  }

  // D. Search Query (Title, Description, Category, Uploader, Faculty)
  if (searchQuery) {
    filtered = filtered.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(searchQuery);
      const matchDesc = item.description.toLowerCase().includes(searchQuery);
      const matchCat = item.category_name.toLowerCase().includes(searchQuery);
      const matchUploader = item.uploader_name.toLowerCase().includes(searchQuery);
      const matchFaculty = item.faculty.toLowerCase().includes(searchQuery);
      return matchTitle || matchDesc || matchCat || matchUploader || matchFaculty;
    });
  }

  // E. Sort
  if (currentSort === 'helpful') {
    filtered.sort((a, b) => {
      const ratA = window.AcademicCore ? (window.AcademicCore.getStoredResourceRatings()[a.id]?.helpful || 0) : 0;
      const ratB = window.AcademicCore ? (window.AcademicCore.getStoredResourceRatings()[b.id]?.helpful || 0) : 0;
      return ratB - ratA;
    });
  } else if (currentSort === 'newest') {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (currentSort === 'oldest') {
    filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (currentSort === 'title') {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (countEl) countEl.textContent = filtered.length;

  // Render cards
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 class="empty-state-title">No resources match your filters</h3>
        <p class="empty-state-desc">Try clearing your search terms or selecting another category.</p>
        <button class="btn btn-outline btn-sm" onclick="resetAllFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => renderResourceCardHTML(item)).join('');

  // Bind interactive buttons (Bookmarks & Direct Downloads)
  bindResourceCardActions(container);
}

/**
 * ------------------------------------------------------------------------------
 * Helper: Render a single Resource Feed Card HTML
 * ------------------------------------------------------------------------------
 */
function renderResourceCardHTML(item) {
  const isBookmarked = userBookmarks.has(item.id);
  const fileExt = (item.file_type || getFileExtension(item.file_name)).toUpperCase();
  const timeFormatted = formatTimeAgo(item.created_at);

  // File icon CSS class
  let iconClass = 'file-type-pdf';
  if (fileExt.includes('PPT')) iconClass = 'file-type-ppt';
  else if (fileExt.includes('DOC')) iconClass = 'file-type-doc';

  return `
    <article class="resource-card" id="card-${item.id}">
      <div class="resource-card-header">
        
        <!-- File Format Icon Badge -->
        <div class="file-type-icon ${iconClass}">
          <span>${fileExt}</span>
        </div>

        <!-- Title and Uploader Details -->
        <div class="resource-header-info">
          <h3 class="resource-title">
            <a href="resource-details.html?id=${item.id}">${escapeHTML(item.title)}</a>
          </h3>

          <div class="resource-uploader-meta">
            <img src="${item.uploader_image}" alt="${escapeHTML(item.uploader_name)}">
            <span class="resource-uploader-name">${escapeHTML(item.uploader_name)}</span>
            <span>•</span>
            <span>${escapeHTML(item.faculty)}</span>
            <span>•</span>
            <span>${timeFormatted}</span>
          </div>

          <div class="resource-badges">
            <span class="category-tag">${escapeHTML(item.category_name)}</span>
            <span class="file-meta-pill">${fileExt} • ${escapeHTML(item.file_size)}</span>
          </div>
        </div>

      </div>

      <!-- Resource Description Preview -->
      <div class="resource-description">
        <p>${escapeHTML(item.description)}</p>
      </div>

      <!-- Action Buttons Footer -->
      <div class="resource-card-actions">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <a href="resource-details.html?id=${item.id}" class="btn btn-secondary btn-sm">
            View Details
          </a>

          <!-- Resource Quality Rating (Feature 13) -->
          <div class="resource-helpfulness-widget">
            <span style="color: #f59e0b; font-weight: 700;">⭐ ${(window.AcademicCore && window.AcademicCore.getStoredResourceRatings()[item.id]?.averageRating) || 4.9}</span>
            <button type="button" class="helpfulness-btn" onclick="voteResourceHelpful('${item.id}', true)">
              👍 Helpful (${(window.AcademicCore && window.AcademicCore.getStoredResourceRatings()[item.id]?.helpful) || 28})
            </button>
            <button type="button" class="helpfulness-btn" onclick="voteResourceHelpful('${item.id}', false)">
              👎 (${(window.AcademicCore && window.AcademicCore.getStoredResourceRatings()[item.id]?.notHelpful) || 0})
            </button>
          </div>
        </div>

        <div class="resource-action-group">
          <!-- Bookmark Button -->
          <button 
            type="button" 
            class="btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" 
            data-id="${item.id}"
            title="${isBookmarked ? 'Remove Bookmark' : 'Save Resource'}"
          >
            <svg width="15" height="15" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
            <span>${isBookmarked ? 'Saved' : 'Save'}</span>
          </button>

          <!-- Direct Download Button -->
          <a 
            href="${escapeHTML(item.file_url)}" 
            download="${item.file_name}" 
            target="_blank" 
            class="btn btn-outline btn-sm btn-download-resource"
            data-id="${item.id}"
            data-url="${escapeHTML(item.file_url)}"
            data-name="${escapeHTML(item.file_name)}"
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Download
          </a>
        </div>
      </div>
    </article>
  `;
}

/**
 * ------------------------------------------------------------------------------
 * 4. bookmarkResource()
 * Saves or removes a resource bookmark in Supabase Database and localStorage
 * ------------------------------------------------------------------------------
 */
async function bookmarkResource(resourceId, btnElement) {
  const client = window.supabaseClient;
  if (!client) return showNotification('Supabase connection unavailable.', 'error');
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return showNotification('Please log in to save resources.', 'error');
  const wasSaved = userBookmarks.has(resourceId);
  const query = wasSaved
    ? client.from('bookmarks').delete().eq('user_id', user.id).eq('resource_id', resourceId)
    : client.from('bookmarks').insert({ user_id: user.id, resource_id: resourceId });
  const { error } = await query;
  if (error) return showNotification(`Bookmark failed: ${error.message}`, 'error');
  if (wasSaved) userBookmarks.delete(resourceId);
  else userBookmarks.add(resourceId);
  if (btnElement) {
    btnElement.classList.toggle('bookmarked', !wasSaved);
    const label = btnElement.querySelector('span');
    if (label) label.textContent = wasSaved ? 'Save' : 'Saved';
    const svg = btnElement.querySelector('svg');
    if (svg) svg.setAttribute('fill', wasSaved ? 'none' : 'currentColor');
  }
  showNotification(wasSaved ? 'Bookmark removed.' : 'Resource saved.', 'success');
}

async function loadUserBookmarks() {
  userBookmarks.clear();
  const client = window.supabaseClient;
  if (!client) return;
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return;
  const { data, error } = await client.from('bookmarks').select('resource_id').eq('user_id', user.id);
  if (error) { console.error('Bookmark loading failed:', error); return; }
  (data || []).forEach(row => userBookmarks.add(row.resource_id));
}

/**
 * Bind click actions to generated resource cards
 */
function bindResourceCardActions(container) {
  // Bookmark buttons
  container.querySelectorAll('.btn-bookmark').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const resId = btn.getAttribute('data-id');
      bookmarkResource(resId, btn);
    });
  });

  // Download buttons tracking
  container.querySelectorAll('.btn-download-resource').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      showNotification(`Downloading ${name}...`, 'info');
    });
  });
}

/**
 * Reset all filter selections
 */
function resetAllFilters() {
  searchQuery = '';
  currentCategory = 'all';
  currentFaculty = 'all';
  currentSort = 'newest';
  showOnlyBookmarked = false;

  const searchInput = document.getElementById('resourceSearchInput');
  const catSelect = document.getElementById('categorySelect');
  const facSelect = document.getElementById('facultySelect');
  const sortSelect = document.getElementById('sortSelect');
  const bmBtn = document.getElementById('filterBookmarkedBtn');

  if (searchInput) searchInput.value = '';
  if (catSelect) catSelect.value = 'all';
  if (facSelect) facSelect.value = 'all';
  if (sortSelect) sortSelect.value = 'newest';
  if (bmBtn) bmBtn.classList.remove('active');

  filterResources();
}

/**
 * Utility: Get currently logged in student object
 */
function getCurrentStudent() {
  const active = localStorage.getItem('uniskill_active_session');
  if (active) {
    try {
      const parsed = JSON.parse(active);
      return parsed.profile || parsed.user;
    } catch (e) {}
  }
  return null;
}

/**
 * Update top navbar user avatar and name
 */
function updateNavUser() {
  const student = getCurrentStudent();
  const navName = document.getElementById('navUserName');
  const navAvatar = document.getElementById('navUserAvatar');

  if (student) {
    if (navName) navName.textContent = student.full_name ? student.full_name.split(' ')[0] : 'Student';
    if (navAvatar && student.profile_image) navAvatar.src = student.profile_image;
  }
}

/**
 * Utility: Get file extension
 */
function getFileExtension(filename) {
  if (!filename) return 'pdf';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : 'pdf';
}

/**
 * Utility: Format friendly relative time
 */
function formatTimeAgo(isoString) {
  if (!isoString) return 'Recently';
  const date = new Date(isoString);
  const diffDays = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

/**
 * Utility: Escape HTML to avoid XSS
 */
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

/**
 * Utility: Clean Notification Toast Banner
 */
function showNotification(message, type = 'info') {
  let toast = document.getElementById('globalNotificationToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalNotificationToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 18px;
      border-radius: 6px;
      font-size: 13.5px;
      font-weight: 600;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
      display: none;
    `;
    document.body.appendChild(toast);
  }

  if (type === 'success') {
    toast.style.backgroundColor = '#def7ec';
    toast.style.color = '#03543f';
    toast.style.border = '1px solid #bcf0da';
  } else {
    toast.style.backgroundColor = '#e1effe';
    toast.style.color = '#1e429f';
    toast.style.border = '1px solid #b4c6fc';
  }

  toast.textContent = message;
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 2800);
}

// Make functions globally available
window.loadResources = loadResources;
window.searchResources = searchResources;
window.filterResources = filterResources;
window.bookmarkResource = bookmarkResource;
window.resetAllFilters = resetAllFilters;
