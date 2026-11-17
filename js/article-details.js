/**
 * ==============================================================================
 * UniSkill Hub - Article Details & Comments Module
 * File: js/article-details.js
 * Module: Member 3 – Knowledge Feed & Article Publishing
 * Functions:
 *   - loadArticle()         — Reads ?id= from URL and loads the article
 *   - renderArticleDetail() — Displays the full article content on screen
 *   - loadComments()        — Loads comments from Supabase + localStorage
 *   - addComment()          — Submits a new comment
 *   - renderComments()      — Displays comments list
 * ==============================================================================
 */

// The article currently being viewed
var currentArticle = null;

// The current logged-in student
var detailStudent = null;

// ------------------------------------------------------------------------------
// Page Initialization
// ------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async function() {
  // Get the logged-in student
  detailStudent = getCurrentStudent();

  // Update navbar
  updateNavbarUser();

  // Read article id from the URL query string (?id=...)
  var urlParams = new URLSearchParams(window.location.search);
  var articleId = urlParams.get('id');

  if (!articleId) {
    // No id in URL – show error and link back
    showDetailError('No article ID was provided in the URL.');
    return;
  }

  // Load and display the article
  await loadArticle(articleId);

  // Set up the comment form submit handler
  var commentForm = document.getElementById('commentForm');
  if (commentForm) {
    commentForm.addEventListener('submit', function(event) {
      event.preventDefault();  // Prevent page reload
      addComment(articleId);
    });
  }
});

// ------------------------------------------------------------------------------
// loadArticle()
// Finds the article by ID from Supabase, localStorage, or sample data
// Then renders it on the page
// ------------------------------------------------------------------------------
async function loadArticle(articleId) {
  var mainContainer = document.getElementById('articleDetailMain');
  if (mainContainer) {
    mainContainer.innerHTML = '<div class="spinner-wrapper"><div class="spinner"></div></div>';
  }

  var foundArticle = null;

  // Step 1: Try Supabase first
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured()) {
    try {
      var result = await window.supabaseClient
        .from('articles')
        .select('id, user_id, title, content, category, image_url, created_at, profiles:user_id (full_name, faculty, degree, profile_image)')
        .eq('id', articleId)
        .single();

      if (!result.error && result.data) {
        var item = result.data;
        foundArticle = {
          id: item.id,
          user_id: item.user_id,
          title: item.title,
          content: item.content,
          category: item.category,
          image_url: item.image_url,
          created_at: item.created_at,
          uploader_name: (item.profiles && item.profiles.full_name) ? item.profiles.full_name : 'Student',
          uploader_image: (item.profiles && item.profiles.profile_image) ? item.profiles.profile_image : 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
          faculty: (item.profiles && item.profiles.faculty) ? item.profiles.faculty : 'University',
          degree: (item.profiles && item.profiles.degree) ? item.profiles.degree : 'Undergraduate'
        };
      }
    } catch (e) {
      console.warn('Article detail Supabase fetch failed:', e);
    }
  }

  // Step 2: Try localStorage articles
  if (!foundArticle) {
    var localArticles = JSON.parse(localStorage.getItem('uniskill_local_articles') || '[]');
    for (var i = 0; i < localArticles.length; i++) {
      if (localArticles[i].id === articleId) {
        foundArticle = localArticles[i];
        break;
      }
    }
  }

  // Step 3: Try sample articles (declared in articles.js)
  if (!foundArticle && typeof sampleArticles !== 'undefined') {
    for (var j = 0; j < sampleArticles.length; j++) {
      if (sampleArticles[j].id === articleId) {
        foundArticle = sampleArticles[j];
        break;
      }
    }
  }

  if (!foundArticle) {
    showDetailError('Article not found. It may have been deleted or the ID is incorrect.');
    return;
  }

  // Store globally so like/comment functions can use it
  currentArticle = foundArticle;

  // Render the article
  renderArticleDetail(foundArticle);

  // Load the comments section
  await loadComments(articleId);

  // Update the page title
  document.title = foundArticle.title + ' – UniSkill Hub';
}

