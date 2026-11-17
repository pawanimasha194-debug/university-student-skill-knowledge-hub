/**
 * ==============================================================================
 * UniSkill Hub - Faculty & Course Communities
 * File: js/academic-communities.js
 * Modules: Features 11 & 12
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  renderFaculties();
  renderCourses();
});

function switchCommunityTab(type) {
  const isFac = type === 'faculties';
  document.getElementById('sectionFaculties').style.display = isFac ? 'block' : 'none';
  document.getElementById('sectionCourses').style.display = isFac ? 'none' : 'block';

  document.getElementById('commTabFaculties').className = isFac ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline';
  document.getElementById('commTabCourses').className = isFac ? 'btn btn-sm btn-outline' : 'btn btn-sm btn-primary';
}

function renderFaculties() {
  const container = document.getElementById('facultiesGrid');
  if (!container) return;

  const list = window.AcademicCore.facultyCommunitiesList || [];

  container.innerHTML = list.map(fac => `
    <div class="community-space-card card">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <div class="community-icon-badge">${fac.icon}</div>
        <div>
          <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">
            ${escapeHtml(fac.name)}
          </h3>
          <span style="font-size: 12px; color: var(--primary-color); font-weight: 600;">
            👥 ${fac.students_count} Active Students
          </span>
        </div>
      </div>

      <p style="font-size: 13px; color: #4b5563; line-height: 1.4; margin-bottom: 12px;">
        ${escapeHtml(fac.description)}
      </p>

      <div style="margin-bottom: 12px;">
        <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Key Course Modules:</span>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
          ${fac.courses.map(c => `<span class="course-badge">${escapeHtml(c)}</span>`).join(' ')}
        </div>
      </div>

      <div style="display: flex; gap: 8px; border-top: 1px solid #f0f0f0; padding-top: 12px;">
        <a href="community.html" class="btn btn-primary btn-sm" style="flex: 1; text-align: center;">💬 Discussions</a>
        <a href="resources/resources.html" class="btn btn-outline btn-sm" style="flex: 1; text-align: center;">📑 Lecture Notes</a>
        <a href="tutoring.html" class="btn btn-outline btn-sm" style="flex: 1; text-align: center;">🎓 Tutors</a>
      </div>
    </div>
  `).join('');
}

function renderCourses() {
  const container = document.getElementById('coursesGrid');
  if (!container) return;

  const list = window.AcademicCore.courseCommunitiesList || [];

  container.innerHTML = list.map(c => `
    <div class="community-space-card card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <div>
          <span class="course-badge" style="font-size: 13px; padding: 4px 10px;">${escapeHtml(c.code)}</span>
          <h3 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-top: 6px;">
            ${escapeHtml(c.name)}
          </h3>
          <div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(c.faculty)}</div>
        </div>
        <span style="font-size: 11px; font-weight: 600; color: #057642; background: #def7ec; padding: 3px 8px; border-radius: 12px;">
          ● ${c.enrolled_count} Enrolled
        </span>
      </div>

      <div style="background: #f8fafc; border-radius: 6px; padding: 10px; margin: 12px 0; font-size: 12.5px; color: #475569;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>📚 Shared Notes: <strong>${c.notes_count}</strong></span>
          <span>💬 Discussions: <strong>${c.discussions_count}</strong></span>
        </div>
        <div>
          🎓 Recommended Tutor: <strong>${escapeHtml(c.lead_tutor)}</strong>
        </div>
      </div>

      <div style="display: flex; gap: 8px;">
        <a href="resources/resources.html" class="btn btn-primary btn-sm" style="flex: 1; text-align: center;">Access Notes</a>
        <a href="assignments.html" class="btn btn-outline btn-sm" style="flex: 1; text-align: center;">Find Team</a>
        <a href="tutoring.html" class="btn btn-outline btn-sm" style="flex: 1; text-align: center;">Book Tutor</a>
      </div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
