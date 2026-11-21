/* UniSkill Hub — Team Collaboration Supabase backend */
let allAssignmentTeams = [];
let currentCourseFilter = 'all';
let currentUser = null;
let currentRequests = [];
const db = () => window.supabaseClient || window.supabaseDB || window.sb;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = id => document.getElementById(id);
const value = id => ($(id)?.value || '').trim();

window.addEventListener('DOMContentLoaded', async () => {
  $('assignmentSearchInput')?.addEventListener('input', () => filterAssignmentTeams());
  const deadline = $('teamDeadline');
  if (deadline) {
    const date = new Date(); date.setDate(date.getDate()+7);
    deadline.value = date.toISOString().slice(0,10);
    deadline.min = new Date().toISOString().slice(0,10);
  }
  await initAssignmentsPage();
});

async function initAssignmentsPage() {
  const client = db();
  if (!client) return showAlert('Supabase configuration is not loaded.', 'danger');
  // Restore the existing Supabase session before checking authorization.
  const {data:sessionData,error:sessionError} = await client.auth.getSession();
  if (sessionError) return showAlert('Unable to restore login session: '+sessionError.message, 'danger');
  if (!sessionData?.session) {
    showAlert('Please log in to browse and create teams. Open this page through Live Server (http://127.0.0.1:5500), not a file:/// URL.', 'danger');
    return;
  }
  const {data:userData,error} = await client.auth.getUser();
  if (error || !userData?.user) return showAlert('Login session expired. Please log in again.', 'danger');
  currentUser = userData.user;
  await loadTeams();
}

async function loadTeams() {
  const client = db();
  const [teamsResult,summaryResult,requestsResult] = await Promise.all([
    client.from('assignment_teams').select('*').order('created_at',{ascending:false}),
    client.rpc('assignment_team_summary'),
    client.from('assignment_team_requests').select('*').order('created_at',{ascending:false})
  ]);
  if (teamsResult.error) return showAlert('Unable to load teams: '+teamsResult.error.message,'danger');
  if (summaryResult.error) return showAlert('Unable to load team members: '+summaryResult.error.message,'danger');
  if (requestsResult.error) return showAlert('Unable to load requests: '+requestsResult.error.message,'danger');
  currentRequests = requestsResult.data || [];
  const summaries = new Map((summaryResult.data||[]).map(x=>[x.team_id,x]));
  allAssignmentTeams = (teamsResult.data||[]).map(t=>{
    const summary = summaries.get(t.id) || {};
    const count = Number(summary.approved_count||0);
    return {...t, members_joined:count+1, members_list:['Team owner',...(summary.member_names||[])],open_spots:Math.max(0,t.members_needed-count),status:count>=t.members_needed?'Full':'Open'};
  });
  filterAssignmentTeams();
}

