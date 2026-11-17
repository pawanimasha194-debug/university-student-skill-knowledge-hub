/**
 * ==============================================================================
 * UniSkill Hub - Community Discussion & Collaboration
 * File: js/community.js
 * Module: Member 5 – Community Discussion & Collaboration
 * Functions:
 *   - postQuestion()        — Posts a new academic question or study inquiry
 *   - loadQuestions()       — Loads community discussion questions
 *   - submitAnswer()        — Submits a reply / answer to a question
 *   - loadAnswers()         — Loads all peer answers for a question
 *   - loadNotifications()   — Retrieves student activity notifications
 *   - markNotificationRead()— Updates notification read state
 * ==============================================================================
 */

// Global questions state
let allQuestions = [];
let filteredQuestions = [];
let currentQuestionCategory = 'all';
let questionSearchQuery = '';

// Default sample questions for demonstration
const defaultSampleQuestions = [
  {
    id: 'q-sample-01',
    user_id: 'usr_malith_04',
    author_name: 'Malith Jayasuriya',
    author_faculty: 'Faculty of Engineering',
    author_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    title: 'How do you determine whether a graph has an Eulerian path vs an Eulerian circuit?',
    description: 'During yesterday’s discrete structures lecture, we discussed Euler paths. I understand that an Eulerian circuit visits every edge once and starts/ends at the same vertex, but what is the exact degree condition for an Euler path where start != end? Worked examples would be deeply appreciated!',
    category: 'Mathematics',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    answers_count: 2
  },
  {
    id: 'q-sample-02',
    user_id: 'usr_ananya_05',
    author_name: 'Ananya Sharma',
    author_faculty: 'Faculty of Computing & Technology',
    author_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    title: 'Recommended dataset sources for undergraduate Machine Learning final year projects?',
    description: 'Our project group is working on credit card fraud detection and customer churn modeling. Aside from the standard Kaggle datasets, are there university repositories or local Sri Lankan financial datasets available for academic research?',
    category: 'Programming',
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    answers_count: 3
  },
  {
    id: 'q-sample-03',
    user_id: 'usr_samudi_01',
    author_name: 'Samudi Wijesinghe',
    author_faculty: 'Faculty of Applied Sciences',
    author_image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    title: 'Difference between Type I and Type II errors in hypothesis testing?',
    description: 'Freshmen in our tutoring circle often confuse rejecting a true null hypothesis vs failing to reject a false null hypothesis. What is the most memorable mnemonic or real-world analogy to remember alpha and beta errors?',
    category: 'Statistics',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    answers_count: 4
  },
  {
    id: 'q-sample-04',
    user_id: 'usr_dinuka_06',
    author_name: 'Dinuka Senanayake',
    author_faculty: 'Faculty of Management Studies',
    author_image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    title: 'Best approach for 3NF table decomposition when partial dependencies exist?',
    description: 'If a relational schema has composite keys and partial functional dependencies, should we always transition through 2NF before attempting 3NF, or can we directly eliminate transitive dependencies?',
    category: 'Database',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    answers_count: 1
  }
];

// Default sample answers
const defaultSampleAnswers = [
  {
    id: 'ans-sample-01',
    question_id: 'q-sample-01',
    user_id: 'usr_kaveen_02',
    author_name: 'Kaveen Perera',
    author_image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    answer: 'An undirected graph has an **Eulerian path** if and only if exactly 2 vertices have an ODD degree, and all other vertices have an EVEN degree. The path must start at one odd-degree vertex and end at the other odd-degree vertex. If all vertices have EVEN degree, it is an **Eulerian circuit**!',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'ans-sample-02',
    question_id: 'q-sample-01',
    user_id: 'usr_samudi_01',
    author_name: 'Samudi Wijesinghe',
    author_image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    answer: 'Also remember to check that all vertices with non-zero degree belong to a single connected component! Otherwise the path condition fails regardless of degrees.',
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
  },
  {
    id: 'ans-sample-03',
    question_id: 'q-sample-03',
    user_id: 'usr_tharushi_03',
    author_name: 'Tharushi Fernando',
    author_image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    answer: 'The boy who cried wolf analogy is classic: \n- Type I Error (False Positive): The villagers believe there is a wolf when there is no wolf (Alpha).\n- Type II Error (False Negative): The villagers believe there is no wolf when there is actually a wolf (Beta).',
    created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
  }
];

