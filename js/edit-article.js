/**
 * ==============================================================================
 * UniSkill Hub - Edit Article Module
 * File: js/edit-article.js
 * Module: Member 3 – Knowledge Feed & Article Publishing
 * Functions:
 *   - loadArticleForEdit()  — Reads ?id= from URL and pre-fills the edit form
 *   - updateArticle()       — Saves the updated article to Supabase + localStorage
 *   - checkOwnership()      — Verifies the current student is the article author
 * ==============================================================================
 */

// Current student logged in
var editStudent = null;

// The original article being edited
var articleToEdit = null;

// ------------------------------------------------------------------------------
// Page Initialization
// ------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async function() {
  // Get the currently logged-in student
  editStudent = getCurrentStudent();

  // Update navbar
  updateNavbarUser();

  // Read the article ID from the URL (?id=...)
  var urlParams = new URLSearchParams(window.location.search);
  var articleId = urlParams.get('id');

  if (!articleId) {
    showEditAlert('No article ID provided. Cannot edit.', 'error');
    return;
  }

  // Load the article and fill the form
  await loadArticleForEdit(articleId);

  // Set up character counters
  setupCharCounter('articleTitle', 'titleCharCount', 100);
  setupCharCounter('articleContent', 'contentCharCount', 5000);

  // Set up the form submit handler
  var form = document.getElementById('editArticleForm');
  if (form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      updateArticle(articleId);
    });
  }

  // Cancel button – go back to my articles
  var cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      window.location.href = 'my-articles.html';
    });
  }
});

// ------------------------------------------------------------------------------
// setupCharCounter()
// Shows a live character count below the field
// (Same as in create-article.js – redeclared here for independence)
// ------------------------------------------------------------------------------
function setupCharCounter(inputId, counterId, maxLength) {
  var inputEl = document.getElementById(inputId);
  var counterEl = document.getElementById(counterId);
  if (!inputEl || !counterEl) return;

  inputEl.addEventListener('input', function() {
    var length = inputEl.value.length;
    counterEl.textContent = length + ' / ' + maxLength + ' characters';
    counterEl.style.color = length > maxLength ? 'var(--danger-color)' : 'var(--text-subtle)';
  });
}

// ------------------------------------------------------------------------------
// loadArticleForEdit()
// Finds the article by ID and fills the form fields with existing data
// ------------------------------------------------------------------------------
async function loadArticleForEdit(articleId) {
  var formCard = document.getElementById('editFormCard');
  if (formCard) {
    formCard.innerHTML = '<div class="spinner-wrapper"><div class="spinner"></div><p style="margin-top: 10px; color: var(--text-muted); font-size: 13px;">Loading article...</p></div>';
  }

  var found = null;

  // Step 1: Try Supabase
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured()) {
    try {
      var result = await window.supabaseClient
        .from('articles')
        .select('id, user_id, title, content, category, image_url, created_at')
        .eq('id', articleId)
        .single();

      if (!result.error && result.data) {
        found = result.data;
      }
    } catch (e) {
      console.warn('Edit: Supabase fetch failed:', e);
    }
  }

  // Step 2: Try localStorage
  if (!found) {
    var localArticles = JSON.parse(localStorage.getItem('uniskill_local_articles') || '[]');
    for (var i = 0; i < localArticles.length; i++) {
      if (localArticles[i].id === articleId) {
        found = localArticles[i];
        break;
      }
    }
  }

  // Step 3: Try sample articles (can only view, not edit)
  if (!found && typeof sampleArticles !== 'undefined') {
    for (var j = 0; j < sampleArticles.length; j++) {
      if (sampleArticles[j].id === articleId) {
        found = sampleArticles[j];
        break;
      }
    }
  }

  if (!found) {
    if (formCard) {
      formCard.innerHTML = '<div class="empty-state-box"><div class="empty-state-icon">😕</div><div class="empty-state-title">Article Not Found</div><div class="empty-state-desc">Could not find this article.</div><a href="my-articles.html" class="btn btn-primary">My Articles</a></div>';
    }
    return;
  }

  // Check ownership – only the author can edit
  var isOwner = checkOwnership(found);
  if (!isOwner) {
    if (formCard) {
      formCard.innerHTML = '<div class="empty-state-box"><div class="empty-state-icon">🔒</div><div class="empty-state-title">Access Denied</div><div class="empty-state-desc">You can only edit articles that you published.</div><a href="my-articles.html" class="btn btn-outline">My Articles</a></div>';
    }
    return;
  }

  articleToEdit = found;

  // Restore the form HTML and fill in the values
  if (formCard) {
    formCard.innerHTML = buildEditFormHTML(found);
  }

  // Re-setup character counters after restoring form HTML
  setupCharCounter('articleTitle', 'titleCharCount', 100);
  setupCharCounter('articleContent', 'contentCharCount', 5000);

  // Re-attach submit handler (form was just rebuilt)
  var form = document.getElementById('editArticleForm');
  if (form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      updateArticle(articleId);
    });
  }

  // Re-attach cancel handler
  var cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      window.location.href = 'my-articles.html';
    });
  }
}

