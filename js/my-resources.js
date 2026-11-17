/**
 * ==============================================================================
 * UniSkill Hub - My Uploaded Resources View Logic
 * File: js/my-resources.js
 * Module: Member 2 – Learning Resource Management & Storage
 * Functions:
 *   - loadMyResources()
 *   - editResource()
 *   - deleteResource()
 * ==============================================================================
 */

let myResourcesList = [];
let editingResourceId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Update navbar
  updateNavUser();

  // Load resources uploaded by the active student
  await loadMyResources();

  // Bind edit modal form submit
  const editForm = document.getElementById('editResourceForm');
  if (editForm) {
    editForm.addEventListener('submit', handleSaveResourceEdit);
  }

  // Close modal button
  const closeModalBtn = document.getElementById('closeEditModal');
  const cancelModalBtn = document.getElementById('cancelEditModal');
  const modal = document.getElementById('editResourceModal');

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
  }
  if (cancelModalBtn && modal) {
    cancelModalBtn.addEventListener('click', () => modal.classList.remove('active'));
  }
});

/**
 * ------------------------------------------------------------------------------
 * 1. loadMyResources()
 * Fetches only resources belonging to the active student
 * ------------------------------------------------------------------------------
 */
async function loadMyResources() {
  const container = document.getElementById('myResourcesContainer');
  const countBadge = document.getElementById('myTotalCount');
  if (!container) return;

  const currentStudent = getCurrentStudent();
  const userId = currentStudent ? currentStudent.id : 'demo-student-id-01';

  container.innerHTML = `
    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
      <div class="spinner" style="border-top-color: var(--primary-color); width: 28px; height: 28px; margin-bottom: 12px;"></div>
      <p>Loading your learning resources...</p>
    </div>
  `;

  try {
    let uploads = [];

    // A. Fetch from Supabase
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && window.supabaseClient && currentStudent) {
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
            categories ( category_name )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          uploads = data.map(item => ({
            id: item.id,
            user_id: item.user_id,
            title: item.title,
            description: item.description || '',
            category_id: item.category_id,
            category_name: item.categories?.category_name || 'General',
            file_url: item.file_url,
            file_name: item.file_name,
            file_size: item.file_size || 'Unknown size',
            file_type: item.file_name.split('.').pop().toLowerCase(),
            created_at: item.created_at
          }));
        }
      } catch (err) {
        console.warn('Could not query Supabase my-resources:', err);
      }
    }

    // B. Check localStorage
    const localUploads = JSON.parse(localStorage.getItem('uniskill_local_resources') || '[]');
    const myLocalUploads = localUploads.filter(r => r.user_id === userId || !r.user_id);

    // Merge both
    const map = new Map();
    [...uploads, ...myLocalUploads].forEach(item => map.set(item.id, item));

    // If empty and current user is Samudi or demo student, include sample to showcase functionality
    if (map.size === 0 && (currentStudent?.full_name?.includes('Samudi') || !currentStudent)) {
      map.set('res-sample-01', {
        id: 'res-sample-01',
        user_id: userId,
        title: 'Introduction to Statistics – Week 1 to 5 Lecture Notes',
        description: 'Comprehensive undergraduate lecture summaries covering probability distributions and hypothesis testing.',
        category_name: 'Statistics',
        category_id: 2,
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        file_name: 'Intro_to_Statistics_Complete_Notes.pdf',
        file_size: '2.4 MB',
        file_type: 'pdf',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    myResourcesList = Array.from(map.values());

    if (countBadge) countBadge.textContent = myResourcesList.length;

    if (myResourcesList.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <h3 class="empty-state-title">You haven't uploaded any resources yet</h3>
          <p class="empty-state-desc">Share your lecture notes, summaries, or past paper guides with your university peers.</p>
          <a href="upload-resource.html" class="btn btn-primary btn-sm">+ Upload Your First Resource</a>
        </div>
      `;
      return;
    }

    // Render uploaded resource items
    container.innerHTML = myResourcesList.map(item => {
      const fileExt = (item.file_type || 'pdf').toUpperCase();
      const uploadDate = new Date(item.created_at).toLocaleDateString();

      let iconClass = 'file-type-pdf';
      if (fileExt.includes('PPT')) iconClass = 'file-type-ppt';
      else if (fileExt.includes('DOC')) iconClass = 'file-type-doc';

      return `
        <div class="my-resource-item" id="my-res-${item.id}">
          <div class="my-resource-info">
            <div class="file-type-icon ${iconClass}">
              <span>${fileExt}</span>
            </div>
            <div class="my-resource-details">
              <h4 class="my-resource-title">
                <a href="resource-details.html?id=${item.id}">${escapeHTML(item.title)}</a>
              </h4>
              <div class="my-resource-meta">
                <span class="category-tag">${escapeHTML(item.category_name)}</span>
                <span>${escapeHTML(item.file_size)}</span>
                <span>• Uploaded on ${uploadDate}</span>
              </div>
            </div>
          </div>

          <div class="my-resource-actions">
            <!-- Download Button -->
            <a 
              href="${item.file_url}" 
              download="${item.file_name}" 
              target="_blank" 
              class="btn btn-secondary btn-sm" 
              title="Download file"
            >
              Download
            </a>

            <!-- Edit Button -->
            <button 
              type="button" 
              class="btn btn-outline btn-sm btn-edit-res" 
              data-id="${item.id}"
            >
              Edit
            </button>

            <!-- Delete Button -->
            <button 
              type="button" 
              class="btn btn-danger-outline btn-sm btn-delete-res" 
              data-id="${item.id}"
            >
              Delete
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach actions
    container.querySelectorAll('.btn-edit-res').forEach(btn => {
      btn.addEventListener('click', () => editResource(btn.getAttribute('data-id')));
    });

    container.querySelectorAll('.btn-delete-res').forEach(btn => {
      btn.addEventListener('click', () => deleteResource(btn.getAttribute('data-id')));
    });

  } catch (err) {
    console.error('Error in loadMyResources():', err);
  }
}

/**
 * ------------------------------------------------------------------------------
 * 2. editResource(id)
 * Opens edit modal with resource data prefilled
 * ------------------------------------------------------------------------------
 */
function editResource(id) {
  const item = myResourcesList.find(r => r.id === id);
  if (!item) return;

  editingResourceId = id;

  const modal = document.getElementById('editResourceModal');
  const titleInput = document.getElementById('editTitle');
  const descInput = document.getElementById('editDescription');
  const catSelect = document.getElementById('editCategory');

  if (titleInput) titleInput.value = item.title;
  if (descInput) descInput.value = item.description || '';
  if (catSelect) catSelect.value = item.category_id || 1;

  if (modal) modal.classList.add('active');
}

async function handleSaveResourceEdit(e) {
  e.preventDefault();

  if (!editingResourceId) return;

  const title = document.getElementById('editTitle').value.trim();
  const desc = document.getElementById('editDescription').value.trim();
  const catSelect = document.getElementById('editCategory');
  const catId = parseInt(catSelect.value, 10);
  const catName = catSelect.options[catSelect.selectedIndex]?.text || 'General';

  if (!title) {
    alert('Please enter a title.');
    return;
  }

  // Update in live Supabase if connected
  if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && window.supabaseClient) {
    try {
      await window.supabaseClient
        .from('resources')
        .update({
          title: title,
          description: desc,
          category_id: catId
        })
        .eq('id', editingResourceId);
    } catch (err) {
      console.warn('Could not update live Supabase resource:', err);
    }
  }

  // Update in localStorage
  const localUploads = JSON.parse(localStorage.getItem('uniskill_local_resources') || '[]');
  const foundIndex = localUploads.findIndex(r => r.id === editingResourceId);
  if (foundIndex !== -1) {
    localUploads[foundIndex].title = title;
    localUploads[foundIndex].description = desc;
    localUploads[foundIndex].category_id = catId;
    localUploads[foundIndex].category_name = catName;
    localStorage.setItem('uniskill_local_resources', JSON.stringify(localUploads));
  }

  // Close modal and refresh list
  const modal = document.getElementById('editResourceModal');
  if (modal) modal.classList.remove('active');

  alert('Resource updated successfully.');
  loadMyResources();
}

/**
 * ------------------------------------------------------------------------------
 * 3. deleteResource(id)
 * Confirms with user and deletes resource from Supabase & localStorage
 * ------------------------------------------------------------------------------
 */
async function deleteResource(id) {
  const confirmed = confirm('Are you sure you want to delete this resource? This action cannot be undone.');
  if (!confirmed) return;

  try {
    // Delete from Supabase
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && window.supabaseClient) {
      await window.supabaseClient
        .from('resources')
        .delete()
        .eq('id', id);
    }

    // Delete from localStorage
    const localUploads = JSON.parse(localStorage.getItem('uniskill_local_resources') || '[]');
    const updated = localUploads.filter(r => r.id !== id);
    localStorage.setItem('uniskill_local_resources', JSON.stringify(updated));

    alert('Resource deleted successfully.');
    loadMyResources();

  } catch (err) {
    console.error('Delete error:', err);
    alert('Could not delete resource. Please try again.');
  }
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

window.loadMyResources = loadMyResources;
window.editResource = editResource;
window.deleteResource = deleteResource;
