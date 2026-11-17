/**
 * ==============================================================================
 * UniSkill Hub - Assignment Collaboration & Team Finder
 * File: js/assignments.js
 * Modules: Feature 10
 * ==============================================================================
 */

let allAssignmentTeams = [];
let currentCourseFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initAssignmentsPage();

  const searchInput = document.getElementById('assignmentSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterAssignmentTeams(e.target.value);
    });
  }

  // Set default deadline in modal to 7 days ahead
  const deadlineInput = document.getElementById('teamDeadline');
  if (deadlineInput) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    deadlineInput.value = nextWeek.toISOString().split('T')[0];
    deadlineInput.min = new Date().toISOString().split('T')[0];
  }
});

function initAssignmentsPage() {
  allAssignmentTeams = window.AcademicCore.getStoredAssignmentTeams();
  renderAssignmentTeams(allAssignmentTeams);
}

function filterByCourse(code) {
  currentCourseFilter = code;

  document.querySelectorAll('.course-filter-btn').forEach(btn => {
    if (code === 'all' && btn.textContent.includes('All')) {
      btn.className = 'btn btn-sm btn-primary course-filter-btn';
    } else if (btn.textContent.includes(code) && code !== 'all') {
      btn.className = 'btn btn-sm btn-primary course-filter-btn';
    } else {
      btn.className = 'btn btn-sm btn-outline course-filter-btn';
    }
  });

  filterAssignmentTeams();
}

function filterAssignmentTeams(searchQuery = '') {
  const query = (searchQuery || document.getElementById('assignmentSearchInput')?.value || '').toLowerCase().trim();

  const filtered = allAssignmentTeams.filter(team => {
    if (currentCourseFilter !== 'all' && team.course_code !== currentCourseFilter) {
      return false;
    }
    if (query) {
      const matchCourse = team.course_code.toLowerCase().includes(query);
      const matchTitle = team.title.toLowerCase().includes(query);
      const matchRoles = team.roles_needed.some(r => r.toLowerCase().includes(query));
      const matchDesc = team.description.toLowerCase().includes(query);
      if (!matchCourse && !matchTitle && !matchRoles && !matchDesc) return false;
    }
    return true;
  });

  renderAssignmentTeams(filtered);
}

function renderAssignmentTeams(teams) {
  const container = document.getElementById('assignmentTeamsContainer');
  if (!container) return;

  if (teams.length === 0) {
    container.innerHTML = `
      <div class="card" style="padding: 30px; text-align: center; color: var(--text-muted);">
        <p style="font-size: 15px; margin-bottom: 8px;">No assignment requests found for this filter.</p>
        <button class="btn btn-primary btn-sm" onclick="openCreateTeamModal()">Post the First Request!</button>
      </div>
    `;
    return;
  }

  container.innerHTML = teams.map(team => {
    const rolesHTML = (team.roles_needed || []).map(r => 
      `<span class="role-pill">🔍 ${escapeHtml(r)}</span>`
    ).join(' ');

    const membersHTML = (team.members_list || []).map(m => 
      `<span style="display: inline-block; font-size: 11px; background: #f3f4f6; color: #374151; padding: 2px 6px; border-radius: 4px; margin-right: 4px;">👤 ${escapeHtml(m)}</span>`
    ).join(' ');

    const isFull = team.status === 'Full';

    return `
      <div class="assignment-card">
        <div class="assignment-card-header">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="course-badge">${escapeHtml(team.course_code)}</span>
              <span style="font-size: 12.5px; color: var(--text-muted); font-weight: 500;">
                ${escapeHtml(team.course_name)} • ${escapeHtml(team.faculty)}
              </span>
            </div>
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">
              ${escapeHtml(team.title)}
            </h3>
          </div>

          <div>
            <span style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 12px; background: ${isFull ? '#fee2e2' : '#def7ec'}; color: ${isFull ? '#991b1b' : '#03543f'};">
              ${isFull ? '● Team Full' : '● ' + team.members_needed + ' Open Spots'}
            </span>
          </div>
        </div>

        <p style="font-size: 13px; color: #4b5563; line-height: 1.5; margin: 8px 0;">
          ${escapeHtml(team.description)}
        </p>

        <div style="margin-bottom: 10px;">
          <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase;">
            LOOKING FOR SKILLS:
          </div>
          <div class="assignment-roles-wrap">
            ${rolesHTML}
          </div>
        </div>

        <div style="margin-bottom: 12px; font-size: 12px;">
          <strong style="color: var(--text-muted);">Current Team (${team.members_joined} members):</strong>
          <div style="margin-top: 4px;">${membersHTML}</div>
        </div>

        <div class="assignment-meta-footer">
          <div>
            ⏳ Submission Deadline: <strong>${team.deadline}</strong>
          </div>

          <div>
            ${isFull 
              ? `<button class="btn btn-secondary btn-sm" disabled>Team Closed</button>`
              : `<button class="btn btn-primary btn-sm" onclick="openJoinTeamModal('${team.id}')">🤝 Join Team</button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openJoinTeamModal(teamId) {
  const team = allAssignmentTeams.find(t => t.id === teamId);
  if (!team) return;

  document.getElementById('joinTeamId').value = team.id;
  document.getElementById('joinModalTeamTitle').innerHTML = `
    Applying for <strong>${escapeHtml(team.title)}</strong> (${escapeHtml(team.course_code)}).
  `;

  const select = document.getElementById('joinRoleSelect');
  select.innerHTML = (team.roles_needed || ['General Contributor']).map(r => 
    `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`
  ).join('');

  openModal('joinTeamModal');
}

function handleJoinTeamSubmit(e) {
  e.preventDefault();
  const teamId = document.getElementById('joinTeamId').value;
  const role = document.getElementById('joinRoleSelect').value;
  const note = document.getElementById('joinNoteInput').value;

  const result = window.AcademicCore.applyToJoinTeam(teamId, role, note);

  if (result.success) {
    closeModal('joinTeamModal');
    showAlert(result.message, 'success');
    allAssignmentTeams = window.AcademicCore.getStoredAssignmentTeams();
    renderAssignmentTeams(allAssignmentTeams);
  } else {
    alert(result.message);
  }
}

function openCreateTeamModal() {
  openModal('createTeamModal');
}

function handleCreateTeamSubmit(e) {
  e.preventDefault();

  const courseCode = document.getElementById('teamCourseCode').value;
  const courseName = document.getElementById('teamCourseName').value;
  const title = document.getElementById('teamProjectTitle').value;
  const rolesNeeded = document.getElementById('teamRolesNeeded').value;
  const membersNeeded = document.getElementById('teamMembersNeeded').value;
  const deadline = document.getElementById('teamDeadline').value;
  const description = document.getElementById('teamDescription').value;

  const result = window.AcademicCore.postAssignmentTeamRequest({
    courseCode,
    courseName,
    title,
    description,
    rolesNeeded,
    membersNeeded,
    deadline
  });

  if (result.success) {
    closeModal('createTeamModal');
    showAlert(result.message, 'success');
    document.getElementById('createTeamForm').reset();
    allAssignmentTeams = window.AcademicCore.getStoredAssignmentTeams();
    renderAssignmentTeams(allAssignmentTeams);
  } else {
    alert(result.message);
  }
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function showAlert(msg, type = 'success') {
  const alertBox = document.getElementById('assignmentAlert');
  if (alertBox) {
    alertBox.textContent = msg;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 5000);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