// ------------------------------------------------------------------------------
// buildEditFormHTML()
// Returns the HTML string for the edit form pre-filled with article data
// ------------------------------------------------------------------------------
function buildEditFormHTML(article) {
  // Escape values for safe use in HTML attributes
  var safeTitle = escapeHTML(article.title || '');
  var safeContent = escapeHTML(article.content || '');
  var safeCategory = article.category || '';

  // Build category options with the current one pre-selected
  var categories = ['Programming', 'Statistics', 'Mathematics', 'Academic Tips', 'Research', 'General'];
  var categoryOptions = categories.map(function(cat) {
    var selected = cat === safeCategory ? ' selected' : '';
    return '<option value="' + cat + '"' + selected + '>' + cat + '</option>';
  }).join('');

  return [
    '<div id="editAlertContainer" style="display: none;"></div>',
    '',
    '<h2 class="article-form-title">✏️ Edit Article</h2>',
    '',
    '<form id="editArticleForm">',
    '',
    '  <!-- Title Field -->',
    '  <div class="form-group">',
    '    <label class="form-label" for="articleTitle">Article Title <span class="required">*</span></label>',
    '    <input type="text" id="articleTitle" class="form-control" value="' + safeTitle + '" placeholder="Enter article title..." maxlength="100" required>',
    '    <div class="char-counter" id="titleCharCount">' + (article.title ? article.title.length : 0) + ' / 100 characters</div>',
    '  </div>',
    '',
    '  <!-- Category Field -->',
    '  <div class="form-group">',
    '    <label class="form-label" for="articleCategory">Category <span class="required">*</span></label>',
    '    <select id="articleCategory" class="form-control" required>',
    '      <option value="">-- Select a Category --</option>',
    categoryOptions,
    '    </select>',
    '  </div>',
    '',
    '  <!-- Content Field -->',
    '  <div class="form-group">',
    '    <label class="form-label" for="articleContent">Article Content <span class="required">*</span></label>',
    '    <textarea id="articleContent" class="form-control textarea-content" placeholder="Write your article here..." maxlength="5000" required>' + safeContent + '</textarea>',
    '    <div class="char-counter" id="contentCharCount">' + (article.content ? article.content.length : 0) + ' / 5000 characters</div>',
    '  </div>',
    '',
    '  <!-- Current Image Info (if exists) -->',
    article.image_url ? '<div class="form-group"><label class="form-label">Current Banner Image</label><div class="image-preview-wrap" style="display: block;"><img src="' + article.image_url + '" alt="Current image" style="max-height: 120px; border-radius: 6px; border: 1px solid var(--border-color);"></div><p class="form-hint" style="margin-top: 6px;">Image editing is available in the next version.</p></div>' : '',
    '',
    '  <!-- Action Buttons -->',
    '  <div class="form-actions">',
    '    <button type="submit" id="updateBtn" class="btn btn-primary">💾 Save Changes</button>',
    '    <button type="button" id="cancelEditBtn" class="btn btn-secondary">Cancel</button>',
    '    <a href="article-details.html?id=' + article.id + '" class="btn btn-outline btn-sm" style="margin-left: auto;">👁️ View Article</a>',
    '  </div>',
    '',
    '</form>'
  ].join('\n');
}

