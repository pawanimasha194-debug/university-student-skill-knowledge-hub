/**
 * ==============================================================================
 * UniSkill Hub - Dashboard Logic & Feed Operations
 * File: js/dashboard.js
 * Functions: checkUserSession(), loadUserProfile()
 * Description: Verifies student authentication, loads student profile data from
 * Supabase `profiles` table, renders feeds, interactive likes, and suggested peers.
 * ==============================================================================
 */

// Global active user state
let currentStudent = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. First, check user session
  const session = await checkUserSession();
  if (!session) {
    // If not logged in, checkUserSession() redirects to login.html
    return;
  }

  // 2. Load and render student profile
  await loadUserProfile(session);

  // 3. Initialize dashboard components & listeners
  initPostCreator();
  initLikeButtons();
  initConnectButtons();
  initFeedFilterTabs();
  initProfileModal();
  loadDashboardResources(); // Member 2 Resource integration
  loadDashboardArticles();  // Member 3 Knowledge & Article integration
});

/**
 * ------------------------------------------------------------------------------
 * Check User Session
 * Verifies if user is logged into Supabase Auth or Demo Mode
 * ------------------------------------------------------------------------------
 */
async function checkUserSession() {
  try {
    // 1. Check Live Supabase Auth Session
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && window.supabaseClient) {
      const { data: { session }, error } = await window.supabaseClient.auth.getSession();
      if (!error && session) {
        return session;
      }
    }

    // 2. Fallback: Check local active student session (stored during registration or login)
    const localActive = localStorage.getItem('uniskill_active_session');
    if (localActive) {
      const parsed = JSON.parse(localActive);
      if (parsed && (parsed.user || parsed.profile)) {
        return parsed;
      }
    }

    // 3. Fallback: Check Demo Mode Session
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.mock) {
      const mockSession = window.SUPABASE_CONFIG.mock.getCurrentSession();
      if (mockSession) {
        return mockSession;
      }
    }

    console.warn('No active student session found. Redirecting to login.');
    window.location.href = 'login.html';
    return null;

  } catch (err) {
    console.error('Session check failed:', err);
    window.location.href = 'login.html';
    return null;
  }
}

/**
 * ------------------------------------------------------------------------------
 * Load User Profile
 * Fetches profile from Supabase `profiles` table and updates the UI
 * ------------------------------------------------------------------------------
 */