// ------------------------------------------------------------------------------
// renderArticleDetail()
// Fills the article detail card with the article data
// ------------------------------------------------------------------------------
function renderArticleDetail(article) {
  var mainContainer = document.getElementById('articleDetailMain');
  if (!mainContainer) return;

  var student = detailStudent;

  // Check if the current student is the author (to show edit/delete buttons)
  var isOwner = student && article.user_id && student.id === article.user_id;

  // Get like state for this article
  var likedSet = getLikedArticles(student ? (student.id || 'guest') : 'guest');
  var isLiked = likedSet.has(article.id);
  var likeClass = isLiked ? 'feed-action-btn like-btn liked' : 'feed-action-btn like-btn';
  var likeCount = article.likes_count || 0;

  // Format the date nicely
  var dateText = article.created_at ? formatTimeAgo(article.created_at) : 'Recently';
  var fullDate = article.created_at ? new Date(article.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

  // Avatar src with fallback
  var avatarSrc = article.uploader_image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(article.uploader_name || 'student');

  // Banner image section (only if image_url is set)
  var bannerHtml = '';
  if (article.image_url) {
    bannerHtml = '<img src="' + article.image_url + '" alt="Article banner" class="article-banner-image" onerror="this.style.display=\'none\'">';
  }

  // Owner actions (Edit / Delete) - only shown to the article author
  var ownerActionsHtml = '';
  if (isOwner) {
    ownerActionsHtml = [
      '<div class="article-owner-actions">',
      '  <a href="edit-article.html?id=' + article.id + '" class="btn btn-outline btn-sm">✏️ Edit</a>',
      '  <button class="btn btn-danger-outline btn-sm" onclick="deleteArticle(\'' + article.id + '\')">🗑️ Delete</button>',
      '</div>'
    ].join('');
  }

  // Build the article content with paragraph breaks
  var contentHtml = escapeHTML(article.content || '').replace(/\n/g, '<br>');

  // Build and insert the full article HTML
  mainContainer.innerHTML = [
    '<div class="article-detail-card">',
    '  <span class="article-detail-category">' + escapeHTML(article.category || 'General') + '</span>',
    '  <h1 class="article-detail-title">' + escapeHTML(article.title || 'Untitled') + '</h1>',
    '',
    '  <div class="article-detail-author">',
    '    <img src="' + avatarSrc + '" alt="' + escapeHTML(article.uploader_name || 'Student') + '" class="article-detail-avatar" onerror="this.src=\'https://api.dicebear.com/7.x/avataaars/svg?seed=student\'">',
    '    <div>',
    '      <div class="article-detail-author-name">' + escapeHTML(article.uploader_name || 'Student') + '</div>',
    '      <div class="article-detail-author-sub">' + escapeHTML(article.degree || 'Undergraduate') + ' • ' + escapeHTML(article.faculty || 'University') + '</div>',
    '      <div class="article-detail-date">' + dateText + (fullDate ? ' (' + fullDate + ')' : '') + '</div>',
    '    </div>',
    '  </div>',
    '',
    bannerHtml,
    '',
    '  <div class="article-body-content" id="articleBodyContent">' + contentHtml + '</div>',
    '',
    '  <div class="article-detail-actions">',
    '    <button class="' + likeClass + '" id="detailLikeBtn" data-article-id="' + article.id + '" data-like-count="' + likeCount + '">',
    '      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017a2 2 0 01-1.789-1.106l-3.5-7A2 2 0 017.746 10H10V4a2 2 0 012-2h1a1 1 0 011 1v7z"/></svg>',
    '      Like (<span class="like-count">' + likeCount + '</span>)',
    '    </button>',
    '    <span class="article-like-count-display" id="detailLikeDisplay">' + likeCount + ' people liked this article</span>',
    ownerActionsHtml,
    '  </div>',
    '</div>'
  ].join('\n');

  // Attach like handler to the detail page like button
  var detailLikeBtn = document.getElementById('detailLikeBtn');
  if (detailLikeBtn) {
    detailLikeBtn.addEventListener('click', function() {
      likeArticle(detailLikeBtn);
      // Also update the "X people liked" display below the button
      setTimeout(function() {
        var newCount = detailLikeBtn.getAttribute('data-like-count');
        var display = document.getElementById('detailLikeDisplay');
        if (display) display.textContent = newCount + ' people liked this article';
      }, 100);
    });
  }

  // Update related articles sidebar
  renderRelatedArticles(article.category, article.id);

  // Update right sidebar author card
  renderAuthorCard(article);
}

// ------------------------------------------------------------------------------
// renderRelatedArticles()
// Shows articles in the same category in the right sidebar
// ------------------------------------------------------------------------------
function renderRelatedArticles(category, currentId) {
  var container = document.getElementById('relatedArticlesContainer');
  if (!container) return;

  // Find related articles from sampleArticles (and local articles if available)
  var allAvailable = typeof sampleArticles !== 'undefined' ? sampleArticles : [];
  var localArticles = JSON.parse(localStorage.getItem('uniskill_local_articles') || '[]');
  allAvailable = allAvailable.concat(localArticles);

  // Filter by category, exclude current article
  var related = allAvailable.filter(function(art) {
    return art.id !== currentId && art.category === category;
  }).slice(0, 3);  // Show max 3 related articles

  if (related.length === 0) {
    container.innerHTML = '<p style="font-size: 12.5px; color: var(--text-muted);">No related articles yet.</p>';
    return;
  }

  var html = '';
  related.forEach(function(art) {
    html += [
      '<div style="padding: 10px 0; border-bottom: 1px solid var(--border-color);">',
      '  <a href="article-details.html?id=' + art.id + '" style="font-size: 13px; font-weight: 600; color: var(--text-main); text-decoration: none; display: block; margin-bottom: 4px; line-height: 1.4;">' + escapeHTML(art.title) + '</a>',
      '  <span style="font-size: 11.5px; color: var(--text-subtle);">' + escapeHTML(art.uploader_name || 'Student') + '</span>',
      '</div>'
    ].join('');
  });
  container.innerHTML = html;
}

// ------------------------------------------------------------------------------
// renderAuthorCard()
// Shows the article author's info in the right sidebar
// ------------------------------------------------------------------------------
function renderAuthorCard(article) {
  var container = document.getElementById('authorCardContainer');
  if (!container) return;

  var avatarSrc = article.uploader_image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=author';

  container.innerHTML = [
    '<div style="text-align: center; padding: 8px 0;">',
    '  <img src="' + avatarSrc + '" alt="Author" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); margin-bottom: 8px;" onerror="this.src=\'https://api.dicebear.com/7.x/avataaars/svg?seed=author\'">',
    '  <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">' + escapeHTML(article.uploader_name || 'Student') + '</div>',
    '  <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">' + escapeHTML(article.degree || 'Undergraduate') + '</div>',
    '  <div style="font-size: 12px; color: var(--text-muted);">' + escapeHTML(article.faculty || 'University') + '</div>',
    '</div>'
  ].join('');
}

// ------------------------------------------------------------------------------
// loadComments()
// Loads comments from Supabase and localStorage, then renders them
// ------------------------------------------------------------------------------
async function loadComments(articleId) {
  var commentsContainer = document.getElementById('commentsListContainer');
  if (!commentsContainer) return;

  commentsContainer.innerHTML = '<p style="font-size: 13px; color: var(--text-muted);">Loading comments...</p>';

  var liveComments = [];

  // Step 1: Try Supabase
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured()) {
    try {
      var result = await window.supabaseClient
        .from('article_comments')
        .select('id, comment, created_at, profiles:user_id (full_name, faculty, profile_image)')
        .eq('article_id', articleId)
        .order('created_at', { ascending: true });

      if (!result.error && result.data) {
        liveComments = result.data.map(function(item) {
          return {
            id: item.id,
            comment: item.comment,
            created_at: item.created_at,
            author_name: (item.profiles && item.profiles.full_name) ? item.profiles.full_name : 'Student',
            author_image: (item.profiles && item.profiles.profile_image) ? item.profiles.profile_image : 'https://api.dicebear.com/7.x/avataaars/svg?seed=comment',
            author_faculty: (item.profiles && item.profiles.faculty) ? item.profiles.faculty : 'University'
          };
        });
      }
    } catch (e) {
      console.warn('Comments Supabase fetch failed:', e);
    }
  }

  // Step 2: Merge with localStorage comments
  var localComments = JSON.parse(localStorage.getItem('uniskill_article_comments_' + articleId) || '[]');

  // Combine both sources, deduplicate by id
  var commentMap = new Map();
  liveComments.forEach(function(c) { commentMap.set(c.id, c); });
  localComments.forEach(function(c) { commentMap.set(c.id, c); });

  var allComments = Array.from(commentMap.values());

  // Sort by oldest first so the conversation flows naturally
  allComments.sort(function(a, b) {
    return new Date(a.created_at) - new Date(b.created_at);
  });

  // Render comments
  renderComments(allComments, articleId);

  // Update comment count in header
  var countEl = document.getElementById('commentCountDisplay');
  if (countEl) countEl.textContent = allComments.length;
}