function filterByCourse(code) {
  currentCourseFilter = code;
  document.querySelectorAll('.course-filter-btn').forEach(b=>{
    const active = code==='all' ? b.textContent.includes('All') : b.textContent.includes(code);
    b.classList.toggle('btn-primary',active);
    b.classList.toggle('btn-outline',!active);
  });
  filterAssignmentTeams();
}
function filterAssignmentTeams() {
  const query = value('assignmentSearchInput').toLowerCase();
  renderAssignmentTeams(allAssignmentTeams.filter(t=>
    (currentCourseFilter==='all'||t.course_code===currentCourseFilter) &&
    [t.title,t.course_code,t.course_name,t.description,...(t.roles_needed||[])].join(' ').toLowerCase().includes(query)
  ));
}
function renderAssignmentTeams(teams) {
  const container = $('assignmentTeamsContainer'); if (!container) return;
  if (!teams.length) {
    container.innerHTML='<div class="card" style="padding:25px;text-align:center">No teams found. <button class="btn btn-primary btn-sm" onclick="openCreateTeamModal()">Post a Team Request</button></div>';
    return;
  }
  container.innerHTML=teams.map(t=>{
    const mine=t.owner_id===currentUser?.id;
    const application=currentRequests.find(r=>r.team_id===t.id&&r.applicant_id===currentUser?.id);
    const pending=currentRequests.filter(r=>r.team_id===t.id&&r.status==='pending');
    const buttons=mine?`<button class="btn btn-outline btn-sm" onclick="editTeam('${t.id}')">Edit</button> <button class="btn btn-outline btn-sm" onclick="deleteTeam('${t.id}')">Delete</button>`:
      application?`<span class="course-badge">Your request: ${esc(application.status)}</span>`:
      t.status==='Full'?'<button class="btn btn-secondary btn-sm" disabled>Team Full</button>':`<button class="btn btn-primary btn-sm" onclick="openJoinTeamModal('${t.id}')">🤝 Join Team</button>`;
    return `<div class="assignment-card"><div class="assignment-card-header"><div><span class="course-badge">${esc(t.course_code)}</span> <small>${esc(t.course_name)} · ${esc(t.faculty||'University')}</small><h3>${esc(t.title)}</h3></div><span class="course-badge">${t.open_spots} open spots</span></div>
    <p>${esc(t.description)}</p><div class="assignment-roles-wrap">${(t.roles_needed||[]).map(r=>`<span class="role-pill">🔍 ${esc(r)}</span>`).join(' ')}</div>
    <p><strong>Team (${t.members_joined}):</strong> ${(t.members_list||[]).map(n=>`<span class="course-badge">${esc(n)}</span>`).join(' ')}</p>
    <div class="assignment-meta-footer"><span>⏳ Deadline: ${esc(t.deadline)}</span><div>${buttons}</div></div>
    ${mine&&pending.length?`<div style="padding-top:12px"><strong>Pending requests</strong>${pending.map(r=>`<div style="margin:8px 0">${esc(r.requested_role)}: ${esc(r.note)} <button class="btn btn-sm btn-primary" onclick="reviewRequest('${r.id}',true)">Approve</button> <button class="btn btn-sm btn-outline" onclick="reviewRequest('${r.id}',false)">Reject</button></div>`).join('')}</div>`:''}</div>`;
  }).join('');
}
function openJoinTeamModal(id) {
  const t=allAssignmentTeams.find(x=>x.id===id); if(!t)return;
  $('joinTeamId').value=id;
  $('joinModalTeamTitle').textContent=`Applying for ${t.title} (${t.course_code})`;
  $('joinRoleSelect').innerHTML=(t.roles_needed.length?t.roles_needed:['General Contributor']).map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('');
  openModal('joinTeamModal');
}
async function handleJoinTeamSubmit(e) {
  e.preventDefault();
  if (!currentUser) return showAlert('Log in first','danger');
  const {error}=await db().from('assignment_team_requests').insert({team_id:value('joinTeamId'),applicant_id:currentUser.id,requested_role:value('joinRoleSelect'),note:value('joinNoteInput')});
  if(error)return showAlert('Join request failed: '+error.message,'danger');
  closeModal('joinTeamModal');$('joinTeamForm').reset();showAlert('Join request submitted.');await loadTeams();
}
function openCreateTeamModal(){openModal('createTeamModal');}
async function handleCreateTeamSubmit(e) {
  e.preventDefault();
  if (!currentUser) return showAlert('Log in first','danger');
  const payload={owner_id:currentUser.id,course_code:value('teamCourseCode'),course_name:value('teamCourseName'),title:value('teamProjectTitle'),roles_needed:value('teamRolesNeeded').split(',').map(s=>s.trim()).filter(Boolean),members_needed:Number(value('teamMembersNeeded')),deadline:value('teamDeadline'),description:value('teamDescription')};
  if(!payload.roles_needed.length)return showAlert('Enter at least one required skill or role.','danger');
  const {error}=await db().from('assignment_teams').insert(payload);
  if(error)return showAlert('Team creation failed: '+error.message,'danger');
  closeModal('createTeamModal');$('createTeamForm').reset();showAlert('Team created successfully.');await loadTeams();
}
async function reviewRequest(id,approve){
  const {error}=await db().rpc('review_assignment_team_request',{p_request_id:id,p_approve:approve});
  if(error)return showAlert('Review failed: '+error.message,'danger');
  showAlert(approve?'Request approved.':'Request rejected.');await loadTeams();
}
async function editTeam(id){
  const t=allAssignmentTeams.find(x=>x.id===id&&x.owner_id===currentUser?.id);if(!t)return;
  const title=prompt('Team title:',t.title);if(title===null)return;
  const description=prompt('Description:',t.description);if(description===null)return;
  if(!title.trim()||!description.trim())return showAlert('Title and description are required.','danger');
  const {error}=await db().from('assignment_teams').update({title:title.trim(),description:description.trim()}).eq('id',id).eq('owner_id',currentUser.id);
  if(error)return showAlert('Update failed: '+error.message,'danger');showAlert('Team updated.');await loadTeams();
}
async function deleteTeam(id){
  if(!confirm('Delete this team and its requests permanently?'))return;
  const {error}=await db().from('assignment_teams').delete().eq('id',id).eq('owner_id',currentUser.id);
  if(error)return showAlert('Delete failed: '+error.message,'danger');showAlert('Team deleted.');await loadTeams();
}
function openModal(id){$(id)?.classList.add('active');}
function closeModal(id){$(id)?.classList.remove('active');}
function showAlert(msg,type='success'){
  const el=$('assignmentAlert');if(!el){alert(msg);return;}
  el.textContent=msg;el.className='alert alert-'+(type==='danger'?'danger':'success');el.style.display='block';
}