async function loadUserProfile(session) {
  try {
    let profileData = null;

    // Fetch from Supabase Database `profiles` table
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && window.supabaseClient && session.user?.id) {
      const userId = session.user.id;
      
      const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        profileData = data;
      } else if (session.profile) {
        profileData = session.profile;
      } else {
        // Fallback to user metadata if profile table row not yet created
        const meta = session.user.user_metadata || {};
        profileData = {
          id: userId,
          full_name: meta.full_name || 'Undergraduate Student',
          email: session.user.email,
          faculty: meta.faculty || 'Faculty of Science',
          degree: meta.degree || 'Bachelor of Science',
          academic_year: meta.academic_year || '1st Year',
          skills: meta.skills || 'Problem Solving, Teamwork',
          bio: 'University undergraduate student exploring skills on UniSkill Hub.',
          profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(meta.full_name || 'Student')}`
        };
      }
    } else {
      // Offline / Local Session
      profileData = session.profile || {
        full_name: session.user?.user_metadata?.full_name || 'Undergraduate Student',
        email: session.user?.email || 'student@university.ac.lk',
        faculty: 'Faculty of Computing & Technology',
        degree: 'BSc Software Engineering',
        academic_year: '2nd Year',
        skills: 'Web Development, Java, SQL',
        bio: 'Passionate student sharing knowledge and skills.',
        profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      };
    }

    currentStudent = profileData;
    renderProfileToUI(profileData);

  } catch (err) {
    console.error('Failed to load profile data:', err);
  }
}

/**
 * Updates DOM with the loaded student profile details
 */
function renderProfileToUI(profile) {
  // 1. Top Navbar User Display
  const navUserName = document.getElementById('navUserName');
  const navUserAvatar = document.getElementById('navUserAvatar');
  if (navUserName) navUserName.textContent = profile.full_name.split(' ')[0];
  if (navUserAvatar && profile.profile_image) navUserAvatar.src = profile.profile_image;

  // 2. Left Column Profile Summary Card
  const summaryName = document.getElementById('summaryName');
  const summaryFaculty = document.getElementById('summaryFaculty');
  const summaryDegree = document.getElementById('summaryDegree');
  const summaryYear = document.getElementById('summaryYear');
  const summaryAvatar = document.getElementById('summaryAvatar');
  const summarySkillsList = document.getElementById('summarySkillsList');

  if (summaryName) summaryName.textContent = profile.full_name;
  if (summaryFaculty) summaryFaculty.textContent = profile.faculty || 'University Faculty';
  if (summaryDegree) summaryDegree.textContent = profile.degree || 'Degree Program';
  if (summaryYear) summaryYear.textContent = profile.academic_year || 'Undergraduate';
  if (summaryAvatar && profile.profile_image) summaryAvatar.src = profile.profile_image;

  // Render skills as pills in summary card
  if (summarySkillsList && profile.skills) {
    summarySkillsList.innerHTML = '';
    const skillsArray = typeof profile.skills === 'string' 
      ? profile.skills.split(',').map(s => s.trim()).filter(Boolean)
      : profile.skills;

    skillsArray.slice(0, 4).forEach(skill => {
      const span = document.createElement('span');
      span.className = 'skill-pill';
      span.textContent = skill;
      summarySkillsList.appendChild(span);
    });
  }

  // Update Academic Reputation in Dashboard Widget (Feature 2, 14, 18)
  if (window.AcademicCore) {
    const rep = window.AcademicCore.calculateAcademicReputation(profile.id || 'usr_current');
    const scoreEl = document.getElementById('dashRepScore');
    const barEl = document.getElementById('dashRepBar');
    const badgesWrap = document.getElementById('dashBadgesWrap');

    if (scoreEl) scoreEl.textContent = `${rep.score} / 100`;
    if (barEl) barEl.style.width = `${rep.score}%`;
    if (badgesWrap && rep.badges) {
      badgesWrap.innerHTML = rep.badges.map(b => 
        `<span class="academic-badge top-tutor" title="${b.description}">${b.icon} ${b.name}</span>`
      ).join(' ');
    }
  }

  // 3. Middle Column Post Creator Avatar & Welcome Header
  const postCreatorAvatar = document.getElementById('postCreatorAvatar');
  const welcomeStudentName = document.getElementById('welcomeStudentName');

  if (postCreatorAvatar && profile.profile_image) {
    postCreatorAvatar.src = profile.profile_image;
  }
  if (welcomeStudentName) {
    welcomeStudentName.textContent = profile.full_name;
  }

  // 4. Populate Modal Details
  const modalName = document.getElementById('modalProfileName');
  const modalEmail = document.getElementById('modalProfileEmail');
  const modalFaculty = document.getElementById('modalProfileFaculty');
  const modalDegree = document.getElementById('modalProfileDegree');
  const modalYear = document.getElementById('modalProfileYear');
  const modalBio = document.getElementById('modalProfileBio');
  const modalSkills = document.getElementById('modalProfileSkills');
  const modalAvatar = document.getElementById('modalProfileAvatar');

  if (modalName) modalName.textContent = profile.full_name;
  if (modalEmail) modalEmail.textContent = profile.email;
  if (modalFaculty) modalFaculty.textContent = profile.faculty;
  if (modalDegree) modalDegree.textContent = profile.degree;
  if (modalYear) modalYear.textContent = profile.academic_year;
  if (modalBio) modalBio.textContent = profile.bio || 'Undergraduate student sharing skills on UniSkill Hub.';
  if (modalAvatar && profile.profile_image) modalAvatar.src = profile.profile_image;

  if (modalSkills && profile.skills) {
    modalSkills.innerHTML = '';
    const skillsArray = typeof profile.skills === 'string' 
      ? profile.skills.split(',').map(s => s.trim()).filter(Boolean)
      : profile.skills;

    skillsArray.forEach(skill => {
      const span = document.createElement('span');
      span.className = 'skill-pill';
      span.textContent = skill;
      modalSkills.appendChild(span);
    });
  }
}

/**
 * ------------------------------------------------------------------------------
 * Post Creator Interaction
 * Lets students post updates, study notes, or questions to the middle feed
 * ------------------------------------------------------------------------------
 */
function initPostCreator() {
  const postBtn = document.getElementById('publishPostBtn');
  const postInput = document.getElementById('postTextInput');
  const feedContainer = document.getElementById('studentFeedContainer');

  if (!postBtn || !postInput || !feedContainer) return;

  postBtn.addEventListener('click', () => {
    const text = postInput.value.trim();
    if (!text) {
      alert('Please enter a note or question to share with students.');
      return;
    }

    const studentName = currentStudent ? currentStudent.full_name : 'Student';
    const studentDegree = currentStudent ? currentStudent.degree : 'Undergraduate';
    const studentAvatar = currentStudent && currentStudent.profile_image 
      ? currentStudent.profile_image 
      : 'https://api.dicebear.com/7.x/avataaars/svg?seed=student';

    // Create new feed card element
    const newCard = document.createElement('div');
    newCard.className = 'feed-card';
    newCard.innerHTML = `
      <div class="feed-card-header">
        <img src="${studentAvatar}" alt="${studentName}" class="feed-card-avatar">
        <div class="feed-card-author-info">
          <h4 class="feed-card-author-name">${studentName}</h4>
          <p class="feed-card-author-sub">${studentDegree} • Just now</p>
          <span class="feed-card-category" style="margin-top: 4px;">Student Post</span>
        </div>
      </div>
      <div class="feed-card-content">
        <p>${escapeHTML(text)}</p>
      </div>
      <div class="feed-card-stats">
        <span>0 Likes • 0 Comments</span>
      </div>
      <div class="feed-card-actions">
        <button class="feed-action-btn like-btn">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017a2 2 0 01-1.789-1.106l-3.5-7A2 2 0 017.746 10H10V4a2 2 0 012-2h1a1 1 0 011 1v7z"/></svg>
          Like (<span class="like-count">0</span>)
        </button>
        <button class="feed-action-btn">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          Comment
        </button>
        <button class="feed-action-btn">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
          Share
        </button>
      </div>
    `;

    // Prepend to top of feed
    feedContainer.prepend(newCard);

    // Bind like button on new post
    const newLikeBtn = newCard.querySelector('.like-btn');
    if (newLikeBtn) attachLikeHandler(newLikeBtn);

    // Clear input
    postInput.value = '';
  });
}

/**
 * ------------------------------------------------------------------------------
 * Interactive Likes on Feed Cards
 * ------------------------------------------------------------------------------
 */
function initLikeButtons() {
  const likeButtons = document.querySelectorAll('.like-btn');
  likeButtons.forEach(btn => attachLikeHandler(btn));
}

function attachLikeHandler(btn) {
  btn.addEventListener('click', () => {
    const countSpan = btn.querySelector('.like-count');
    let currentLikes = parseInt(countSpan ? countSpan.textContent : '0', 10);

    if (btn.classList.contains('liked')) {
      btn.classList.remove('liked');
      if (countSpan) countSpan.textContent = Math.max(0, currentLikes - 1);
    } else {
      btn.classList.add('liked');
      if (countSpan) countSpan.textContent = currentLikes + 1;
    }
  });
}

/**
 * ------------------------------------------------------------------------------
 * Suggested Peers "Connect" Button Toggle
 * ------------------------------------------------------------------------------
 */
function initConnectButtons() {
  const connectBtns = document.querySelectorAll('.btn-connect');
  connectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('connected')) {
        btn.classList.remove('connected');
        btn.textContent = '+ Connect';
      } else {
        btn.classList.add('connected');
        btn.textContent = 'Connected ✓';
      }
    });
  });
}

/**
 * ------------------------------------------------------------------------------
 * Feed Filter Tabs (All, Resources, Articles)
 * ------------------------------------------------------------------------------
 */
function initFeedFilterTabs() {
  const tabs = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.feed-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filterType = tab.dataset.filter;
      cards.forEach(card => {
        if (!filterType || filterType === 'all') {
          card.style.display = 'block';
        } else {
          const category = card.dataset.category;
          card.style.display = category === filterType ? 'block' : 'none';
        }
      });
    });
  });
}

/**
 * ------------------------------------------------------------------------------
 * View Full Profile Modal Handlers
 * ------------------------------------------------------------------------------
 */
function initProfileModal() {
  const viewProfileBtns = document.querySelectorAll('.view-profile-trigger, #viewProfileBtn');
  const modal = document.getElementById('viewProfileModal');
  const closeModal = document.getElementById('closeProfileModal');

  viewProfileBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (modal) modal.classList.add('active');
    });
  });

  if (closeModal && modal) {
    closeModal.addEventListener('click', () => modal.classList.remove('active'));
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

// Utility: Prevent XSS in mock client inputs
function escapeHTML(str) {
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

/**
 * ------------------------------------------------------------------------------
 * Member 2 Integration: loadDashboardResources()
 * Connects newly uploaded resources directly into the middle dashboard feed
 * ------------------------------------------------------------------------------
 */
async function loadDashboardResources() {
  const feedContainer = document.getElementById('studentFeedContainer');
  if (!feedContainer) return;

  try {
    let resourcesList = [];

    // 1. Fetch live from Supabase resources table if available
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('resources')
          .select(`
            id,
            title,
            description,
            file_url,
            file_name,
            file_size,
            created_at,
            categories ( category_name ),
            profiles:user_id ( full_name, faculty, degree, profile_image )
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && data && data.length > 0) {
          resourcesList = data.map(item => ({
            id: item.id,
            title: item.title,
            description: item.description,
            file_url: item.file_url,
            file_name: item.file_name,
            file_size: item.file_size,
            category_name: item.categories?.category_name || 'General',
            uploader_name: item.profiles?.full_name || 'Student Uploader',
            uploader_faculty: item.profiles?.faculty || 'Faculty of Science',
            uploader_image: item.profiles?.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.title)}`,
            created_at: item.created_at
          }));
        }
      } catch (e) {}
    }

    // 2. Fetch local uploaded resources
    const localResources = JSON.parse(localStorage.getItem('uniskill_local_resources') || '[]');
    
    // Combine
    const allRecent = [...localResources, ...resourcesList];
    const uniqueMap = new Map();
    allRecent.forEach(r => uniqueMap.set(r.id, r));

    // Render newly uploaded cards at the top of the feed
    uniqueMap.forEach(res => {
      if (document.getElementById(`feed-res-${res.id}`)) return;

      const fileExt = (res.file_type || res.file_name?.split('.').pop() || 'PDF').toUpperCase();
      const card = document.createElement('article');
      card.className = 'feed-card';
      card.id = `feed-res-${res.id}`;
      card.setAttribute('data-category', 'resource');
      card.innerHTML = `
        <div class="feed-card-header">
          <img src="${res.uploader_image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=student'}" alt="${res.uploader_name}" class="feed-card-avatar">
          <div class="feed-card-author-info">
            <h3 class="feed-card-author-name">${escapeHTML(res.uploader_name)}</h3>
            <p class="feed-card-author-sub">${escapeHTML(res.faculty || res.uploader_faculty || 'Undergraduate')} • Just now</p>
            <span class="feed-card-time">Recent Upload • Public</span>
          </div>
          <span class="feed-card-category">${escapeHTML(res.category_name || 'Resource')}</span>
        </div>

        <div class="feed-card-content">
          <p><strong>${escapeHTML(res.title)}</strong></p>
          <p>${escapeHTML(res.description || 'Shared learning resource for students.')}</p>

          <a href="${res.file_url}" target="_blank" download="${res.file_name}" class="resource-box">
            <div class="resource-icon">${fileExt}</div>
            <div class="resource-details">
              <div class="resource-title">${escapeHTML(res.file_name)}</div>
              <div class="resource-meta">${escapeHTML(res.category_name)} • ${escapeHTML(res.file_size)} • Ready to download</div>
            </div>
            <span class="btn btn-outline btn-sm">Download</span>
          </a>
        </div>

        <div class="feed-card-stats">
          <span>0 Likes • 0 Comments</span>
          <a href="resources/resource-details.html?id=${res.id}" style="font-size: 11.5px; font-weight: 600;">View Details &rarr;</a>
        </div>

        <div class="feed-card-actions">
          <button class="feed-action-btn like-btn">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017a2 2 0 01-1.789-1.106l-3.5-7A2 2 0 017.746 10H10V4a2 2 0 012-2h1a1 1 0 011 1v7z"/></svg>
            Like (<span class="like-count">0</span>)
          </button>
          <button class="feed-action-btn">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            Comment
          </button>
          <a href="resources/resource-details.html?id=${res.id}" class="feed-action-btn" style="text-decoration: none;">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            Details
          </a>
        </div>
      `;

      feedContainer.prepend(card);
      const likeBtn = card.querySelector('.like-btn');
      if (likeBtn) attachLikeHandler(likeBtn);
    });

  } catch (err) {
    console.warn('Dashboard resources load warning:', err);
  }
}

/**
 * ------------------------------------------------------------------------------
 * Member 3 Integration: loadDashboardArticles()
 * Automatically connects published knowledge articles to the middle dashboard feed
 * ------------------------------------------------------------------------------
 */
async function loadDashboardArticles() {
  const feedContainer = document.getElementById('studentFeedContainer');
  if (!feedContainer) return;

  try {
    let articlesList = [];

    // 1. Fetch live articles from Supabase articles table
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('articles')
          .select(`
            id,
            title,
            content,
            category,
            image_url,
            created_at,
            profiles:user_id ( full_name, faculty, degree, profile_image )
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && data && data.length > 0) {
          articlesList = data.map(item => ({
            id: item.id,
            title: item.title,
            content: item.content,
            category: item.category || 'General',
            image_url: item.image_url,
            author_name: item.profiles?.full_name || 'Student Author',
            author_faculty: item.profiles?.faculty || 'Faculty of Science',
            author_degree: item.profiles?.degree || 'Undergraduate',
            author_image: item.profiles?.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.title)}`,
            created_at: item.created_at
          }));
        }
      } catch (e) {
        console.warn('Dashboard articles Supabase fetch error:', e);
      }
    }

    // 2. Fetch locally published articles from localStorage
    const localArticles = JSON.parse(localStorage.getItem('uniskill_local_articles') || '[]');

    // 3. Combine both and deduplicate by id
    const allRecent = [...localArticles, ...articlesList];
    const uniqueMap = new Map();
    allRecent.forEach(art => uniqueMap.set(art.id, art));

    // 4. Render newly published articles into the dashboard feed
    uniqueMap.forEach(art => {
      if (document.getElementById(`feed-art-${art.id}`)) return;

      const authorName = art.uploader_name || art.author_name || 'Student';
      const authorFaculty = art.faculty || art.author_faculty || 'University';
      const authorDegree = art.degree || art.author_degree || 'Undergraduate';
      const authorImage = art.uploader_image || art.author_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorName)}`;
      const snippet = (art.content || '').substring(0, 180) + '...';

      let bannerImgHtml = '';
      if (art.image_url) {
        bannerImgHtml = `<img src="${art.image_url}" alt="Article image" style="width: 100%; max-height: 180px; object-fit: cover; border-radius: 6px; margin: 8px 0; border: 1px solid var(--border-color);" onerror="this.style.display='none'">`;
      }

      const card = document.createElement('article');
      card.className = 'feed-card';
      card.id = `feed-art-${art.id}`;
      card.setAttribute('data-category', 'article');
      card.innerHTML = `
        <div class="feed-card-header">
          <img src="${authorImage}" alt="${escapeHTML(authorName)}" class="feed-card-avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=student'">
          <div class="feed-card-author-info">
            <h3 class="feed-card-author-name">${escapeHTML(authorName)}</h3>
            <p class="feed-card-author-sub">${escapeHTML(authorDegree)} • ${escapeHTML(authorFaculty)}</p>
            <span class="feed-card-time">Recent Article • Public</span>
          </div>
          <span class="feed-card-category">${escapeHTML(art.category || 'Article')}</span>
        </div>

        <div class="feed-card-content">
          <p><strong>${escapeHTML(art.title)}</strong></p>
          ${bannerImgHtml}
          <p style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">${escapeHTML(snippet)}</p>
          <a href="articles/article-details.html?id=${art.id}" style="font-size: 12.5px; font-weight: 600; color: var(--primary-color);">Read Full Article &rarr;</a>
        </div>

        <div class="feed-card-stats">
          <span>${art.likes_count || 0} Likes • ${art.comments_count || 0} Comments</span>
          <a href="articles/article-details.html?id=${art.id}" style="font-size: 11.5px; font-weight: 600; color: var(--primary-color);">View Discussion &rarr;</a>
        </div>

        <div class="feed-card-actions">
          <button class="feed-action-btn like-btn">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017a2 2 0 01-1.789-1.106l-3.5-7A2 2 0 017.746 10H10V4a2 2 0 012-2h1a1 1 0 011 1v7z"/></svg>
            Like (<span class="like-count">${art.likes_count || 0}</span>)
          </button>
          <a href="articles/article-details.html?id=${art.id}" class="feed-action-btn" style="text-decoration: none;">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            Comment
          </a>
          <a href="articles/article-details.html?id=${art.id}" class="feed-action-btn" style="text-decoration: none;">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            Read
          </a>
        </div>
      `;

      feedContainer.prepend(card);
      const likeBtn = card.querySelector('.like-btn');
      if (likeBtn) attachLikeHandler(likeBtn);
    });

  } catch (err) {
    console.warn('Dashboard articles load warning:', err);
  }
}
