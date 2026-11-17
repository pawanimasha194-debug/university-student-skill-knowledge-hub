/**
 * ==============================================================================
 * UniSkill Hub - Create Article Module
 * File: js/create-article.js
 * Module: Member 3 – Knowledge Feed & Article Publishing
 * Functions:
 *   - validateArticle()   — Checks all required fields before publish
 *   - publishArticle()    — Saves article to Supabase + localStorage fallback
 *   - previewImage()      — Shows selected image preview before upload
 *   - setupCharCounter()  — Live character counter for title and content
 * ==============================================================================
 */

// The student currently logged in
var currentStudent = null;

// The selected image file (optional)
var selectedImageFile = null;

// ------------------------------------------------------------------------------
// Page Initialization
// Runs when the page DOM is fully loaded
// ------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
  // Get the current logged-in student
  currentStudent = getCurrentStudent();

  // Update navbar with student info
  updateNavbarUser();

  // Set up the character counters for title and content fields
  setupCharCounter('articleTitle', 'titleCharCount', 100);
  setupCharCounter('articleContent', 'contentCharCount', 5000);

  // Set up the image file picker
  setupImagePicker();

  // Set up the publish form submit handler
  var form = document.getElementById('createArticleForm');
  if (form) {
    form.addEventListener('submit', function(event) {
      // Prevent the default form submission (page reload)
      event.preventDefault();
      publishArticle();
    });
  }

  // Set up the cancel button
  var cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      // Go back to the articles list
      window.location.href = 'articles.html';
    });
  }
});

// ------------------------------------------------------------------------------
// setupCharCounter()
// Shows a live "X / MAX characters" counter below the input
// ------------------------------------------------------------------------------
function setupCharCounter(inputId, counterId, maxLength) {
  var inputEl = document.getElementById(inputId);
  var counterEl = document.getElementById(counterId);
  if (!inputEl || !counterEl) return;

  // Update on every keystroke
  inputEl.addEventListener('input', function() {
    var currentLength = inputEl.value.length;
    counterEl.textContent = currentLength + ' / ' + maxLength + ' characters';

    // Turn red if over limit
    if (currentLength > maxLength) {
      counterEl.style.color = 'var(--danger-color)';
    } else {
      counterEl.style.color = 'var(--text-subtle)';
    }
  });
}

// ------------------------------------------------------------------------------
// setupImagePicker()
// Handles file selection for the optional article banner image
// ------------------------------------------------------------------------------
function setupImagePicker() {
  var fileInput = document.getElementById('articleImage');
  var fileLabel = document.getElementById('fileInputLabel');
  var previewWrap = document.getElementById('imagePreviewWrap');
  var previewImg = document.getElementById('imagePreview');
  var removeBtn = document.getElementById('removeImageBtn');

  if (!fileInput) return;

  // Click the hidden file input when user clicks the label
  if (fileLabel) {
    fileLabel.addEventListener('click', function() {
      fileInput.click();
    });
  }

  // When a file is selected
  fileInput.addEventListener('change', function() {
    var file = fileInput.files[0];
    if (!file) return;

    // Validate file type – only allow jpg and png
    var allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      showFormAlert('Please select a JPG or PNG image file only.', 'error');
      fileInput.value = '';
      return;
    }

    // Validate file size – max 5MB
    var maxSizeBytes = 5 * 1024 * 1024;  // 5 MB in bytes
    if (file.size > maxSizeBytes) {
      showFormAlert('Image file is too large. Maximum allowed size is 5 MB.', 'error');
      fileInput.value = '';
      return;
    }

    // Store the selected file globally
    selectedImageFile = file;

    // Show the image preview
    var reader = new FileReader();
    reader.onload = function(e) {
      if (previewImg) previewImg.src = e.target.result;
      if (previewWrap) previewWrap.style.display = 'block';
      if (fileLabel) fileLabel.textContent = '✓ Image selected: ' + file.name;
    };
    reader.readAsDataURL(file);
  });

  // Remove image button
  if (removeBtn) {
    removeBtn.addEventListener('click', function() {
      selectedImageFile = null;
      fileInput.value = '';
      if (previewWrap) previewWrap.style.display = 'none';
      if (previewImg) previewImg.src = '';
      if (fileLabel) fileLabel.textContent = 'Click to choose an image (optional)';
    });
  }
}

// ------------------------------------------------------------------------------
// validateArticle()
// Checks all required form fields before submitting
// Returns true if valid, false if there is an error
// ------------------------------------------------------------------------------
function validateArticle() {
  var title = document.getElementById('articleTitle');
  var category = document.getElementById('articleCategory');
  var content = document.getElementById('articleContent');

  // Check title
  if (!title || title.value.trim().length < 5) {
    showFormAlert('Please enter a title with at least 5 characters.', 'error');
    if (title) title.focus();
    return false;
  }

  // Check title max length
  if (title.value.trim().length > 100) {
    showFormAlert('Title is too long. Maximum is 100 characters.', 'error');
    if (title) title.focus();
    return false;
  }

  // Check category is selected
  if (!category || !category.value || category.value === '') {
    showFormAlert('Please select a category for your article.', 'error');
    if (category) category.focus();
    return false;
  }

  // Check content
  if (!content || content.value.trim().length < 20) {
    showFormAlert('Please write article content with at least 20 characters.', 'error');
    if (content) content.focus();
    return false;
  }

  // Check content max length
  if (content.value.trim().length > 5000) {
    showFormAlert('Article content is too long. Maximum is 5000 characters.', 'error');
    return false;
  }

  return true;  // All checks passed
}

