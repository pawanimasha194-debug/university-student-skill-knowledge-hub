/**
 * ==============================================================================
 * UniSkill Hub - Resource Details View Logic
 * File: js/resource-details.js
 * Module: Member 2 – Learning Resource Management & Storage
 * Functions:
 *   - loadResource()
 *   - downloadResource()
 * ==============================================================================
 */

let currentResourceData = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Update navbar user avatar
  updateNavUser();

  // Load resource based on ?id= query param
  await loadResource();

  // Bind actions
  setupDetailActions();
});

/**
 * ------------------------------------------------------------------------------
 * 1. loadResource()
 * Reads ?id= from URL and renders the complete resource details
 * ------------------------------------------------------------------------------
 */
async function loadResource() {
  const urlParams = new URLSearchParams(window.location.search);
  const resourceId = urlParams.get('id');

  const container = document.getElementById('resourceDetailsContainer');
  const relatedContainer = document.getElementById('relatedResourcesContainer');

  if (!resourceId) {
    if (container) {
      container.innerHTML = `
        <div class="empty-state-box">
          <p>No resource ID specified. <a href="resources.html">Browse all learning resources &rarr;</a></p>
        </div>
      `;
    }
    return;
  }

  try {
    let foundResource = null;

    // A. Check Supabase Database
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('resources')
          .select(`
            id,
            user_id,
            title,
            description,
            category_id,
            file_url,
            file_name,
            file_size,
            created_at,
            categories ( category_name ),
            profiles:user_id ( full_name, faculty, degree, profile_image )
          `)
          .eq('id', resourceId)
          .maybeSingle();

        if (data) {
          foundResource = {
            id: data.id,
            user_id: data.user_id,
            title: data.title,
            description: data.description || '',
            category_name: data.categories?.category_name || 'General',
            faculty: data.profiles?.faculty || 'Faculty of Science',
            uploader_name: data.profiles?.full_name || 'Student Uploader',
            uploader_image: data.profiles?.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.title)}`,
            uploader_degree: data.profiles?.degree || 'Undergraduate Degree',
            file_url: data.file_url,
            file_name: data.file_name,
            file_size: data.file_size || 'Unknown size',
            file_type: data.file_name.split('.').pop().toLowerCase(),
            created_at: data.created_at
          };
        }
      } catch (err) {
        console.warn('Could not query Supabase resource details:', err);
      }
    }

    // B. Check localStorage for newly uploaded resources
    if (!foundResource) {
      const localUploads = JSON.parse(localStorage.getItem('uniskill_local_resources') || '[]');
      foundResource = localUploads.find(r => r.id === resourceId);
    }

    // C. Check Sample initial resources list
    if (!foundResource && typeof defaultSampleResources !== 'undefined') {
      foundResource = defaultSampleResources.find(r => r.id === resourceId);
    }

    if (!foundResource) {
      // Fallback search sample list defined in resources.js or sample array
      const fallbackList = [
        {
          id: 'res-sample-01',
          title: 'Introduction to Statistics – Week 1 to 5 Lecture Notes',
          description: 'Comprehensive undergraduate lecture summaries covering probability distributions, binomial & normal distributions, hypothesis testing, and past paper question walk-throughs.',
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
          title: 'Relational Database Normalization (1NF to BCNF) Guide',
          description: 'Handcrafted exam revision cheat sheet with step-by-step table decompositions, functional dependency diagrams, and sample database solutions for Software Engineering students.',
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
        }
      ];
      foundResource = fallbackList.find(r => r.id === resourceId);
    }

    if (!foundResource) {
      container.innerHTML = `
        <div class="empty-state-box">
          <h3 class="empty-state-title">Resource Not Found</h3>
          <p class="empty-state-desc">The requested learning resource could not be found or may have been deleted.</p>
          <a href="resources.html" class="btn btn-primary btn-sm">Back to Resources Feed</a>
        </div>
      `;
      return;
    }

    currentResourceData = foundResource;
    renderResourceDetailsHTML(foundResource);

    // Load related resources in the same category
    loadRelatedResources(foundResource.category_name, foundResource.id);

  } catch (err) {
    console.error('Error in loadResource():', err);
  }
}

/**
 * Render the main resource details card
 */
function renderResourceDetailsHTML(item) {
  const container = document.getElementById('resourceDetailsContainer');
  if (!container) return;

  const fileExt = (item.file_type || 'pdf').toUpperCase();
  const uploadDate = new Date(item.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Check if bookmarked
  const currentStudent = getCurrentStudent();
  const userId = currentStudent ? currentStudent.id : 'guest-student';
  const bookmarks = JSON.parse(localStorage.getItem(`uniskill_bookmarks_${userId}`) || '[]');
  const isBookmarked = bookmarks.includes(item.id);

  let iconClass = 'file-type-pdf';
  if (fileExt.includes('PPT')) iconClass = 'file-type-ppt';
  else if (fileExt.includes('DOC')) iconClass = 'file-type-doc';

  container.innerHTML = `
    <div class="details-card">
      
      <!-- Top Title and Format Header -->
      <div class="details-header">
        <div class="file-type-icon ${iconClass}" style="width: 54px; height: 58px; font-size: 13px;">
          <span>${fileExt}</span>
        </div>
        <div style="flex: 1;">
          <span class="category-tag" style="margin-bottom: 6px;">${escapeHTML(item.category_name)}</span>
          <h1 class="details-title">${escapeHTML(item.title)}</h1>
          <p style="font-size: 12.5px; color: var(--text-muted);">Uploaded by <strong>${escapeHTML(item.uploader_name)}</strong> on ${uploadDate}</p>
        </div>
      </div>

      <!-- Quick Action Buttons Bar -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
        <button 
          type="button" 
          class="btn btn-primary" 
          id="mainDownloadBtn" 
          onclick="downloadResource()"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Download File (${escapeHTML(item.file_size)})
        </button>

        <button 
          type="button" 
          class="btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" 
          id="mainBookmarkBtn"
          style="padding: 8px 16px; font-size: 13.5px;"
        >
          <svg width="16" height="16" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
          </svg>
          <span>${isBookmarked ? 'Saved to Bookmarks' : 'Bookmark'}</span>
        </button>

        <button 
          type="button" 
          class="btn btn-secondary btn-sm" 
          onclick="navigator.clipboard.writeText(window.location.href); alert('Resource link copied to clipboard!');"
        >
          Share
        </button>
      </div>

      <!-- File Metadata Grid -->
      <div class="details-meta-grid">
        <div class="details-meta-item">
          <strong>File Format</strong>
          <span>${fileExt}</span>
        </div>
        <div class="details-meta-item">
          <strong>File Size</strong>
          <span>${escapeHTML(item.file_size)}</span>
        </div>
        <div class="details-meta-item">
          <strong>Category</strong>
          <span>${escapeHTML(item.category_name)}</span>
        </div>
        <div class="details-meta-item">
          <strong>Uploaded Date</strong>
          <span>${uploadDate}</span>
        </div>
      </div>

      <!-- Resource Description -->
      <h3 class="details-section-title">Resource Description</h3>
      <div class="details-body">
        <p>${escapeHTML(item.description)}</p>
      </div>

      <!-- Uploader Identity Card -->
      <h3 class="details-section-title" style="margin-top: 28px;">About the Uploader</h3>
      <div style="display: flex; align-items: center; gap: 14px; background-color: #fafbfc; border: 1px solid var(--border-color); border-radius: 8px; padding: 14px 18px;">
        <img src="${item.uploader_image}" alt="${escapeHTML(item.uploader_name)}" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover;">
        <div>
          <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${escapeHTML(item.uploader_name)}</h4>
          <p style="font-size: 13px; color: var(--text-muted);">${escapeHTML(item.uploader_degree || 'Undergraduate')} • ${escapeHTML(item.faculty)}</p>
        </div>
      </div>

    </div>
  `;
}

/**
 * ------------------------------------------------------------------------------
 * 2. downloadResource()
 * Initiates direct download from Supabase Storage or source file URL
 * ------------------------------------------------------------------------------
 */
function downloadResource() {
  if (!currentResourceData) {
    alert('Resource information not ready. Please refresh.');
    return;
  }

  const fileUrl = currentResourceData.file_url;
  const fileName = currentResourceData.file_name;

  // Create temporary anchor to trigger browser download
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  alert(`Starting download: ${fileName}`);
}

/**
 * Setup detail page buttons (Bookmark toggle)
 */
function setupDetailActions() {
  document.addEventListener('click', (e) => {
    const bmBtn = e.target.closest('#mainBookmarkBtn');
    if (bmBtn && currentResourceData) {
      e.preventDefault();
      toggleDetailBookmark(currentResourceData.id, bmBtn);
    }
  });
}

function toggleDetailBookmark(resourceId, btnElement) {
  const currentStudent = getCurrentStudent();
  const userId = currentStudent ? currentStudent.id : 'guest-student';
  let bookmarks = JSON.parse(localStorage.getItem(`uniskill_bookmarks_${userId}`) || '[]');

  const isBookmarked = bookmarks.includes(resourceId);
  if (isBookmarked) {
    bookmarks = bookmarks.filter(id => id !== resourceId);
    btnElement.classList.remove('bookmarked');
    btnElement.querySelector('span').textContent = 'Bookmark';
    btnElement.querySelector('svg').setAttribute('fill', 'none');
    alert('Resource removed from your saved list.');
  } else {
    bookmarks.push(resourceId);
    btnElement.classList.add('bookmarked');
    btnElement.querySelector('span').textContent = 'Saved to Bookmarks';
    btnElement.querySelector('svg').setAttribute('fill', 'currentColor');
    alert('Resource bookmarked successfully!');
  }

  localStorage.setItem(`uniskill_bookmarks_${userId}`, JSON.stringify(bookmarks));
}

/**
 * Load related resources in the sidebar matching the category
 */
function loadRelatedResources(categoryName, currentId) {
  const relatedBox = document.getElementById('relatedResourcesList');
  if (!relatedBox) return;

  const sampleRelated = [
    {
      id: 'res-sample-01',
      title: 'Introduction to Statistics – Week 1 to 5 Notes',
      category_name: 'Statistics',
      file_size: '2.4 MB'
    },
    {
      id: 'res-sample-02',
      title: 'Relational Database Normalization Guide',
      category_name: 'Programming',
      file_size: '1.8 MB'
    },
    {
      id: 'res-sample-04',
      title: 'Computer Networks – OSI Model Summary',
      category_name: 'Networking',
      file_size: '1.2 MB'
    }
  ];

  const matches = sampleRelated.filter(item => item.id !== currentId).slice(0, 3);

  relatedBox.innerHTML = matches.map(item => `
    <div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
      <h5 style="font-size: 13.5px; font-weight: 600; margin-bottom: 4px;">
        <a href="resource-details.html?id=${item.id}">${escapeHTML(item.title)}</a>
      </h5>
      <div style="font-size: 11.5px; color: var(--text-muted); display: flex; gap: 8px;">
        <span class="category-tag">${escapeHTML(item.category_name)}</span>
        <span>${escapeHTML(item.file_size)}</span>
      </div>
    </div>
  `).join('');
}

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

function updateNavUser() {
  const student = getCurrentStudent();
  const navName = document.getElementById('navUserName');
  const navAvatar = document.getElementById('navUserAvatar');

  if (student) {
    if (navName && student.full_name) navName.textContent = student.full_name.split(' ')[0];
    if (navAvatar && student.profile_image) navAvatar.src = student.profile_image;
  }
}

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

window.loadResource = loadResource;
window.downloadResource = downloadResource;
