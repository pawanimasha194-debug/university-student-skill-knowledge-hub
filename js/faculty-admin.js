/* Faculty approval UI. Real permissions enforced by Supabase SQL migration. */
const facultyDB = () => window.supabaseClient;
let currentAdmin = null;
const escapeFacultyHTML = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function getAdmin() {
  const db = facultyDB(); if (!db) throw Error('Supabase is not configured');
  const {data:{user},error} = await db.auth.getUser();
  if (error || !user) throw Error('Sign in as an administrator');
  const result = await db.from('faculty_admins').select('user_id,role,faculty').eq('user_id',user.id).maybeSingle();
  if (result.error || !result.data) throw Error('This account has no administrator permission');
  return result.data;
}
async function adminLogin(event) {
  event.preventDefault(); const notice=document.getElementById('adminLoginAlert');
  notice.style.display='none';
  const db=facultyDB();
  try {
    const {error}=await db.auth.signInWithPassword({email:document.getElementById('adminEmail').value.trim(),password:document.getElementById('adminPassword').value});
    if(error) throw error;
    await getAdmin(); location.href='admin-dashboard.html';
  } catch(e) { await db?.auth.signOut(); notice.textContent=e.message;notice.style.display='block'; }
}
async function checkAdminAuth() {
  try { currentAdmin=await getAdmin(); document.body.style.visibility='visible'; return currentAdmin; }
  catch(e) { console.error('Admin authorization failed:', e); sessionStorage.setItem('uniskill_admin_error', e.message); location.replace('admin-login.html'); return null; }
}
async function adminLogout() { await facultyDB()?.auth.signOut();location.href='admin-login.html'; }
async function loadFacultyRequests() {
  const body=document.getElementById('approvalRows'); if(!body)return;
  const note=document.getElementById('approvalNotice');
  const {data,error}=await facultyDB().from('profiles').select('id,full_name,faculty,degree,approval_status,created_at').order('created_at',{ascending:false});
  if(error){note.textContent=error.message;return;}
  const rows=data.filter(r=>r.approval_status==='pending');
  note.textContent=`${rows.length} pending request(s)`;escapeFacultyHTML
  body.innerHTML=rows.map(r=>`<tr style="border-top:1px solid #ddd"><td>${escapeFacultyHTML(r.full_name)}</td><td>${escapeFacultyHTML(r.faculty)}</td><td>${(r.degree)}</td><td>Pending</td><td><button class="btn btn-primary btn-sm" data-id="${r.id}" data-action="approved">Approve</button> <button class="btn btn-outline btn-sm" data-id="${r.id}" data-action="rejected">Reject</button></td></tr>`).join('') || '<tr><td colspan="5">No pending requests</td></tr>';
}
async function reviewStudent(id,status) {
  let reason=null;
  if(status==='rejected') {reason=prompt('Reason for rejection:'); if(!reason?.trim())return;}
  else if(!confirm('Approve this student profile?')) return;
  const {error}=await facultyDB().rpc('review_profile_request',{p_student_id:id,p_decision:status,p_reason:reason});
  if(error)alert(error.message); else await loadFacultyRequests();
}
document.addEventListener('DOMContentLoaded',async()=>{
 if(location.pathname.endsWith('admin-login.html'))return;
 if(!location.pathname.match(/(admin-dashboard|manage-users|manage-resources|manage-articles|reports)\.html$/))return;
 if(!await checkAdminAuth())return;
 document.getElementById('approvalRows')?.addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(b)reviewStudent(b.dataset.id,b.dataset.action);});
 await loadFacultyRequests();
});