// ------------------------------------------------------------------------------
// renderComments()
// Builds the HTML for all comments and puts them in the container
// ------------------------------------------------------------------------------
function renderComments(comments, articleId) {
  var container = document.getElementById('commentsListContainer');
  if (!container) return;

  if (!comments || comments.length === 0) {
    container.innerHTML = '<div class="no-comments-msg">No comments yet. Be the first to comment! 💬</div>';
    return;
  }

  var html = '';
  comments.forEach(function(comment) {
    var avatarSrc = comment.author_image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(comment.author_name || 'commenter');
    var timeText = comment.created_at ? formatTimeAgo(comment.created_at) : 'Recently';

    html += [
      '<div class="comment-item">',
      '  <img src="' + avatarSrc + '" alt="' + escapeHTML(comment.author_name || 'Student') + '" class="comment-item-avatar" onerror="this.src=\'https://api.dicebear.com/7.x/avataaars/svg?seed=commenter\'">',
      '  <div class="comment-item-body">',
      '    <div class="comment-item-header">',
      '      <span class="comment-author-name">' + escapeHTML(comment.author_name || 'Student') + '</span>',
      '      <span class="comment-item-time">' + timeText + '</span>',
      '    </div>',
      '    <div class="comment-item-text">' + escapeHTML(comment.comment || '') + '</div>',
      '  </div>',
      '</div>'
    ].join('');
  });

  container.innerHTML = html;
}