// ------------------------------------------------------------------------------
// checkOwnership()
// Returns true if the current student is the article's author
// ------------------------------------------------------------------------------
function checkOwnership(article) {
  if (!editStudent || !editStudent.id) return false;
  if (editStudent.id === 'guest_user') return false;

  // Check user_id matches
  if (article.user_id && article.user_id === editStudent.id) return true;

  // For sample articles, allow any logged-in student (demo purposes)
  if (article.id && article.id.startsWith('art-sample-')) return true;

  // For locally created articles, allow if the stored user_id matches or if guest
  if (article.id && article.id.startsWith('art-local-')) return true;

  return false;
}

// ------------------------------------------------------------------------------
// updateArticle()
// Saves the updated article data to Supabase and localStorage
// ------------------------------------------------------------------------------
async function updateArticle(articleId) {
  // Get updated values
  var titleEl = document.getElementById('articleTitle');
  var categoryEl = document.getElementById('articleCategory');
  var contentEl = document.getElementById('articleContent');

  if (!titleEl || !categoryEl || !contentEl) return;

  var newTitle = titleEl.value.trim();
  var newCategory = categoryEl.value;
  var newContent = contentEl.value.trim();

  // Basic validation
  if (!newTitle || newTitle.length < 5) {
    showEditAlert('Title must be at least 5 characters.', 'error');
    return;
  }
  if (!newCategory) {
    showEditAlert('Please select a category.', 'error');
    return;
  }
  if (!newContent || newContent.length < 20) {
    showEditAlert('Content must be at least 20 characters.', 'error');
    return;
  }

  // Show saving state
  var updateBtn = document.getElementById('updateBtn');
  if (updateBtn) {
    updateBtn.disabled = true;
    updateBtn.textContent = 'Saving...';
  }

  // Step 1: Update in Supabase
  var updatedInSupabase = false;
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && editStudent.id && editStudent.id !== 'guest_user') {
    try {
      var updateResult = await window.supabaseClient
        .from('articles')
        .update({
          title: newTitle,
          category: newCategory,
          content: newContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId)
        .eq('user_id', editStudent.id);

      if (!updateResult.error) {
        updatedInSupabase = true;
      } else {
        console.warn('Supabase update failed:', updateResult.error);
      }
    } catch (e) {
      console.warn('Update Supabase error:', e);
    }
  }

  // Step 2: Update in localStorage
  var localArticles = JSON.parse(localStorage.getItem('uniskill_local_articles') || '[]');
  var found = false;
  for (var i = 0; i < localArticles.length; i++) {
    if (localArticles[i].id === articleId) {
      localArticles[i].title = newTitle;
      localArticles[i].category = newCategory;
      localArticles[i].content = newContent;
      localArticles[i].updated_at = new Date().toISOString();
      found = true;
      break;
    }
  }

  // If not in localStorage yet, add it (covers Supabase-only articles)
  if (!found && articleToEdit) {
    var updatedCopy = JSON.parse(JSON.stringify(articleToEdit));
    updatedCopy.title = newTitle;
    updatedCopy.category = newCategory;
    updatedCopy.content = newContent;
    updatedCopy.updated_at = new Date().toISOString();
    localArticles.unshift(updatedCopy);
  }

  localStorage.setItem('uniskill_local_articles', JSON.stringify(localArticles));

  // Show success and redirect
  showEditAlert('✓ Article updated successfully! Redirecting...', 'success');

  setTimeout(function() {
    window.location.href = 'my-articles.html';
  }, 1500);
}

// ------------------------------------------------------------------------------
// showEditAlert()
// Shows an alert message inside the edit form
// ------------------------------------------------------------------------------
function showEditAlert(message, type) {
  var alertContainer = document.getElementById('editAlertContainer');
  if (!alertContainer) {
    // Try to create one if it doesn't exist yet
    alertContainer = document.createElement('div');
    alertContainer.id = 'editAlertContainer';
    var formCard = document.getElementById('editFormCard');
    if (formCard) formCard.prepend(alertContainer);
  }

  alertContainer.innerHTML = '<div class="alert alert-' + type + '">' + escapeHTML(message) + '</div>';
  alertContainer.style.display = 'block';
  alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  if (type === 'error') {
    setTimeout(function() {
      alertContainer.innerHTML = '';
    }, 5000);
  }

  // Re-enable the save button if error
  if (type === 'error') {
    var updateBtn = document.getElementById('updateBtn');
    if (updateBtn) {
      updateBtn.disabled = false;
      updateBtn.textContent = '💾 Save Changes';
    }
  }
}
