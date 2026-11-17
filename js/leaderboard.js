/**
 * ==============================================================================
 * UniSkill Hub - Campus Academic Leaderboard
 * File: js/leaderboard.js
 * Modules: Features 2, 3, 18
 * ==============================================================================
 */

let currentLeaderboardCategory = 'overall';

document.addEventListener('DOMContentLoaded', () => {
  renderLeaderboardView();
});

function setLeaderboardCategory(cat) {
  currentLeaderboardCategory = cat;

  const btnMap = {
    'overall': 'leadTabOverall',
    'tutors': 'leadTabTutors',
    'resources': 'leadTabResources',
    'articles': 'leadTabArticles',
    'helpers': 'leadTabHelpers'
  };

  Object.keys(btnMap).forEach(key => {
    const el = document.getElementById(btnMap[key]);
    if (el) {
      el.className = (key === cat) ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline';
    }
  });

  renderLeaderboardView();
}

function renderLeaderboardView() {
  const students = window.AcademicCore.getCampusLeaderboard(currentLeaderboardCategory);
  renderPodium(students.slice(0, 3));
  renderLeaderboardTable(students);
}

function renderPodium(top3) {
  const container = document.getElementById('podiumArea');
  if (!container || top3.length < 3) return;

  const rankClasses = ['rank-1', 'rank-2', 'rank-3'];
  const rankLabels = ['🥇 Rank 1 - Champion', '🥈 Rank 2', '🥉 Rank 3'];

  container.innerHTML = top3.map((st, idx) => `
    <div class="card" style="padding: 16px; text-align: center; border-top: 4px solid ${idx === 0 ? '#facc15' : idx === 1 ? '#cbd5e1' : '#fdba74'};">
      <div style="font-size: 12px; font-weight: 700; color: ${idx === 0 ? '#854d0e' : idx === 1 ? '#334155' : '#9a3412'}; margin-bottom: 8px;">
        ${rankLabels[idx]}
      </div>
      <img src="${escapeHtml(st.avatar)}" alt="${escapeHtml(st.name)}" style="width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 8px; border: 2px solid #e2e8f0; object-fit: cover;">
      
      <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 2px;">
        <a href="student-profile.html?id=${st.id}" style="color: var(--text-main);">${escapeHtml(st.name)}</a>
      </h3>
      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
        ${escapeHtml(st.faculty)} • ${escapeHtml(st.primary_skill)}
      </p>

      <div style="background: #f8fafc; border-radius: 6px; padding: 8px; margin-bottom: 10px;">
        <div style="font-size: 20px; font-weight: 800; color: var(--primary-color);">
          ${st.score} <span style="font-size: 12px; font-weight: normal; color: var(--text-muted);">/ 100</span>
        </div>
        <div style="font-size: 11px; color: var(--text-muted);">Academic Reputation Score</div>
      </div>

      <div style="font-size: 12px; color: #4b5563; margin-bottom: 10px;">
        ⭐ <strong>${st.rating}</strong> Rating • <strong>${st.students_helped}</strong> Students Helped
      </div>

      <div>
        <span class="academic-badge top-tutor">🏆 ${escapeHtml(st.badge)}</span>
      </div>
    </div>
  `).join('');
}

function renderLeaderboardTable(students) {
  const tbody = document.getElementById('leaderboardBody');
  if (!tbody) return;

  tbody.innerHTML = students.map(st => {
    let rankBadgeClass = 'rank-other';
    if (st.rank === 1) rankBadgeClass = 'rank-1';
    else if (st.rank === 2) rankBadgeClass = 'rank-2';
    else if (st.rank === 3) rankBadgeClass = 'rank-3';

    return `
      <tr>
        <td>
          <span class="rank-badge ${rankBadgeClass}">#${st.rank}</span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${escapeHtml(st.avatar)}" alt="${escapeHtml(st.name)}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
            <div>
              <a href="student-profile.html?id=${st.id}" style="font-weight: 700; font-size: 13.5px; color: var(--text-main); display: block;">
                ${escapeHtml(st.name)}
              </a>
              <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(st.primary_skill)}</span>
            </div>
          </div>
        </td>
        <td>
          <div style="font-size: 13px; font-weight: 500;">${escapeHtml(st.faculty)}</div>
          <div style="font-size: 11.5px; color: var(--text-muted);">${escapeHtml(st.degree)}</div>
        </td>
        <td>
          <span style="font-weight: 800; color: var(--primary-color); font-size: 14px;">${st.score}</span>
          <span style="font-size: 11px; color: var(--text-muted);">/100</span>
        </td>
        <td>
          <span style="color: #f59e0b; font-weight: 700;">⭐ ${st.rating}</span>
        </td>
        <td style="font-size: 12.5px; color: #4b5563;">
          <strong>${st.students_helped}</strong> helped • <strong>${st.sessions_completed}</strong> sessions • <strong>${st.resources_uploaded}</strong> notes
        </td>
        <td>
          <span class="academic-badge top-tutor">🎓 ${escapeHtml(st.badge)}</span>
        </td>
        <td style="text-align: right;">
          <a href="student-profile.html?id=${st.id}" class="btn btn-outline btn-sm">View Profile</a>
        </td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
