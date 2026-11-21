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

  const client = window.supabaseClient;
  container.textContent = 'Loading your learning resources...';
  try {
    if (!client) throw new Error('Supabase connection unavailable.');
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) throw new Error('Please log in to view your resources.');
    const { data, error } = await client.from('resources')
      .select('id,user_id,title,description,category_id,file_url,file_name,file_size,created_at,categories(category_name)')
      .eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    myResourcesList = (data || []).map(item => ({
      ...item,
      category_name: item.categories?.category_name || 'General',
      file_type: (item.file_name || '').split('.').pop().toLowerCase()
    }));

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
              href="${escapeHTML(item.file_url)}" 
              download="${escapeHTML(item.file_name)}" 
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
    container.textContent = 'Could not load resources: ' + err.message;
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

  const client = window.supabaseClient;
  if (!client) return alert('Supabase connection unavailable.');
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return alert('Please log in again.');
  const { data, error } = await client.from('resources')
    .update({ title, description: desc, category_id: catId })
    .eq('id', editingResourceId).eq('user_id', user.id).select('id');
  if (error || !data?.length) return alert('Update failed: ' + (error?.message || 'Resource not found or permission denied.'));

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
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase connection unavailable.');
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) throw new Error('Please log in again.');
    const item = myResourcesList.find(r => r.id === id);
    if (!item || item.user_id !== user.id) throw new Error('You cannot delete this resource.');
    const { data, error } = await client.from('resources').delete()
      .eq('id', id).eq('user_id', user.id).select('id');
    if (error || !data?.length) throw new Error(error?.message || 'Delete denied.');
    // Delete stored file only after the database row was successfully removed.
    // Storage policy controls whether this authenticated user can remove it.
    try {
      const url = new URL(item.file_url);
      const marker = '/storage/v1/object/public/learning-resources/';
      const index = url.pathname.indexOf(marker);
      if (index >= 0) {
        const path = decodeURIComponent(url.pathname.slice(index + marker.length));
        const { error: storageError } = await client.storage.from('learning-resources').remove([path]);
        if (storageError) console.warn('Resource deleted, but storage cleanup failed:', storageError);
      }
    } catch (storageException) { console.warn('Storage cleanup skipped:', storageException); }
    alert('Resource deleted successfully.');
    await loadMyResources();
  } catch (err) {
    console.error('Delete error:', err);
    alert('Could not delete resource: ' + err.message);
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
