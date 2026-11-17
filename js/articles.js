/**
 * ==============================================================================
 * UniSkill Hub - Articles Feed & Like Module
 * File: js/articles.js
 * Module: Member 3 – Knowledge Feed & Article Publishing
 * Functions:
 *   - loadArticles()       — Loads articles from Supabase + localStorage + samples
 *   - searchArticles()     — Filters articles by search query in real time
 *   - filterArticles()     — Filters by category or sort order
 *   - likeArticle()        — Toggles like/unlike for an article
 *   - renderArticleCard()  — Builds one feed card HTML element
 *   - getCurrentStudent()  — Gets the logged-in student from localStorage
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// GLOBAL STATE for articles module
// ------------------------------------------------------------------------------
let allArticles = [];          // All loaded articles (sample + local + Supabase)
let filteredArticles = [];     // Articles after search and filter applied
let currentArticleCategory = 'all';   // Currently selected category
let currentArticleSort = 'newest';    // Current sort order
let articleSearchQuery = '';          // Current search text

// ------------------------------------------------------------------------------
// SAMPLE ARTICLES – Hard-coded demo data so the page is never empty.
// (Same approach used by Member 2 with defaultSampleResources)
// ------------------------------------------------------------------------------
const sampleArticles = [
  {
    id: 'art-sample-01',
    user_id: 'usr_samudi_01',
    title: 'Understanding Regression Analysis: A Beginner\'s Guide',
    content: 'Regression analysis is one of the most commonly used statistical techniques in undergraduate research. In this article, I will explain the basics of simple linear regression and when to use it.\n\nLinear regression helps us understand the relationship between one independent variable (X) and one dependent variable (Y). The goal is to find the best-fit line through our data points.\n\nThe formula is: Y = a + bX\n\nWhere:\n- Y is the dependent variable (what we are predicting)\n- X is the independent variable (what we use to predict)\n- a is the intercept (where the line crosses the Y-axis)\n- b is the slope (how much Y changes for each unit change in X)\n\nTo check if your regression is good, look at the R-squared value. An R-squared of 0.80 means 80% of the variation in Y is explained by X.\n\nIn your statistics practical sessions, always check the residuals plot to see if the linear model is appropriate for your data. If the residuals show a pattern, you may need a different model.',
    category: 'Statistics',
    image_url: null,
    uploader_name: 'Samudi Wijesinghe',
    uploader_image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    faculty: 'Faculty of Applied Sciences',
    degree: 'BSc Applied Sciences',
    likes_count: 38,
    comments_count: 14,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'art-sample-02',
    user_id: 'usr_kaveen_02',
    title: '5 Essential Python Libraries Every CS Student Should Know',
    content: 'As an undergraduate computer science student, learning Python is just the beginning. The real power comes from the libraries that extend what Python can do. Here are 5 libraries you must learn before graduating.\n\n1. NumPy\nNumPy is the foundation of scientific computing in Python. It gives you fast array operations which are much faster than normal Python lists. Use it whenever you work with numbers and matrices.\n\n2. Pandas\nPandas is for working with data tables (called DataFrames). It is like Excel but in Python code. You can read CSV files, filter rows, calculate averages, and group data very easily.\n\n3. Matplotlib\nMatplotlib lets you draw graphs and charts. Line plots, bar charts, scatter plots – everything you need for your research reports and assignments.\n\n4. Scikit-learn\nThis is the machine learning library. Once you understand the basics of ML theory in your lectures, scikit-learn lets you build classification and regression models in just a few lines of code.\n\n5. Requests\nThe requests library lets you call web APIs and download data from the internet. Great for web scraping projects and connecting to REST APIs.',
    category: 'Programming',
    image_url: null,
    uploader_name: 'Kaveen Perera',
    uploader_image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    faculty: 'Faculty of Computing & Technology',
    degree: 'BSc Computing & IT',
    likes_count: 52,
    comments_count: 21,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'art-sample-03',
    user_id: 'usr_tharushi_03',
    title: 'Effective Study Techniques for Final Exams – What Actually Works',
    content: 'Every semester, students ask the same question: how do I study effectively without burning out? After 4 years of university, I want to share techniques that actually worked for me.\n\n1. Active Recall (NOT passive reading)\nInstead of re-reading your notes, close the book and try to remember what you just read. This forces your brain to retrieve information, which is how long-term memory is built.\n\n2. Spaced Repetition\nStudy a topic, then review it again after 1 day, then 3 days, then 1 week. This spacing schedule dramatically improves retention compared to cramming the night before.\n\n3. Past Papers are Your Best Friend\nFor every exam, do at least 3 years of past papers under timed conditions. This shows you the question patterns and builds exam confidence.\n\n4. The Pomodoro Technique\nStudy for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer 20-minute break. This keeps your concentration fresh and prevents mental fatigue.\n\n5. Study Groups (Done Right)\nGroup study works only if everyone comes prepared. Assign topics to individuals, then teach each other. Teaching is the most powerful way to discover gaps in your own knowledge.',
    category: 'Academic Tips',
    image_url: null,
    uploader_name: 'Tharushi Fernando',
    uploader_image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    faculty: 'Faculty of Science',
    degree: 'BSc Biology',
    likes_count: 76,
    comments_count: 31,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'art-sample-04',
    user_id: 'usr_malith_04',
    title: 'Introduction to Graph Theory: Concepts Every IT Student Should Know',
    content: 'Graph theory is one of those mathematical topics that appears in many areas of computer science – networking, databases, social media algorithms, and even GPS systems. Let me explain the basics.\n\nA graph is simply a set of nodes (called vertices) connected by edges. For example, a social network is a graph where people are nodes and friendships are edges.\n\nThere are two main types:\n- Directed graphs (edges have a direction, like Twitter follows)\n- Undirected graphs (edges go both ways, like Facebook friendships)\n\nKey concepts you need for your exams:\n\n1. Degree of a node – how many edges are connected to it\n2. Path – a sequence of nodes connected by edges\n3. Cycle – a path that starts and ends at the same node\n4. Tree – a connected graph with no cycles\n5. Spanning tree – a tree that includes all nodes of a graph\n\nIn algorithms, Breadth-First Search (BFS) and Depth-First Search (DFS) are the two main ways to traverse a graph. BFS uses a queue. DFS uses a stack (or recursion).\n\nFor the shortest path, Dijkstra\'s algorithm is the classic solution you need to know for your Algorithms exam.',
    category: 'Mathematics',
    image_url: null,
    uploader_name: 'Malith Jayasuriya',
    uploader_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    faculty: 'Faculty of Engineering',
    degree: 'BSc Engineering',
    likes_count: 29,
    comments_count: 9,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'art-sample-05',
    user_id: 'usr_ananya_05',
    title: 'How to Write a Research Proposal That Gets Approved',
    content: 'Writing your first research proposal can be very stressful. Many students submit proposals that get rejected simply because they did not follow the correct structure. Here is a simple guide based on what worked for my own approved proposal.\n\nSection 1: Title\nYour title should be clear and specific. Bad: "A study of Python". Good: "Evaluating the Effectiveness of Python for Automated Data Cleaning in Small Business Contexts".\n\nSection 2: Introduction & Background\nExplain why this topic matters. What problem are you solving? Cite at least 3 academic references to show you understand the existing research.\n\nSection 3: Research Objectives\nList 3-5 clear, measurable objectives. Start each with an action verb: "To identify...", "To compare...", "To evaluate...".\n\nSection 4: Methodology\nDescribe exactly how you will collect and analyze data. Will you do surveys? Experiments? Literature review? Be specific about your sample size and tools.\n\nSection 5: Timeline\nCreate a realistic Gantt chart showing when each phase will be completed.\n\nSection 6: References\nUse APA 7th edition format. Your supervisor will check this carefully.',
    category: 'Research',
    image_url: null,
    uploader_name: 'Ananya Sharma',
    uploader_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    faculty: 'Faculty of Computing & Technology',
    degree: 'BSc Information Systems',
    likes_count: 44,
    comments_count: 17,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// ------------------------------------------------------------------------------
// getCurrentStudent()
// Gets the logged-in student object from localStorage
// Returns the profile object or a default guest object
// ------------------------------------------------------------------------------
function getCurrentStudent() {
  // Try the active session key used by Member 1's login system
  var sessionStr = localStorage.getItem('uniskill_active_session');
  if (sessionStr) {
    try {
      var session = JSON.parse(sessionStr);
      // Return profile if available
      if (session.profile) return session.profile;
      // Otherwise return user metadata
      if (session.user) {
        var meta = session.user.user_metadata || {};
        return {
          id: session.user.id,
          full_name: meta.full_name || 'Student',
          faculty: meta.faculty || 'Faculty of Science',
          degree: meta.degree || 'Undergraduate',
          profile_image: meta.profile_image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=student'
        };
      }
    } catch (e) {}
  }

  // Fallback: check the mock session from supabase-config.js
  if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.mock) {
    var mockSession = window.SUPABASE_CONFIG.mock.getCurrentSession();
    if (mockSession && mockSession.profile) return mockSession.profile;
  }

  // Default guest (so pages still render without login)
  return {
    id: 'guest_user',
    full_name: 'Guest Student',
    faculty: 'Faculty of Science',
    degree: 'Undergraduate',
    profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'
  };
}

// ------------------------------------------------------------------------------
// formatTimeAgo()
// Converts an ISO date string into "2 hours ago", "3 days ago", etc.
// Simple enough to understand and explain during a presentation
// ------------------------------------------------------------------------------
function formatTimeAgo(isoString) {
  var date = new Date(isoString);
  var now = new Date();
  var diffMs = now - date;             // difference in milliseconds
  var diffMins = Math.floor(diffMs / 60000);
  var diffHours = Math.floor(diffMs / 3600000);
  var diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return diffMins + ' minutes ago';
  if (diffHours < 24) return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
  if (diffDays < 7) return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
  // If older than 7 days, show a date
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ------------------------------------------------------------------------------
// loadArticles()
// Main function: loads articles from all sources and shows them on screen
// Called from articles.html on page load
// ------------------------------------------------------------------------------
async function loadArticles() {
  var container = document.getElementById('articlesFeedContainer');
  if (!container) return;  // Not on the articles feed page, do nothing

  // Show a loading spinner while fetching
  container.innerHTML = '<div class="spinner-wrapper"><div class="spinner"></div><p style="margin-top: 10px; color: var(--text-muted); font-size: 13px;">Loading articles...</p></div>';

  var liveArticles = [];  // Articles from Supabase database

  // Step 1: Try to fetch from Supabase
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured()) {
    try {
      var result = await window.supabaseClient
        .from('articles')
        .select('id, user_id, title, content, category, image_url, created_at, profiles:user_id (full_name, faculty, degree, profile_image)')
        .order('created_at', { ascending: false })
        .limit(30);

      // If we got data without errors, use it
      if (!result.error && result.data && result.data.length > 0) {
        liveArticles = result.data.map(function(item) {
          return {
            id: item.id,
            user_id: item.user_id,
            title: item.title,
            content: item.content,
            category: item.category,
            image_url: item.image_url,
            uploader_name: (item.profiles && item.profiles.full_name) ? item.profiles.full_name : 'Student',
            uploader_image: (item.profiles && item.profiles.profile_image) ? item.profiles.profile_image : 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
            faculty: (item.profiles && item.profiles.faculty) ? item.profiles.faculty : 'University',
            degree: (item.profiles && item.profiles.degree) ? item.profiles.degree : 'Undergraduate',
            likes_count: 0,   // Counts will be fetched separately if needed
            comments_count: 0,
            created_at: item.created_at
          };
        });
      }
    } catch (fetchErr) {
      // Supabase failed – will fall back to local + sample data
      console.warn('Articles: Supabase fetch failed, using local data.', fetchErr);
    }
  }

  // Step 2: Merge with locally saved articles (from create-article.js)
  var localArticles = JSON.parse(localStorage.getItem('uniskill_local_articles') || '[]');

  // Step 3: Combine all sources: local first, then Supabase, then sample
  // Use a Map to deduplicate by article id
  var articleMap = new Map();

  // Add samples first (lowest priority – overwritten by real data)
  sampleArticles.forEach(function(art) {
    articleMap.set(art.id, art);
  });

  // Add live Supabase articles
  liveArticles.forEach(function(art) {
    articleMap.set(art.id, art);
  });

  // Add local articles last (highest priority – newest user content)
  localArticles.forEach(function(art) {
    articleMap.set(art.id, art);
  });

  // Convert map values to an array
  allArticles = Array.from(articleMap.values());

  // Sort by newest first by default
  allArticles.sort(function(a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  filteredArticles = allArticles.slice();  // Start with all articles visible

  // Step 4: Render the articles on screen
  renderArticlesFeed(container, filteredArticles);
}

// ------------------------------------------------------------------------------
// renderArticlesFeed()
// Renders the list of article cards into the container element
// ------------------------------------------------------------------------------
function renderArticlesFeed(container, articles) {
  if (!container) return;

  // If no articles at all, show empty state
  if (!articles || articles.length === 0) {
    container.innerHTML = [
      '<div class="empty-state-box">',
      '  <div class="empty-state-icon">📝</div>',
      '  <div class="empty-state-title">No Articles Found</div>',
      '  <div class="empty-state-desc">No articles match your search. Try a different keyword or category.</div>',
      '  <a href="create-article.html" class="btn btn-primary">Write First Article</a>',
      '</div>'
    ].join('');
    return;
  }

  // Build all cards
  var html = '';
  articles.forEach(function(article) {
    html += buildArticleFeedCard(article);
  });
  container.innerHTML = html;

  // Attach like button handlers to all newly rendered cards
  var likeButtons = container.querySelectorAll('.like-btn');
  likeButtons.forEach(function(btn) {
    attachArticleLikeHandler(btn);
  });
}

// ------------------------------------------------------------------------------
// buildArticleFeedCard()
// Builds the HTML string for one article feed card
// Follows the same pattern as dashboard.html feed cards
// ------------------------------------------------------------------------------
function buildArticleFeedCard(article) {
  var student = getCurrentStudent();

  // Get likes for this article from localStorage (so likes persist across page loads)
  var likedSet = getLikedArticles(student.id || 'guest');
  var isLiked = likedSet.has(article.id);
  var likeClass = isLiked ? 'like-btn liked' : 'like-btn';
  var likeCount = article.likes_count || 0;

  // Build the card's author avatar image
  var avatarSrc = article.uploader_image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(article.uploader_name || 'student');

  // Truncate the content for the preview excerpt (first 200 chars)
  var excerpt = (article.content || '').substring(0, 200);
  if (article.content && article.content.length > 200) excerpt += '...';

  // Time display
  var timeText = article.created_at ? formatTimeAgo(article.created_at) : 'Recently';

  // Build image section if article has a banner image
  var imageHtml = '';
  if (article.image_url) {
    imageHtml = '<img src="' + article.image_url + '" alt="Article image" class="article-feed-image" onerror="this.style.display=\'none\'">';
  }

  // Detail page link – works from articles/ folder
  var detailLink = 'article-details.html?id=' + encodeURIComponent(article.id);

  // Build and return the full card HTML
  return [
    '<article class="feed-card" id="feed-art-' + article.id + '" data-category="article" data-article-id="' + article.id + '">',
    '  <div class="feed-card-header">',
    '    <img src="' + avatarSrc + '" alt="' + escapeHTML(article.uploader_name || 'Student') + '" class="feed-card-avatar" onerror="this.src=\'https://api.dicebear.com/7.x/avataaars/svg?seed=student\'">',
    '    <div class="feed-card-author-info">',
    '      <h3 class="feed-card-author-name">' + escapeHTML(article.uploader_name || 'Student') + '</h3>',
    '      <p class="feed-card-author-sub">' + escapeHTML(article.degree || 'Undergraduate') + ' • ' + escapeHTML(article.faculty || 'University') + '</p>',
    '      <span class="feed-card-time">' + timeText + ' • Public</span>',
    '    </div>',
    '    <span class="feed-card-category">' + escapeHTML(article.category || 'General') + '</span>',
    '  </div>',
    '  <div class="feed-card-content">',
    imageHtml,
    '    <div class="article-feed-title">' + escapeHTML(article.title || 'Untitled Article') + '</div>',
    '    <p class="article-excerpt">' + escapeHTML(excerpt) + '</p>',
    '    <a href="' + detailLink + '" class="article-read-link">Read full article &rarr;</a>',
    '  </div>',
    '  <div class="feed-card-stats">',
    '    <span><span class="article-like-num-' + article.id + '">' + likeCount + '</span> Likes • ' + (article.comments_count || 0) + ' Comments</span>',
    '    <a href="' + detailLink + '" style="font-size: 11.5px; font-weight: 600; color: var(--primary-color);">Read Article &rarr;</a>',
    '  </div>',
    '  <div class="feed-card-actions">',
    '    <button class="feed-action-btn ' + likeClass + '" data-article-id="' + article.id + '" data-like-count="' + likeCount + '">',
    '      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017a2 2 0 01-1.789-1.106l-3.5-7A2 2 0 017.746 10H10V4a2 2 0 012-2h1a1 1 0 011 1v7z"/></svg>',
    '      Like (<span class="like-count">' + likeCount + '</span>)',
    '    </button>',
    '    <a href="' + detailLink + '" class="feed-action-btn" style="text-decoration: none;">',
    '      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>',
    '      Comment',
    '    </a>',
    '    <button class="feed-action-btn" onclick="shareArticle(\'' + article.id + '\')">',
    '      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>',
    '      Share',
    '    </button>',
    '  </div>',
    '</article>'
  ].join('\n');
}

// ------------------------------------------------------------------------------
// likeArticle() / attachArticleLikeHandler()
// Handles clicking the like button on an article card
// Saves liked state to localStorage so it persists across page reloads
// Also tries to update Supabase article_likes table
// ------------------------------------------------------------------------------
function attachArticleLikeHandler(btn) {
  btn.addEventListener('click', function() {
    likeArticle(btn);
  });
}

async function likeArticle(btn) {
  var articleId = btn.getAttribute('data-article-id');
  if (!articleId) return;

  var student = getCurrentStudent();
  var studentId = student.id || 'guest';

  // Get current liked set from localStorage
  var likedSet = getLikedArticles(studentId);
  var countSpan = btn.querySelector('.like-count');
  var currentCount = parseInt(btn.getAttribute('data-like-count') || '0', 10);

  if (btn.classList.contains('liked')) {
    // Currently liked – so unlike it
    btn.classList.remove('liked');
    likedSet.delete(articleId);
    currentCount = Math.max(0, currentCount - 1);

    // Try to delete from Supabase
    if (window.supabaseClient && student.id && student.id !== 'guest_user') {
      try {
        await window.supabaseClient
          .from('article_likes')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', student.id);
      } catch (e) {
        // Fail silently – local state already updated
      }
    }
  } else {
    // Not liked yet – like it
    btn.classList.add('liked');
    likedSet.add(articleId);
    currentCount = currentCount + 1;

    // Try to insert into Supabase
    if (window.supabaseClient && student.id && student.id !== 'guest_user') {
      try {
        await window.supabaseClient
          .from('article_likes')
          .insert({ article_id: articleId, user_id: student.id });
      } catch (e) {
        // Fail silently
      }
    }
  }

  // Update button and counter display
  btn.setAttribute('data-like-count', currentCount);
  if (countSpan) countSpan.textContent = currentCount;

  // Update the stats row count too (the span with class article-like-num-{id})
  var statsNum = document.querySelector('.article-like-num-' + articleId);
  if (statsNum) statsNum.textContent = currentCount;

  // Save liked set back to localStorage
  saveLikedArticles(studentId, likedSet);
}

// Get liked articles Set from localStorage
function getLikedArticles(studentId) {
  var key = 'uniskill_article_likes_' + studentId;
  var stored = localStorage.getItem(key);
  if (stored) {
    try {
      return new Set(JSON.parse(stored));
    } catch (e) {}
  }
  return new Set();
}

// Save liked articles Set back to localStorage
function saveLikedArticles(studentId, likedSet) {
  var key = 'uniskill_article_likes_' + studentId;
  localStorage.setItem(key, JSON.stringify(Array.from(likedSet)));
}

// ------------------------------------------------------------------------------
// searchArticles()
// Called when user types in the search input box
// Filters allArticles by title, content, category, author name
// ------------------------------------------------------------------------------
function searchArticles(query) {
  articleSearchQuery = (query || '').toLowerCase().trim();
  applyFiltersAndRender();
}

// ------------------------------------------------------------------------------
// filterArticles()
// Called when user selects a category or sort order
// ------------------------------------------------------------------------------
function filterArticles(category, sort) {
  if (category !== undefined) currentArticleCategory = category;
  if (sort !== undefined) currentArticleSort = sort;
  applyFiltersAndRender();
}

// ------------------------------------------------------------------------------
// applyFiltersAndRender()
// Applies all current filters (search + category + sort) then re-renders
// ------------------------------------------------------------------------------
function applyFiltersAndRender() {
  var container = document.getElementById('articlesFeedContainer');
  if (!container) return;

  // Start with all articles
  filteredArticles = allArticles.filter(function(article) {
    // Category filter
    if (currentArticleCategory !== 'all') {
      if ((article.category || '').toLowerCase() !== currentArticleCategory.toLowerCase()) {
        return false;
      }
    }

    // Search filter – check title, content, category, and author name
    if (articleSearchQuery) {
      var titleMatch = (article.title || '').toLowerCase().includes(articleSearchQuery);
      var contentMatch = (article.content || '').toLowerCase().includes(articleSearchQuery);
      var categoryMatch = (article.category || '').toLowerCase().includes(articleSearchQuery);
      var authorMatch = (article.uploader_name || '').toLowerCase().includes(articleSearchQuery);
      if (!titleMatch && !contentMatch && !categoryMatch && !authorMatch) {
        return false;
      }
    }

    return true;
  });

  // Apply sort order
  if (currentArticleSort === 'oldest') {
    filteredArticles.sort(function(a, b) {
      return new Date(a.created_at) - new Date(b.created_at);
    });
  } else if (currentArticleSort === 'popular') {
    filteredArticles.sort(function(a, b) {
      return (b.likes_count || 0) - (a.likes_count || 0);
    });
  } else {
    // Default: newest first
    filteredArticles.sort(function(a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  renderArticlesFeed(container, filteredArticles);
}

// ------------------------------------------------------------------------------
// shareArticle()
// Simple share function – copies URL to clipboard or shows alert
// ------------------------------------------------------------------------------
function shareArticle(articleId) {
  var link = window.location.origin + window.location.pathname.replace('articles.html', '') + 'article-details.html?id=' + articleId;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(function() {
      alert('Article link copied to clipboard!');
    });
  } else {
    alert('Share this article: ' + link);
  }
}

// ------------------------------------------------------------------------------
// updateNavbarUser()
// Updates the top navbar with current student's name and avatar
// Called from article pages that load this file
// ------------------------------------------------------------------------------
function updateNavbarUser() {
  var student = getCurrentStudent();
  var navName = document.getElementById('navUserName');
  var navAvatar = document.getElementById('navUserAvatar');

  if (navName && student.full_name) {
    navName.textContent = student.full_name.split(' ')[0];  // First name only
  }
  if (navAvatar && student.profile_image) {
    navAvatar.src = student.profile_image;
  }
}

// ------------------------------------------------------------------------------
// escapeHTML()
// Prevents XSS by replacing dangerous characters before inserting into HTML
// (Same function is in dashboard.js – re-declared here for standalone use)
// ------------------------------------------------------------------------------
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(char) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return map[char] || char;
  });
}

// Auto-update navbar when this script loads (works on all article pages)
document.addEventListener('DOMContentLoaded', function() {
  updateNavbarUser();
});
