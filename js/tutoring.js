/**
 * ==============================================================================
 * UniSkill Hub - Peer Tutoring Marketplace
 * File: js/tutoring.js
 * Modules: Features 4, 5, 6, 7, 8, 9
 * ==============================================================================
 */

let allTutorsList = [];
let currentSelectedTutor = null;

document.addEventListener('DOMContentLoaded', () => {
  initTutoringPage();

  // Search input listener
  const searchInput = document.getElementById('tutoringGlobalSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterTutorsList(e.target.value);
    });
  }

  // Pre-set default booking date to tomorrow
  const dateInput = document.getElementById('bookingDateInput');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toLocaleDateString('en-CA');
    dateInput.min = new Date().toLocaleDateString('en-CA');
  }
});

const tutorState = { user: null, availability: [], bookings: [], materials: [], reviews: [], profiles: [] };
const tutorDB = () => window.supabaseClient;
const weekDays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function tutorError(error) { console.error('[Tutoring]', error); showAlert(error?.message || String(error), 'danger'); }
async function tutorUser() {
  const db = tutorDB();
  if (!db) throw new Error('Supabase connection unavailable. Refresh the page.');
  const { data, error } = await db.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Please sign in to use Peer Tutoring.');
  tutorState.user = data.user;
  return data.user;
}
async function initTutoringPage() {
  try {
    await tutorUser();
    await Promise.all([loadTutors(), renderMyBookings(), renderTutoringMaterials(), renderMyAvailability()]);
  } catch (error) { tutorError(error); }
}
async function loadTutors() {
  const db = tutorDB();
  const [{data: tutors,error}, {data: availability,error: avError}, {data: reviews,error: revError}] = await Promise.all([
    db.from('tutor_profiles').select('*').eq('is_active',true),
    db.from('tutor_availability').select('*').eq('is_active',true),
    db.from('tutor_reviews').select('tutor_id,rating')
  ]);
  if (error || avError || revError) throw error || avError || revError;
  const ids = (tutors || []).map(t => t.user_id);
  let profiles = [];
  if (ids.length) {
    const result = await db.from('profiles').select('id,full_name,faculty,degree,academic_year,profile_image').in('id',ids);
    if (result.error) throw result.error;
    profiles = result.data || [];
  }
  tutorState.profiles = profiles;
  tutorState.availability = availability || [];
  tutorState.reviews = reviews || [];
  allTutorsList = (tutors || []).map(t => {
    const p = profiles.find(p => p.id === t.user_id) || {};
    const ratings = tutorState.reviews.filter(r => r.tutor_id === t.user_id);
    return {
      ...t, id: t.user_id, student_id: t.user_id,
      full_name: p.full_name || 'University Tutor', faculty: p.faculty || 'University',
      degree: p.degree || '', academic_year: p.academic_year || '',
      profile_image: p.profile_image || 'https://placehold.co/80x80?text=Tutor',
      subjects: (t.subjects || '').split(',').map(x => x.trim()).filter(Boolean),
      badges: [], average_rating: ratings.length ? ratings.reduce((a,r) => a + r.rating,0)/ratings.length : 0,
      total_reviews: ratings.length, reputation_score: null,
      availability: tutorState.availability.filter(a => a.tutor_id === t.user_id)
    };
  });
  renderTutorsList(allTutorsList);
}


/**
 * Switch tabs between Browse, Bookings, and Tutor Management
 */
