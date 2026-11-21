/**
 * ==============================================================================
 * UniSkill Hub - Learning Resource Upload Logic
 * File: js/upload-resource.js
 * Module: Member 2 – Learning Resource Management & Storage
 * Functions:
 *   - uploadResource()
 *   - validateForm()
 * ==============================================================================
 */

// Selected file tracker
let selectedResourceFile = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check if student is signed in
  checkUserSessionBeforeUpload();

  // Setup form submission handler
  const uploadForm = document.getElementById('uploadResourceForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', uploadResource);
  }

  // Setup drag and drop / file input listeners
  setupFileInputHandlers();
});

/**
 * Ensures user is authenticated or demo-logged-in
 */
async function checkUserSessionBeforeUpload() {
  const alertBox = document.getElementById('uploadAlertBox');
  const client = window.supabaseClient;
  if (!client) return;
  const { data } = await client.auth.getUser();
  if (!data?.user && alertBox) {
    alertBox.style.display = 'block';
    alertBox.className = 'alert alert-info';
    alertBox.innerHTML = 'Please <a href="../login.html">login</a> to upload resources.';
  }
}

/**
 * Setup custom drag and drop and file selector UI
 */
function setupFileInputHandlers() {
  const fileInput = document.getElementById('resourceFile');
  const dropzone = document.getElementById('fileDropzone');
  const previewBox = document.getElementById('selectedFilePreview');
  const fileNameDisplay = document.getElementById('selectedFileName');
  const fileSizeDisplay = document.getElementById('selectedFileSize');
  const removeFileBtn = document.getElementById('removeFileBtn');

  if (!fileInput || !dropzone) return;

  // File chosen via Browse
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
  });

  // Drag and Drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  });

  // Remove file button
  if (removeFileBtn) {
    removeFileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      selectedResourceFile = null;
      fileInput.value = '';
      if (previewBox) previewBox.style.display = 'none';
      dropzone.style.display = 'block';
    });
  }

  function handleSelectedFile(file) {
    selectedResourceFile = file;
    if (fileNameDisplay) fileNameDisplay.textContent = file.name;
    if (fileSizeDisplay) fileSizeDisplay.textContent = formatBytes(file.size);
    if (previewBox) previewBox.style.display = 'flex';
    dropzone.style.display = 'none';
  }
}

/**
 * ------------------------------------------------------------------------------
 * 1. validateForm()
 * Checks required fields, file formats, and file size limits
 * ------------------------------------------------------------------------------
 */
function validateForm(title, description, category, file) {
  // Required: Title
  if (!title) {
    return { isValid: false, message: 'Please enter a resource title.' };
  }

  // Required: Description
  if (!description) {
    return { isValid: false, message: 'Please enter a description for your learning resource.' };
  }

  // Required: Category
  if (!category || category === '') {
    return { isValid: false, message: 'Please select a category.' };
  }

  // Required: File
  if (!file) {
    return { isValid: false, message: 'Please choose a file to upload.' };
  }

  // Allowed file extensions: PDF, PPT, PPTX, DOC, DOCX
  const allowedExtensions = ['pdf', 'ppt', 'pptx', 'doc', 'docx'];
  const fileExt = file.name.split('.').pop().toLowerCase();

  if (!allowedExtensions.includes(fileExt)) {
    return { isValid: false, message: 'Only PDF, PPT and DOCX files are allowed.' };
  }

  // Maximum allowed size: 20 MB (20 * 1024 * 1024 bytes)
  const maxSizeBytes = 20 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { isValid: false, message: 'File size exceeds the limit. Maximum allowed size is 20 MB.' };
  }

  return { isValid: true };
}

/**
 * ------------------------------------------------------------------------------
 * 2. uploadResource()
 * Handles file storage in Supabase Storage and database record insertion
 * ------------------------------------------------------------------------------
 */
async function uploadResource(event) {
  event.preventDefault();

  const alertBox = document.getElementById('uploadAlertBox');
  const submitBtn = document.getElementById('uploadSubmitBtn');
  const btnText = document.getElementById('uploadBtnText');
  const btnSpinner = document.getElementById('uploadBtnSpinner');

  showAlert('', 'clear');

  // 1. Read input values
  const title = document.getElementById('resourceTitle').value.trim();
  const description = document.getElementById('resourceDescription').value.trim();
  const categorySelect = document.getElementById('resourceCategory');
  const categoryId = categorySelect.value;
  const categoryName = categorySelect.options[categorySelect.selectedIndex]?.text || 'General';
  const file = selectedResourceFile;

  // 2. Validate form
  const validation = validateForm(title, description, categoryId, file);
  if (!validation.isValid) {
    showAlert(validation.message, 'error');
    return;
  }

  // 3. Require a real Supabase Auth session (never use demo identities).
  const client = window.supabaseClient;
  if (!client) {
    showAlert('Supabase connection unavailable. Refresh the page and try again.', 'error');
    return;
  }

  setLoading(true);
  let uploadedPath = null;
  try {
    const { data: authData, error: authError } = await client.auth.getUser();
    const user = authData?.user;
    if (authError || !user) throw new Error('Please sign in before uploading a resource.');

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueId = (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    uploadedPath = `${user.id}/${uniqueId}_${cleanFileName}`;

    const { error: storageError } = await client.storage
      .from('learning-resources')
      .upload(uploadedPath, file, { cacheControl: '3600', upsert: false });
    if (storageError) throw new Error(`File upload failed: ${storageError.message}`);

    const { data: publicUrlData } = client.storage
      .from('learning-resources').getPublicUrl(uploadedPath);
    const fileUrl = publicUrlData?.publicUrl;
    if (!fileUrl) throw new Error('Unable to generate uploaded file URL.');

    const { error: dbError } = await client.from('resources').insert({
      user_id: user.id,
      title,
      description,
      category_id: Number(categoryId),
      file_url: fileUrl,
      file_name: file.name,
      file_size: formatBytes(file.size)
    });
    if (dbError) throw new Error(`Resource could not be saved: ${dbError.message}`);

    uploadedPath = null; // Persisted: do not clean up the file.
    showAlert('Resource uploaded successfully! Redirecting to resources feed...', 'success');
    setTimeout(() => { window.location.href = 'resources.html'; }, 1500);
  } catch (err) {
    // Best effort cleanup of an uploaded file if database insertion fails.
    if (uploadedPath) {
      const { error: cleanupError } = await client.storage
        .from('learning-resources').remove([uploadedPath]);
      if (cleanupError) console.warn('Uploaded file cleanup failed:', cleanupError.message);
    }
    showAlert(err.message || 'Upload failed. Please try again.', 'error');
  } finally {
    setLoading(false);
  }

  function setLoading(isLoading) {
    if (submitBtn) submitBtn.disabled = isLoading;
    if (btnSpinner) btnSpinner.style.display = isLoading ? 'inline-block' : 'none';
    if (btnText) btnText.textContent = isLoading ? 'Uploading File...' : 'Upload Resource';
  }

  function showAlert(msg, type) {
    if (!alertBox) return;
    if (type === 'clear') {
      alertBox.style.display = 'none';
      alertBox.className = 'alert';
      alertBox.textContent = '';
      return;
    }
    alertBox.style.display = 'block';
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = msg;
  }
}

/**
 * Utility: Convert bytes to readable string (KB / MB)
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Global exposure
window.uploadResource = uploadResource;
window.validateForm = validateForm;