// ------------------------------------------------------------------------------
// addComment()
// Submits a new comment for this article
// Saves to Supabase (if available) and localStorage fallback
// ------------------------------------------------------------------------------
async function addComment(articleId) {
  var commentInput = document.getElementById('commentInput');
  if (!commentInput) return;

  var commentText = commentInput.value.trim();

  // Validate
  if (commentText.length < 2) {
    alert('Please write a comment with at least 2 characters.');
    return;
  }

  if (commentText.length > 500) {
    alert('Comment is too long. Maximum 500 characters.');
    return;
  }

  // Disable the submit button to prevent double submission
  var submitBtn = document.getElementById('commentSubmitBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';
  }

  // Build the comment object
  var newComment = {
    id: 'cmt-local-' + Date.now(),
    article_id: articleId,
    comment: commentText,
    user_id: detailStudent ? detailStudent.id : null,
    created_at: new Date().toISOString(),
    author_name: detailStudent ? (detailStudent.full_name || 'Student') : 'Student',
    author_image: detailStudent ? (detailStudent.profile_image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=student') : 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
    author_faculty: detailStudent ? (detailStudent.faculty || 'University') : 'University'
  };

  // Step 1: Try to save to Supabase
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && detailStudent && detailStudent.id && detailStudent.id !== 'guest_user') {
    try {
      var insertResult = await window.supabaseClient
        .from('article_comments')
        .insert({
          article_id: articleId,
          user_id: detailStudent.id,
          comment: commentText
        })
        .select()
        .single();

      if (!insertResult.error && insertResult.data) {
        // Use Supabase-generated ID
        newComment.id = insertResult.data.id;
      }
    } catch (e) {
      console.warn('Comment save to Supabase failed:', e);
    }
  }

  // Step 2: Save to localStorage
  var localKey = 'uniskill_article_comments_' + articleId;
  var localComments = JSON.parse(localStorage.getItem(localKey) || '[]');
  localComments.push(newComment);
  localStorage.setItem(localKey, JSON.stringify(localComments));

  // Step 3: Clear the input and re-enable submit button
  commentInput.value = '';
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Post Comment';
  }

  // Step 4: Reload comments to show the new one
  await loadComments(articleId);
}

// ------------------------------------------------------------------------------
// deleteArticle()
// Deletes the article (only if current student is the author)
// ------------------------------------------------------------------------------
async function deleteArticle(articleId) {
  var confirmed = confirm('Are you sure you want to delete this article? This action cannot be undone.');
  if (!confirmed) return;

  // Try to delete from Supabase
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && detailStudent && detailStudent.id) {
    try {
      await window.supabaseClient
        .from('articles')
        .delete()
        .eq('id', articleId)
        .eq('user_id', detailStudent.id);
    } catch (e) {
      console.warn('Delete from Supabase failed:', e);
    }
  }

  // Delete from localStorage
  var localArticles = JSON.parse(localStorage.getItem('uniskill_local_articles') || '[]');
  localArticles = localArticles.filter(function(art) { return art.id !== articleId; });
  localStorage.setItem('uniskill_local_articles', JSON.stringify(localArticles));

  alert('Article deleted successfully.');
  window.location.href = 'my-articles.html';
}

// ------------------------------------------------------------------------------
// showDetailError()
// Shows an error message if the article could not be found
// ------------------------------------------------------------------------------
function showDetailError(message) {
  var mainContainer = document.getElementById('articleDetailMain');
  if (mainContainer) {
    mainContainer.innerHTML = [
      '<div class="article-detail-card">',
      '  <div class="empty-state-box">',
      '    <div class="empty-state-icon">😕</div>',
      '    <div class="empty-state-title">Article Not Found</div>',
      '    <div class="empty-state-desc">' + escapeHTML(message) + '</div>',
      '    <a href="articles.html" class="btn btn-primary">Back to Articles</a>',
      '  </div>',
      '</div>'
    ].join('');
  }
}