function switchTutoringTab(tabName) {
  const tabs = ['tabBrowse', 'tabBookings', 'tabManage'];
  const btns = ['tabBrowseBtn', 'tabBookingsBtn', 'tabManageBtn'];

  tabs.forEach(t => {
    const el = document.getElementById(t);
    if (el) el.style.display = (t === 'tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)) ? 'block' : 'none';
  });

  btns.forEach(b => {
    const btn = document.getElementById(b);
    if (btn) {
      if (b === 'tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Btn') {
        btn.className = 'btn btn-sm btn-primary';
      } else {
        btn.className = 'btn btn-sm btn-outline';
      }
    }
  });
}

/**
 * Renders the list of peer tutors in the marketplace (Feature 4)
 */
function renderTutorsList(tutors) {
  const container = document.getElementById('tutorsContainer');
  if (!container) return;

  if (tutors.length === 0) {
    container.innerHTML = `
      <div class="card" style="padding: 30px; text-align: center; color: var(--text-muted);">
        <p style="font-size: 15px; margin-bottom: 8px;">No tutors match your selected filter criteria.</p>
        <button class="btn btn-outline btn-sm" onclick="resetTutorFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = tutors.map(tutor => {
    // Generate subjects tags
    const subjectsHTML = (tutor.subjects || []).map(sub => 
      `<span class="subject-tag">${escapeHtml(sub)}</span>`
    ).join(' ');

    // Generate academic badges
    const badgesHTML = (tutor.badges || []).map(b => 
      `<span class="academic-badge top-tutor">🏆 ${escapeHtml(b)}</span>`
    ).join(' ');

    return `
      <div class="tutor-card">
        <!-- Col 1: Avatar -->
        <div class="tutor-avatar-wrap">
          <img src="${escapeHtml(tutor.profile_image)}" alt="${escapeHtml(tutor.full_name)}" class="tutor-avatar">
          <div style="font-size: 11px; font-weight: 700; color: #057642; margin-top: 6px;">● Tutor</div>
        </div>

        <!-- Col 2: Info -->
        <div class="tutor-info">
          <h3>${escapeHtml(tutor.full_name)}</h3>
          <div class="tutor-faculty-tag">
            <strong>${escapeHtml(tutor.faculty)}</strong> • <span>${escapeHtml(tutor.degree || 'BSc Degree')}</span> (${escapeHtml(tutor.academic_year || 'Undergraduate')})
          </div>

          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
            <div class="star-rating">
              <span>⭐</span>
              <span class="star-rating-count"><strong>${tutor.average_rating}</strong> (${tutor.total_reviews} student reviews)</span>
            </div>
            <span style="font-size: 12px; color: var(--text-muted);">•</span>
            <span style="font-size: 12px; color: var(--primary-color); font-weight: 600;">
              🎓 ${tutor.completed_sessions} Sessions Completed
            </span>
          </div>

          <div class="tutor-subjects-list">
            ${subjectsHTML}
          </div>

          <p class="tutor-bio-snippet">${escapeHtml(tutor.bio)}</p>

          <div class="academic-badges-wrap">
            ${badgesHTML}
          </div>
        </div>

        <!-- Col 3: Actions & Academic Reputation -->
        <div class="tutor-action-column">
          <div class="reputation-score-badge" title="Academic Reputation Score">
            ${tutor.reputation_score == null ? "N/A" : tutor.reputation_score + " / 100"}
          </div>
          <span style="font-size: 11px; color: var(--text-muted);">Reputation Score</span>
          
          <button class="btn btn-primary btn-sm" onclick="openBookSessionModal('${tutor.id}')" style="margin-top: 12px; width: 100%;">
            📅 Book Session
          </button>
          <a href="student-profile.html?id=${tutor.student_id}" class="btn btn-outline btn-sm" style="width: 100%; text-align: center;">
            View Profile
          </a>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Filter tutors by Faculty, Subject, Minimum Rating, and Search text
 */
function filterTutorsList(searchQuery = '') {
  const faculty = document.getElementById('filterFacultySelect')?.value || 'all';
  const subject = document.getElementById('filterSubjectSelect')?.value || 'all';
  const minRating = parseFloat(document.getElementById('filterRatingSelect')?.value || '0');
  const query = (searchQuery || document.getElementById('tutoringGlobalSearch')?.value || '').toLowerCase().trim();

  const filtered = allTutorsList.filter(tutor => {
    // Faculty filter
    if (faculty !== 'all' && tutor.faculty !== faculty) return false;

    // Subject filter
    if (subject !== 'all') {
      const hasSubject = tutor.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()));
      if (!hasSubject) return false;
    }

    // Rating filter
    if (minRating > 0 && tutor.average_rating < minRating) return false;

    // Search query
    if (query) {
      const matchName = tutor.full_name.toLowerCase().includes(query);
      const matchSubject = tutor.subjects.some(s => s.toLowerCase().includes(query));
      const matchFaculty = (tutor.faculty || '').toLowerCase().includes(query);
      if (!matchName && !matchSubject && !matchFaculty) return false;
    }

    return true;
  });

  renderTutorsList(filtered);
}

function resetTutorFilters() {
  document.getElementById('filterFacultySelect').value = 'all';
  document.getElementById('filterSubjectSelect').value = 'all';
  document.getElementById('filterRatingSelect').value = '0';
  document.getElementById('tutoringGlobalSearch').value = '';
  renderTutorsList(allTutorsList);
}

/**
 * Opens the Book Session modal with live availability slots (Features 5 & 6)
 */
async function openBookSessionModal(tutorId) {
  try {
    const user = await tutorUser();
    const tutor = allTutorsList.find(t => t.id === tutorId);
    if (!tutor) throw new Error('Tutor not found. Refresh the tutor list.');
    if (user.id === tutorId) throw new Error('You cannot book your own tutoring session. Sign in with a different student account.');
    currentSelectedTutor = tutor;
    document.getElementById('bookingTutorId').value = tutor.id;
    document.getElementById('modalTutorHeader').textContent = `Booking with ${tutor.full_name} (${tutor.faculty}). Select a date and available slot.`;
    document.getElementById('bookingSubjectSelect').innerHTML = tutor.subjects.map(sub => `<option value="${escapeHtml(sub)}">${escapeHtml(sub)}</option>`).join('');
    const {data: availability,error} = await tutorDB().from('tutor_availability').select('*').eq('tutor_id',tutor.id).eq('is_active',true);
    if (error) throw error;
    tutorState.availability = [...tutorState.availability.filter(a => a.tutor_id !== tutor.id),...(availability || [])];
    const dateInput = document.getElementById('bookingDateInput');
    const today = new Date();
    const localISO = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    dateInput.min = localISO(today);
    if (!dateInput.value || dateInput.value < dateInput.min) dateInput.value = dateInput.min;
    // Choose the next date that matches one of this tutor's published weekdays.
    const availableDays = new Set((availability || []).map(a => String(a.day_of_week).trim().toLowerCase()));
    if (availableDays.size) {
      for (let offset=0; offset<14; offset++) {
        const day = new Date(today.getFullYear(),today.getMonth(),today.getDate()+offset);
        if (availableDays.has(weekDays[day.getDay()].toLowerCase())) { dateInput.value = localISO(day); break; }
      }
    }
    dateInput.onchange = refreshBookingSlots;
    openModal('bookSessionModal');
    await refreshBookingSlots();
  } catch(error) { tutorError(error); }
}
async function refreshBookingSlots() {
  const box = document.getElementById('modalSlotsContainer');
  const selected = document.getElementById('selectedTimeSlot');
  if (!box || !selected) return;
  selected.value = '';
  if (!currentSelectedTutor) return;
  const date = document.getElementById('bookingDateInput').value;
  if (!date) { box.textContent = 'Select a date first.'; return; }
  const day = weekDays[new Date(`${date}T12:00:00`).getDay()];
  const slots = tutorState.availability.filter(a => a.tutor_id === currentSelectedTutor.id && String(a.day_of_week).trim().toLowerCase() === day.toLowerCase() && a.is_active);
  const {data: booked,error} = await tutorDB().from('tutoring_sessions').select('time_slot').eq('tutor_id',currentSelectedTutor.id).eq('session_date',date).neq('status','Cancelled');
  if (error) { tutorError(error); box.textContent = 'Could not load availability. Check permissions.'; return; }
  const busy = new Set((booked || []).map(b => b.time_slot));
  box.innerHTML = slots.length ? slots.map(a => {
    const time = `${a.start_time} - ${a.end_time}`;
    const disabled = busy.has(time);
    return `<button type="button" class="time-slot-btn ${disabled?'booked':''}" ${disabled?'disabled':''} data-slot="${escapeHtml(time)}">${escapeHtml(day)}<br>${escapeHtml(time)}${disabled?' (Booked)':''}</button>`;
  }).join('') : '<p>No slots for this date. Choose a weekday published by the tutor, or ask the tutor to add availability in Tutor Control Center.</p>';
  box.querySelectorAll('button[data-slot]').forEach(btn => btn.addEventListener('click', () => selectBookingSlot(btn,btn.dataset.slot)));
}


function selectBookingSlot(btn, timeSlot) {
  document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('selectedTimeSlot').value = timeSlot;
}

/**
 * Handles session booking form submission (Feature 6)
 */
async function handleSessionBooking(e) {
  e.preventDefault();
  try {
    const user = await tutorUser();
    const tutorId = document.getElementById('bookingTutorId').value;
    const date = document.getElementById('bookingDateInput').value;
    const time = document.getElementById('selectedTimeSlot').value;
    if (!time) throw new Error('Select an available time slot.');
    if (user.id === tutorId) throw new Error('You cannot book yourself.');
    if (date < new Date().toLocaleDateString('en-CA')) throw new Error('Select a future date.');
    const locationType = document.getElementById('bookingLocationType').value;
    const row = {
      tutor_id:tutorId,student_id:user.id,subject:document.getElementById('bookingSubjectSelect').value,
      topic:document.getElementById('bookingTopicInput').value.trim(),session_date:date,time_slot:time,
      location:locationType === 'physical' ? 'University Library (confirm with tutor)' : 'Online (link to be arranged)',
      status:'Upcoming'
    };
    if (!row.topic) throw new Error('Enter a topic.');
    const {error} = await tutorDB().from('tutoring_sessions').insert(row);
    if (error) throw error;
    closeModal('bookSessionModal'); showAlert('Booking saved successfully.','success');
    await Promise.all([renderMyBookings(),refreshBookingSlots()]);
    switchTutoringTab('bookings');
  } catch (error) { tutorError(error); }
}


/**
 * Renders the student's booked sessions (Feature 7)
 */
async function renderMyBookings() {
  const container = document.getElementById('myBookingsContainer');
  if (!container) return;
  try {
    const user = await tutorUser();
    const {data,error} = await tutorDB().from('tutoring_sessions').select('*').or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`).order('session_date',{ascending:false});
    if (error) throw error;
    tutorState.bookings = data || [];
    if (!data.length) { container.innerHTML = '<p>You have no tutoring sessions yet.</p>'; return; }
    const ids = [...new Set(data.map(b=>b.tutor_id))];
    const {data:people,error:peopleError} = await tutorDB().from('profiles').select('id,full_name').in('id',ids);
    if (peopleError) throw peopleError;
    container.innerHTML = data.map(b => {
      const name = (people || []).find(p=>p.id===b.tutor_id)?.full_name || 'Tutor';
      const completed = b.status === 'Completed';
      const canReview = completed && b.student_id === user.id;
      const link = b.meeting_link && /^https:\/\//i.test(b.meeting_link) ? `<a href="${escapeHtml(b.meeting_link)}" target="_blank" rel="noopener noreferrer">Join Meeting</a>` : '';
      return `<div style="border:1px solid var(--border-color);padding:14px;margin-bottom:12px;border-radius:6px">
        <strong>${escapeHtml(b.subject)}: ${escapeHtml(b.topic)}</strong><p>Tutor: ${escapeHtml(name)} • ${escapeHtml(b.session_date)} • ${escapeHtml(b.time_slot)}</p>
        <p>${escapeHtml(b.location || 'To be arranged')} ${link} • ${escapeHtml(b.status)}</p>
        ${canReview ? `<button class="btn btn-outline btn-sm" onclick="openTutorReviewModal('${b.tutor_id}','${b.id}')">⭐ Rate & Review Tutor</button>` : ''}
      </div>`;
    }).join('');
  } catch(error) { tutorError(error); container.textContent = 'Unable to load bookings.'; }
}


/**
 * Renders post-session materials uploaded by tutors (Feature 8)
 */
async function renderTutoringMaterials() {
  const container = document.getElementById('tutoringMaterialsContainer');
  if (!container) return;
  try {
    const user = await tutorUser();
    const {data: sessions,error:sessionError} = await tutorDB().from('tutoring_sessions').select('id').or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`);
    if (sessionError) throw sessionError;
    const ids = (sessions || []).map(s=>s.id);
    if (!ids.length) { container.innerHTML = '<p>No materials shared yet.</p>'; return; }
    const {data,error} = await tutorDB().from('tutoring_materials').select('*').in('session_id',ids).order('created_at',{ascending:false});
    if (error) throw error;
    tutorState.materials = data || [];
    container.innerHTML = data.length ? data.map(m => `<div style="border:1px solid var(--border-color);padding:12px;margin-bottom:8px;border-radius:6px"><strong>${escapeHtml(m.title)}</strong> (${escapeHtml(m.file_name)}) <button class="btn btn-outline btn-sm" onclick="downloadTutorMaterial('${m.id}')">⬇️ Download</button></div>`).join('') : '<p>No materials shared yet.</p>';
  } catch(error) { tutorError(error); container.textContent = 'Unable to load materials.'; }
}
async function downloadTutorMaterial(id) {
  try {
    const m = tutorState.materials.find(x=>x.id===id);
    if (!m) throw new Error('Material not found.');
    const {data,error} = await tutorDB().storage.from('tutoring-materials').createSignedUrl(m.file_url,60);
    if (error) throw error;
    window.open(data.signedUrl,'_blank','noopener,noreferrer');
  } catch(error) { tutorError(error); }
}


