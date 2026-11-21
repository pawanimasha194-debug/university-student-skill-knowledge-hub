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

// Community data is loaded exclusively from Supabase; no demo/localStorage questions.
function communityClient() {
  const client = window.supabaseClient;
  if (!client) throw new Error('Supabase is not available. Refresh the page.');
  return client;
}

async function communityUser() {
  const { data, error } = await communityClient().auth.getUser();
  if (error) throw error;
  if (!data?.user) throw new Error('Please log in to use Community Q&A.');
  return data.user;
}

function getActiveStudent() {
  if (typeof getCurrentStudent === 'function') {
    try { return getCurrentStudent(); } catch (_) {}
  }
  try {
    const session = JSON.parse(localStorage.getItem('uniskill_active_session') || 'null');
    return session?.profile || session?.user || null;
  } catch (_) { return null; }
}

function communityAvatar(profile, seed) {
  const url = profile?.profile_image;
  if (typeof url === 'string' && /^https:\/\//i.test(url)) return url.replace(/"/g, '&quot;');
  return 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(seed || 'student');
}

async function communityProfiles(userIds) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return {};
  const { data, error } = await communityClient().from('profiles')
    .select('id, full_name, faculty, profile_image').in('id', unique);
  if (error) {
    console.warn('Community profiles could not be loaded:', error.message);
    return {};
  }
  return Object.fromEntries((data || []).map(p => [p.id, p]));
}

async function loadQuestions() {
  const container = document.getElementById('questionsFeedContainer');
  if (!container) return;
  container.innerHTML = '<div class="spinner-wrapper"><div class="spinner"></div><p>Loading community discussions...</p></div>';
  try {
    await communityUser();
    const client = communityClient();
    const { data: questions, error } = await client.from('questions')
      .select('id, user_id, title, description, category, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const profiles = await communityProfiles((questions || []).map(q => q.user_id));
    const { data: answers, error: answersError } = await client.from('answers').select('question_id');
    if (answersError) throw answersError;
    const counts = {};
    (answers || []).forEach(a => { counts[a.question_id] = (counts[a.question_id] || 0) + 1; });
    allQuestions = (questions || []).map(q => {
      const profile = profiles[q.user_id];
      return { ...q, author_name: profile?.full_name || 'Student',
        author_faculty: profile?.faculty || 'University Student',
        author_image: communityAvatar(profile, q.user_id), answers_count: counts[q.id] || 0 };
    });
    searchCommunity();
  } catch (error) {
    console.error('Community questions load failed:', error);
    container.innerHTML = '<div class="empty-state-box">Unable to load questions: ' + escapeHTML(error.message || 'Unknown error') + '</div>';
  }
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
    const snippet = (q.description || '').substring(0, 220) + ((q.description || '').length > 220 ? '...' : '');

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
      const matchTitle = (q.title || '').toLowerCase().includes(questionSearchQuery);
      const matchDesc = (q.description || '').toLowerCase().includes(questionSearchQuery);
      const matchAuthor = (q.author_name || '').toLowerCase().includes(questionSearchQuery);
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
  const title = titleEl.value.trim(), category = catEl.value, description = descEl.value.trim();
  if (title.length < 8) { alert('Please enter a descriptive question title (at least 8 characters).'); titleEl.focus(); return; }
  if (!category) { alert('Please select a category for your question.'); catEl.focus(); return; }
  if (description.length < 20) { alert('Please provide additional context or description (at least 20 characters).'); descEl.focus(); return; }
  try {
    const user = await communityUser();
    const { error } = await communityClient().from('questions').insert({
      user_id: user.id, title, description, category
    });
    if (error) throw error;
    alert('Question posted successfully to the community!');
    window.location.href = 'community.html';
  } catch (error) {
    console.error('Question publishing failed:', error);
    alert('Question was not saved: ' + (error.message || 'Unknown error'));
  }
}

async function loadQuestionDetails() {
  const qId = new URLSearchParams(window.location.search).get('id');
  if (!qId) { window.location.href = 'community.html'; return; }
  try {
    await communityUser();
    const { data: question, error } = await communityClient().from('questions')
      .select('id, user_id, title, description, category, created_at').eq('id', qId).maybeSingle();
    if (error) throw error;
    if (!question) throw new Error('Question not found.');
    const profiles = await communityProfiles([question.user_id]);
    const profile = profiles[question.user_id];
    const fields = {
      detailQuestionTitle: question.title, detailQuestionCategory: question.category,
      detailQuestionBody: question.description, detailAuthorName: profile?.full_name || 'Student',
      detailAuthorFaculty: profile?.faculty || 'University Student',
      detailQuestionTime: formatTimeAgoCommunity(question.created_at)
    };
    Object.entries(fields).forEach(([id, value]) => {
      const el = document.getElementById(id); if (el) el.textContent = value;
    });
    const img = document.getElementById('detailAuthorImage');
    if (img) img.src = communityAvatar(profile, question.user_id);
    await loadAnswers(qId);
  } catch (error) {
    console.error('Question details load failed:', error);
    alert('Unable to load question: ' + (error.message || 'Unknown error'));
  }
}

async function loadAnswers(qId) {
  const container = document.getElementById('answersListContainer');
  const countEl = document.getElementById('answersCountHeader');
  if (!container) return;
  try {
    const { data: answers, error } = await communityClient().from('answers')
      .select('id, question_id, user_id, answer, created_at')
      .eq('question_id', qId).order('created_at', { ascending: true });
    if (error) throw error;
    const profiles = await communityProfiles((answers || []).map(a => a.user_id));
    if (countEl) countEl.textContent = `${(answers || []).length} Answers`;
    if (!answers?.length) {
      container.innerHTML = '<div class="empty-state-box" style="padding:24px"><div class="empty-state-desc">No answers posted yet. Share your insights to help this student!</div></div>';
      return;
    }
    container.innerHTML = answers.map(ans => {
      const profile = profiles[ans.user_id];
      const name = profile?.full_name || 'Student';
      return `<div class="answer-item"><div class="answer-header">
        <img src="${communityAvatar(profile, ans.user_id)}" alt="${escapeHTML(name)}" class="answer-avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=peer'">
        <div><div style="font-weight:700;font-size:13.5px">${escapeHTML(name)}</div>
        <div style="font-size:11.5px;color:var(--text-subtle)">${formatTimeAgoCommunity(ans.created_at)}</div></div></div>
        <div class="answer-content">${escapeHTML(ans.answer)}</div></div>`;
    }).join('');
  } catch (error) {
    console.error('Answers load failed:', error);
    container.textContent = 'Unable to load answers: ' + (error.message || 'Unknown error');
  }
}

async function submitAnswer() {
  const qId = new URLSearchParams(window.location.search).get('id');
  const answerInput = document.getElementById('replyTextInput');
  if (!answerInput || !qId) return;
  const answer = answerInput.value.trim();
  if (answer.length < 5) { alert('Please enter an answer with at least 5 characters.'); answerInput.focus(); return; }
  try {
    const user = await communityUser();
    const { error } = await communityClient().from('answers').insert({
      question_id: qId, user_id: user.id, answer
    });
    if (error) throw error;
    answerInput.value = '';
    await loadAnswers(qId);
    alert('Your answer has been submitted successfully!');
  } catch (error) {
    console.error('Answer publishing failed:', error);
    alert('Answer was not saved: ' + (error.message || 'Unknown error'));
  }
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