// Helper to get active student
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
// 1. loadQuestions()
// Loads community questions from Supabase and local storage
// ------------------------------------------------------------------------------
async function loadQuestions() {
  const container = document.getElementById('questionsFeedContainer');
  if (!container) return;

  container.innerHTML = '<div class="spinner-wrapper"><div class="spinner"></div><p style="margin-top: 10px; color: var(--text-muted); font-size: 13px;">Loading community discussions...</p></div>';

  let liveQuestions = [];
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured()) {
    try {
      const { data, error } = await window.supabaseClient
        .from('questions')
        .select('id, user_id, title, description, category, created_at, profiles:user_id(full_name, faculty, profile_image)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        liveQuestions = data.map(q => ({
          id: q.id,
          user_id: q.user_id,
          author_name: q.profiles?.full_name || 'Student',
          author_faculty: q.profiles?.faculty || 'Faculty of Science',
          author_image: q.profiles?.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(q.title)}`,
          title: q.title,
          description: q.description,
          category: q.category,
          created_at: q.created_at,
          answers_count: 0
        }));
      }
    } catch (e) {
      console.warn('Questions Supabase fetch warning:', e);
    }
  }

  // Merge with locally stored questions and default samples
  const localQuestions = JSON.parse(localStorage.getItem('uniskill_questions') || '[]');
  const qMap = new Map();

  defaultSampleQuestions.forEach(q => qMap.set(q.id, q));
  liveQuestions.forEach(q => qMap.set(q.id, q));
  localQuestions.forEach(q => qMap.set(q.id, q));

  allQuestions = Array.from(qMap.values());
  allQuestions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Compute live answers count from answers storage
  const localAnswers = JSON.parse(localStorage.getItem('uniskill_answers') || '[]');
  allQuestions.forEach(q => {
    const ansList = [...defaultSampleAnswers, ...localAnswers].filter(a => a.question_id === q.id);
    q.answers_count = ansList.length;
  });

  filteredQuestions = [...allQuestions];
  renderQuestionsFeed(container, filteredQuestions);
}

// ------------------------------------------------------------------------------
// renderQuestionsFeed()
// Renders question cards into feed
// ------------------------------------------------------------------------------
function renderQuestionsFeed(container, questions) {
  if (!container) return;

  if (!questions || questions.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-icon">💭</div>
        <div class="empty-state-title">No Discussions Found</div>
        <div class="empty-state-desc">Be the first to start an academic discussion or ask a question!</div>
        <a href="ask-question.html" class="btn btn-primary" style="margin-top: 10px;">Ask a Question</a>
      </div>
    `;
    return;
  }

  let html = '';
  questions.forEach(q => {
    const timeText = formatTimeAgoCommunity(q.created_at);
    const snippet = (q.description || '').substring(0, 220) + (q.description.length > 220 ? '...' : '');

    html += `
      <div class="question-card" id="q-${q.id}">
        <div class="question-card-header">
          <img src="${q.author_image}" alt="${escapeHTML(q.author_name)}" class="question-author-avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=student'">
          <div class="question-author-info">
            <div class="question-author-name">${escapeHTML(q.author_name)}</div>
            <div class="question-meta">${escapeHTML(q.author_faculty)} • ${timeText}</div>
          </div>
          <span class="skill-pill" style="margin: 0;">${escapeHTML(q.category || 'General')}</span>
        </div>

        <a href="question-details.html?id=${q.id}" class="question-title">${escapeHTML(q.title)}</a>
        <p class="question-excerpt">${escapeHTML(snippet)}</p>

        <div class="question-footer">
          <a href="question-details.html?id=${q.id}" class="answers-count-badge">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/></svg>
            ${q.answers_count} Answers
          </a>
          <a href="question-details.html?id=${q.id}" class="btn btn-outline btn-sm">Answer & View &rarr;</a>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ------------------------------------------------------------------------------
// Filter & Search Questions
// ------------------------------------------------------------------------------
function searchCommunity(query) {
  if (query !== undefined) questionSearchQuery = query.toLowerCase().trim();

  filteredQuestions = allQuestions.filter(q => {
    if (questionSearchQuery) {
      const matchTitle = q.title.toLowerCase().includes(questionSearchQuery);
      const matchDesc = q.description.toLowerCase().includes(questionSearchQuery);
      const matchAuthor = q.author_name.toLowerCase().includes(questionSearchQuery);
      if (!matchTitle && !matchDesc && !matchAuthor) return false;
    }

    if (currentQuestionCategory !== 'all') {
      if (q.category.toLowerCase() !== currentQuestionCategory.toLowerCase()) return false;
    }

    return true;
  });

  const container = document.getElementById('questionsFeedContainer');
  renderQuestionsFeed(container, filteredQuestions);
}

function filterQuestionCategory(btn, category) {
  document.querySelectorAll('.community-category-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentQuestionCategory = category;
  searchCommunity();
}

// ------------------------------------------------------------------------------
// 2. postQuestion()
// Submits a new question from ask-question.html
// ------------------------------------------------------------------------------
async function postQuestion() {
  const titleEl = document.getElementById('questionTitle');
  const catEl = document.getElementById('questionCategory');
  const descEl = document.getElementById('questionDescription');

  if (!titleEl || !catEl || !descEl) return;

  const title = titleEl.value.trim();
  const category = catEl.value;
  const description = descEl.value.trim();

  // Validation
  if (title.length < 8) {
    alert('Please enter a descriptive question title (at least 8 characters).');
    titleEl.focus();
    return;
  }
  if (!category) {
    alert('Please select a category for your question.');
    catEl.focus();
    return;
  }
  if (description.length < 20) {
    alert('Please provide additional context or description (at least 20 characters).');
    descEl.focus();
    return;
  }

  const current = getActiveStudent();
  const newQuestion = {
    id: 'q-' + Date.now(),
    user_id: current.id,
    author_name: current.full_name || 'Student',
    author_faculty: current.faculty || 'Faculty of Science',
    author_image: current.profile_image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
    title: title,
    description: description,
    category: category,
    created_at: new Date().toISOString(),
    answers_count: 0
  };

  // Try Supabase insert
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && current.id !== 'guest_user') {
    try {
      await window.supabaseClient.from('questions').insert({
        user_id: current.id,
        title: title,
        description: description,
        category: category
      });
    } catch (e) {
      console.warn('Supabase post question warning:', e);
    }
  }

  // Persist locally
  const localQuestions = JSON.parse(localStorage.getItem('uniskill_questions') || '[]');
  localQuestions.unshift(newQuestion);
  localStorage.setItem('uniskill_questions', JSON.stringify(localQuestions));

  alert('Question posted successfully to the community!');
  window.location.href = 'community.html';
}

// ------------------------------------------------------------------------------
// 3. loadQuestionDetails() & loadAnswers()
// Used in question-details.html
// ------------------------------------------------------------------------------
async function loadQuestionDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const qId = urlParams.get('id');

  if (!qId) {
    window.location.href = 'community.html';
    return;
  }

  const localQuestions = JSON.parse(localStorage.getItem('uniskill_questions') || '[]');
  const allKnown = [...localQuestions, ...defaultSampleQuestions];
  const question = allKnown.find(q => q.id === qId);

  if (!question) {
    alert('Question not found.');
    window.location.href = 'community.html';
    return;
  }

  const titleEl = document.getElementById('detailQuestionTitle');
  const catEl = document.getElementById('detailQuestionCategory');
  const bodyEl = document.getElementById('detailQuestionBody');
  const authorNameEl = document.getElementById('detailAuthorName');
  const authorFacultyEl = document.getElementById('detailAuthorFaculty');
  const authorImgEl = document.getElementById('detailAuthorImage');
  const timeEl = document.getElementById('detailQuestionTime');

  if (titleEl) titleEl.textContent = question.title;
  if (catEl) catEl.textContent = question.category;
  if (bodyEl) bodyEl.textContent = question.description;
  if (authorNameEl) authorNameEl.textContent = question.author_name;
  if (authorFacultyEl) authorFacultyEl.textContent = question.author_faculty;
  if (authorImgEl) authorImgEl.src = question.author_image;
  if (timeEl) timeEl.textContent = formatTimeAgoCommunity(question.created_at);

  await loadAnswers(qId);
}

async function loadAnswers(qId) {
  const answersContainer = document.getElementById('answersListContainer');
  const countEl = document.getElementById('answersCountHeader');
  if (!answersContainer) return;

  const localAnswers = JSON.parse(localStorage.getItem('uniskill_answers') || '[]');
  const allAns = [...defaultSampleAnswers, ...localAnswers].filter(a => a.question_id === qId);

  if (countEl) countEl.textContent = `${allAns.length} Answers`;

  if (allAns.length === 0) {
    answersContainer.innerHTML = `
      <div class="empty-state-box" style="padding: 24px;">
        <div class="empty-state-desc">No answers posted yet. Share your insights to help this student!</div>
      </div>
    `;
    return;
  }

  let html = '';
  allAns.forEach(ans => {
    html += `
      <div class="answer-item">
        <div class="answer-header">
          <img src="${ans.author_image}" alt="${escapeHTML(ans.author_name)}" class="answer-avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=peer'">
          <div>
            <div style="font-weight: 700; font-size: 13.5px;">${escapeHTML(ans.author_name)}</div>
            <div style="font-size: 11.5px; color: var(--text-subtle);">${formatTimeAgoCommunity(ans.created_at)}</div>
          </div>
        </div>
        <div class="answer-content">${escapeHTML(ans.answer)}</div>
      </div>
    `;
  });

  answersContainer.innerHTML = html;
}

// ------------------------------------------------------------------------------
// 4. submitAnswer()
// Submits a reply in question-details.html
// ------------------------------------------------------------------------------
async function submitAnswer() {
  const urlParams = new URLSearchParams(window.location.search);
  const qId = urlParams.get('id');
  const answerInput = document.getElementById('replyTextInput');

  if (!answerInput || !qId) return;

  const text = answerInput.value.trim();
  if (text.length < 5) {
    alert('Please enter an answer with at least 5 characters.');
    answerInput.focus();
    return;
  }

  const current = getActiveStudent();
  const newAnswer = {
    id: 'ans-' + Date.now(),
    question_id: qId,
    user_id: current.id,
    author_name: current.full_name || 'Student',
    author_image: current.profile_image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
    answer: text,
    created_at: new Date().toISOString()
  };

  // Try Supabase insert
  if (window.supabaseClient && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && current.id !== 'guest_user') {
    try {
      await window.supabaseClient.from('answers').insert({
        question_id: qId,
        user_id: current.id,
        answer: text
      });
    } catch (e) {
      console.warn('Supabase answer insert warning:', e);
    }
  }

  // Persist locally
  const localAnswers = JSON.parse(localStorage.getItem('uniskill_answers') || '[]');
  localAnswers.push(newAnswer);
  localStorage.setItem('uniskill_answers', JSON.stringify(localAnswers));

  // Clear text
  answerInput.value = '';

  alert('Your answer has been submitted successfully!');
  await loadAnswers(qId);
}

// ------------------------------------------------------------------------------
// 5. loadNotifications()
// Retrieves student activity notifications in notifications.html
// ------------------------------------------------------------------------------
function loadNotifications() {
  const container = document.getElementById('notificationsFeed');
  if (!container) return;

  const current = getActiveStudent();
  const stored = JSON.parse(localStorage.getItem('uniskill_notifications') || '[]');

  // Default sample notifications if fresh
  const defaultNotifs = [
    {
      id: 'notif-def-01',
      user_id: current.id,
      message: 'Kaveen Perera shared a new resource: Relational Database Normalization Guide.',
      type: 'resource',
      is_read: false,
      created_at: new Date(Date.now() - 3600 * 1000).toISOString()
    },
    {
      id: 'notif-def-02',
      user_id: current.id,
      message: 'Samudi Wijesinghe commented on your article: "Understanding Regression Analysis".',
      type: 'comment',
      is_read: false,
      created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
    },
    {
      id: 'notif-def-03',
      user_id: current.id,
      message: 'Tharushi Fernando accepted your peer connection request.',
      type: 'connection',
      is_read: true,
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    }
  ];

  const merged = [...stored, ...defaultNotifs];

  if (merged.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-icon">🔔</div>
        <div class="empty-state-title">No Notifications Yet</div>
        <div class="empty-state-desc">You are all caught up! New peer connections, comments, and resource updates will appear here.</div>
      </div>
    `;
    return;
  }

  let html = '';
  merged.forEach(n => {
    const unreadClass = n.is_read ? '' : 'unread';
    const dotHtml = n.is_read ? '' : '<div class="unread-dot"></div>';
    let icon = '🔔';
    if (n.message.includes('connection')) icon = '👥';
    if (n.message.includes('resource')) icon = '📚';
    if (n.message.includes('comment') || n.message.includes('article')) icon = '💬';

    html += `
      <div class="notification-item ${unreadClass}" onclick="markNotificationRead('${n.id}')">
        <div class="notification-icon-wrap">${icon}</div>
        <div class="notification-content">
          <div class="notification-text">${escapeHTML(n.message)}</div>
          <div class="notification-time">${formatTimeAgoCommunity(n.created_at)}</div>
        </div>
        ${dotHtml}
      </div>
    `;
  });

  container.innerHTML = html;
}

function markNotificationRead(notifId) {
  const stored = JSON.parse(localStorage.getItem('uniskill_notifications') || '[]');
  const match = stored.find(n => n.id === notifId);
  if (match) {
    match.is_read = true;
    localStorage.setItem('uniskill_notifications', JSON.stringify(stored));
  }
}

function markAllNotificationsRead() {
  const stored = JSON.parse(localStorage.getItem('uniskill_notifications') || '[]');
  stored.forEach(n => n.is_read = true);
  localStorage.setItem('uniskill_notifications', JSON.stringify(stored));
  loadNotifications();
}

// ------------------------------------------------------------------------------
// Time Formatter
// ------------------------------------------------------------------------------
function formatTimeAgoCommunity(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMins = Math.floor((now - date) / 60000);
  const diffHours = Math.floor((now - date) / 3600000);
  const diffDays = Math.floor((now - date) / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Global escape
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(char) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[char] || char;
  });
}