/**
 * Renders availability slots for tutor management (Feature 5)
 */
async function renderMyAvailability() {
  const container = document.getElementById('myAvailabilitySlots');
  if (!container) return;
  try {
    const user = await tutorUser();
    const {data,error} = await tutorDB().from('tutor_availability').select('*').eq('tutor_id',user.id).order('day_of_week');
    if (error) throw error;
    container.innerHTML = data.length ? data.map(s => `<div style="border:1px solid var(--border-color);padding:10px;margin-bottom:6px"><strong>${escapeHtml(s.day_of_week)}</strong>: ${escapeHtml(s.start_time)} - ${escapeHtml(s.end_time)} <button class="btn btn-outline btn-sm" onclick="deleteTutorSlot('${s.id}')">Remove</button></div>`).join('') : '<p>No availability added yet.</p>';
  } catch(error) { tutorError(error); container.textContent = 'Unable to load availability.'; }
}
async function deleteTutorSlot(id) {
  if (!confirm('Remove this availability slot?')) return;
  try { const {error} = await tutorDB().from('tutor_availability').delete().eq('id',id); if(error) throw error; await Promise.all([renderMyAvailability(),loadTutors()]); } catch(error) { tutorError(error); }
}


/**
 * Handles tutor review submission (Feature 9)
 */