// ------------------------------------------------------------------------------
// publishArticle()
// Main function: validates form, uploads image if provided,
// saves article to Supabase, falls back to localStorage if Supabase fails
// ------------------------------------------------------------------------------
async function publishArticle() {
  // First validate the form fields
  if (!validateArticle()) return;

  // Get values from form
  var title = document.getElementById('articleTitle').value.trim();
  var category = document.getElementById('articleCategory').value;
  var content = document.getElementById('articleContent').value.trim();

  // Show loading state on the publish button
  var publishBtn = document.getElementById('publishBtn');
  if (publishBtn) {
    publishBtn.disabled = true;
    publishBtn.textContent = 'Publishing...';
  }

  // Step 1: Upload image if one was selected
  var imageUrl = null;
  if (selectedImageFile && window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured()) {
    try {
      // Create a unique file name using timestamp
      var fileExt = selectedImageFile.name.split('.').pop();
      var fileName = 'article-' + Date.now() + '-' + Math.floor(Math.random() * 1000) + '.' + fileExt;
      var filePath = (currentStudent.id || 'guest') + '/' + fileName;

      // Upload to Supabase Storage 'article-images' bucket
      var uploadResult = await window.supabaseClient.storage
        .from('article-images')
        .upload(filePath, selectedImageFile, { upsert: false });

      if (!uploadResult.error) {
        // Get the public URL for the uploaded image
        var urlResult = window.supabaseClient.storage
          .from('article-images')
          .getPublicUrl(filePath);
        imageUrl = urlResult.data.publicUrl;
      } else {
        console.warn('Image upload failed:', uploadResult.error);
        // Continue without image – article can still be published
      }
    } catch (uploadErr) {
      console.warn('Image upload error:', uploadErr);
      // Continue without image
    }
  }

  // Step 2: Build the article object to save
  var newArticle = {
    title: title,
    content: content,
    category: category,
    image_url: imageUrl,
    user_id: currentStudent.id || null,
    // These fields are for localStorage/sample display
    uploader_name: currentStudent.full_name || 'Student',
    uploader_image: currentStudent.profile_image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
    faculty: currentStudent.faculty || 'University',
    degree: currentStudent.degree || 'Undergraduate',
    likes_count: 0,
    comments_count: 0,
    created_at: new Date().toISOString()
  };

  // Step 3: Try to save to Supabase
  var savedToSupabase = false;
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && currentStudent.id && currentStudent.id !== 'guest_user') {
    try {
      var insertResult = await window.supabaseClient
        .from('articles')
        .insert({
          title: newArticle.title,
          content: newArticle.content,
          category: newArticle.category,
          image_url: newArticle.image_url,
          user_id: newArticle.user_id
        })
        .select()
        .single();

      if (!insertResult.error && insertResult.data) {
        // Use the id assigned by Supabase
        newArticle.id = insertResult.data.id;
        savedToSupabase = true;
        console.log('✅ Article saved to Supabase:', insertResult.data.id);
      } else {
        console.warn('Supabase insert failed:', insertResult.error);
      }
    } catch (insertErr) {
      console.warn('Supabase article save error:', insertErr);
    }
  }

  // Step 4: Always save to localStorage as fallback (for demo continuity)
  if (!newArticle.id) {
    // Generate a local ID if Supabase didn't assign one
    newArticle.id = 'art-local-' + Date.now();
  }

  var localArticles = JSON.parse(localStorage.getItem('uniskill_local_articles') || '[]');
  // Add new article at the beginning so newest is first
  localArticles.unshift(newArticle);
  // Keep only the last 50 locally to not overflow storage
  if (localArticles.length > 50) localArticles = localArticles.slice(0, 50);
  localStorage.setItem('uniskill_local_articles', JSON.stringify(localArticles));

  // Step 5: Show success message and redirect
  showFormAlert('✓ Article published successfully! Redirecting to articles page...', 'success');

  // Wait 1.5 seconds then redirect
  setTimeout(function() {
    window.location.href = 'articles.html';
  }, 1500);
}

// ------------------------------------------------------------------------------
// showFormAlert()
// Shows an alert message in the form area
// Type can be 'success', 'error', or 'info'
// ------------------------------------------------------------------------------
function showFormAlert(message, type) {
  var alertContainer = document.getElementById('formAlertContainer');
  if (!alertContainer) return;

  // Build the alert HTML
  alertContainer.innerHTML = '<div class="alert alert-' + type + '">' + escapeHTML(message) + '</div>';
  alertContainer.style.display = 'block';

  // Scroll to the alert so user sees it
  alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Auto-hide error messages after 5 seconds
  if (type === 'error') {
    setTimeout(function() {
      alertContainer.innerHTML = '';
    }, 5000);
  }
}