function openTutorReviewModal(tutorId, sessionId) {
  document.getElementById('reviewTutorId').value = tutorId;
  document.getElementById('reviewSessionId').value = sessionId;
  setReviewRating(5);
  openModal('tutorReviewModal');
}

function setReviewRating(stars) {
  document.getElementById('reviewStarRating').value = stars;
  const spans = document.querySelectorAll('#starRatingSelectArea span');
  spans.forEach((span, idx) => {
    span.style.color = (idx < stars) ? '#f59e0b' : '#d1d5db';
  });
}

async function handleTutorReviewSubmit(e) {
  e.preventDefault();
  try {
    const user = await tutorUser();
    const {error} = await tutorDB().from('tutor_reviews').insert({
      tutor_id:document.getElementById('reviewTutorId').value,
      session_id:document.getElementById('reviewSessionId').value,
      student_id:user.id,
      rating:Number(document.getElementById('reviewStarRating').value),
      feedback:document.getElementById('reviewFeedbackText').value.trim()
    });
    if (error) throw error;
    closeModal('tutorReviewModal'); showAlert('Review saved successfully.');
    await loadTutors();
  } catch(error) { tutorError(error); }
}


/**
 * Handles tutor study material upload (Feature 8)
 */
async function handleMaterialUpload(e) {
  e.preventDefault();
  let uploadedPath = null;
  try {
    const user = await tutorUser();
    const {data:sessions,error:sessionError} = await tutorDB().from('tutoring_sessions').select('id,topic').eq('tutor_id',user.id);
    if (sessionError) throw sessionError;
    if (!sessions.length) throw new Error('You need a booked tutoring session before sharing materials.');
    const chosen = sessions.length === 1 ? sessions[0] : sessions.find(s=>s.id===prompt('Enter the session ID to share with:\n'+sessions.map(s=>`${s.topic}: ${s.id}`).join('\n')));
    if (!chosen) throw new Error('Select a valid session.');
    const file = document.getElementById('matFile').files[0];
    if (!file) throw new Error('Choose a file.');
    if (file.size > 10*1024*1024) throw new Error('File must be 10 MB or smaller.');
    const allowed = ['pdf','docx','ppt','pptx','doc'];
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!allowed.includes(ext)) throw new Error('Unsupported file format.');
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const {error:uploadError} = await tutorDB().storage.from('tutoring-materials').upload(path,file,{contentType:file.type || 'application/octet-stream'});
    if (uploadError) throw uploadError;
    uploadedPath = path;
    const {error} = await tutorDB().from('tutoring_materials').insert({session_id:chosen.id,tutor_id:user.id,title:document.getElementById('matTitle').value.trim(),file_url:path,file_name:file.name,file_type:ext.toUpperCase()});
    if (error) throw error;
    uploadedPath = null;
    document.getElementById('uploadTutoringMaterialForm').reset();
    showAlert('Material uploaded and saved successfully.');
    await renderTutoringMaterials(); switchTutoringTab('bookings');
  } catch(error) {
    if (uploadedPath) await tutorDB().storage.from('tutoring-materials').remove([uploadedPath]);
    tutorError(error);
  }
}
async function openBecomeTutorModal() {
  try {
    const user = await tutorUser();
    const {data, error} = await tutorDB().from('tutor_profiles').select('subjects,bio').eq('user_id',user.id).maybeSingle();
    if (error) throw error;
    const selected = (data?.subjects || '').split(',').map(s => s.trim()).filter(Boolean);
    const known = [...document.querySelectorAll('#becomeTutorModal input[name="tutorSubject"]')];
    known.forEach(input => { input.checked = selected.includes(input.value); });
    document.getElementById('tutorCustomSubjects').value = selected.filter(s => !known.some(input => input.value === s)).join(', ');
    document.getElementById('tutorBioInput').value = data?.bio || '';
    const errorBox = document.getElementById('tutorSubjectError');
    errorBox.hidden = true; errorBox.textContent = '';
    const modal = document.getElementById('becomeTutorModal');
    modal.classList.add('active'); modal.setAttribute('aria-hidden','false');
    known[0]?.focus();
  } catch(error) { tutorError(error); }
}
function closeBecomeTutorModal() {
  const modal = document.getElementById('becomeTutorModal');
  modal?.classList.remove('active'); modal?.setAttribute('aria-hidden','true');
}
async function saveBecomeTutor(event) {
  event.preventDefault();
  const errorBox = document.getElementById('tutorSubjectError');
  const button = document.getElementById('saveTutorBtn');
  const selected = [...document.querySelectorAll('#becomeTutorModal input[name="tutorSubject"]:checked')].map(input => input.value);
  const custom = document.getElementById('tutorCustomSubjects').value.split(',').map(s => s.trim()).filter(Boolean);
  const subjects = [...new Set([...selected,...custom])];
  if (!subjects.length) {
    errorBox.textContent = 'Please select at least one subject.'; errorBox.hidden = false;
    return;
  }
  errorBox.hidden = true; button.disabled = true; button.textContent = 'Saving...';
  try {
    const user = await tutorUser();
    const bio = document.getElementById('tutorBioInput').value.trim();
    const {error} = await tutorDB().from('tutor_profiles').upsert({user_id:user.id,subjects:subjects.join(', '),bio,is_active:true},{onConflict:'user_id'});
    if (error) throw error;
    closeBecomeTutorModal();
    showAlert('Tutor profile saved successfully.');
    await loadTutors(); switchTutoringTab('manage');
  } catch(error) {
    errorBox.textContent = error?.message || String(error); errorBox.hidden = false;
    console.error('[Tutoring] Tutor registration:',error);
  } finally { button.disabled = false; button.textContent = 'Save Tutor Profile'; }
}
async function openAddSlotModal() {
  try {
    const user = await tutorUser();
    const day = prompt('Day of week (e.g. Monday):','Monday');
    if (!day) return;
    const start = prompt('Start time in 24h HH:MM format:','09:00');
    if (!start) return;
    const end = prompt('End time in 24h HH:MM format:','10:00');
    if (!end) return;
    if (!weekDays.includes(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(end) || start >= end) throw new Error('Enter a valid day and time range.');
    const {error} = await tutorDB().from('tutor_availability').insert({tutor_id:user.id,day_of_week:day,start_time:start,end_time:end});
    if (error) throw error;
    showAlert('Availability saved successfully.');
    await Promise.all([renderMyAvailability(),loadTutors()]);
  } catch(error) { tutorError(error); }
}


// Modal & Alert Helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function showAlert(msg, type = 'success') {
  const alertBox = document.getElementById('tutoringAlert');
  if (alertBox) {
    alertBox.textContent = msg;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 5000);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
