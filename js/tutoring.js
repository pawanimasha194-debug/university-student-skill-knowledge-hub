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
    dateInput.value = tomorrow.toISOString().split('T')[0];
    dateInput.min = new Date().toISOString().split('T')[0];
  }
});

function initTutoringPage() {
  allTutorsList = window.AcademicCore ? window.AcademicCore.getStoredTutors() : [];
  renderTutorsList(allTutorsList);
  renderMyBookings();
  renderTutoringMaterials();
  renderMyAvailability();
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
          <div style="font-size: 11px; font-weight: 700; color: #057642; margin-top: 6px;">● Available</div>
        </div>

        <!-- Col 2: Info -->
        <div class="tutor-info">
          <h3>${escapeHtml(tutor.full_name)}</h3>
          <div class="tutor-faculty-tag">
            <strong>${escapeHtml(tutor.faculty)}</strong> • <span>${escapeHtml(tutor.degree || 'BSc Degree')}</span> (${escapeHtml(tutor.academic_year || 'Undergraduate')})
          </div>

          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
            <div class="star-rating">
              <span>⭐⭐⭐⭐⭐</span>
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
            ${tutor.reputation_score || 94} / 100
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
  const query = searchQuery || document.getElementById('tutoringGlobalSearch')?.value.toLowerCase().trim() || '';

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
      const matchFaculty = tutor.faculty.toLowerCase().includes(query);
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
function openBookSessionModal(tutorId) {
  const tutor = allTutorsList.find(t => t.id === tutorId || t.student_id === tutorId);
  if (!tutor) return;

  currentSelectedTutor = tutor;
  document.getElementById('bookingTutorId').value = tutor.id;
  document.getElementById('modalTutorHeader').innerHTML = `
    Booking with <strong>${escapeHtml(tutor.full_name)}</strong> (${escapeHtml(tutor.faculty)}). Select your subject and time slot.
  `;

  // Populate subjects dropdown
  const subjectSelect = document.getElementById('bookingSubjectSelect');
  subjectSelect.innerHTML = tutor.subjects.map(sub => 
    `<option value="${escapeHtml(sub)}">${escapeHtml(sub)}</option>`
  ).join('');

  // Check bookings for conflicts
  const existingBookings = window.AcademicCore.getStoredBookings();
  const selectedDate = document.getElementById('bookingDateInput').value;

  // Render Availability time slot buttons (Feature 5: Tutor Availability Calendar)
  const slotsContainer = document.getElementById('modalSlotsContainer');
  document.getElementById('selectedTimeSlot').value = '';

  const slots = tutor.availability || [
    { day: 'Monday', time: '09:00 - 10:00', status: 'available' },
    { day: 'Monday', time: '10:00 - 11:00', status: 'available' },
    { day: 'Tuesday', time: '14:00 - 15:00', status: 'available' },
    { day: 'Thursday', time: '10:00 - 12:00', status: 'available' }
  ];

  slotsContainer.innerHTML = slots.map((slot, idx) => {
    // Check if slot on selectedDate is already booked
    const isBooked = existingBookings.some(b => 
      b.tutor_id === tutor.id && 
      b.session_date === selectedDate && 
      b.time_slot === slot.time &&
      b.status !== 'Cancelled'
    );

    if (isBooked) {
      return `<button type="button" class="time-slot-btn booked" disabled>${slot.day}<br>${slot.time}</button>`;
    }

    return `
      <button type="button" class="time-slot-btn" onclick="selectBookingSlot(this, '${slot.time}')">
        ${slot.day}<br>${slot.time}
      </button>
    `;
  }).join('');

  openModal('bookSessionModal');
}

function selectBookingSlot(btn, timeSlot) {
  document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('selectedTimeSlot').value = timeSlot;
}

/**
 * Handles session booking form submission (Feature 6)
 */
function handleSessionBooking(e) {
  e.preventDefault();

  const tutorId = document.getElementById('bookingTutorId').value;
  const subject = document.getElementById('bookingSubjectSelect').value;
  const topic = document.getElementById('bookingTopicInput').value;
  const date = document.getElementById('bookingDateInput').value;
  const timeSlot = document.getElementById('selectedTimeSlot').value;
  const locationType = document.getElementById('bookingLocationType').value;

  if (!timeSlot) {
    alert('Please select an available weekly time slot.');
    return;
  }

  const result = window.AcademicCore.bookTutoringSession({
    tutorId: tutorId,
    subject: subject,
    topic: topic,
    date: date,
    timeSlot: timeSlot,
    meetingType: locationType,
    location: locationType === 'physical' ? 'University Library - Study Pod 3' : 'Google Meet'
  });

  if (result.success) {
    closeModal('bookSessionModal');
    showAlert(result.message, 'success');
    renderMyBookings();
    switchTutoringTab('bookings');
  } else {
    alert(result.message);
  }
}

/**
 * Renders the student's booked sessions (Feature 7)
 */
function renderMyBookings() {
  const container = document.getElementById('myBookingsContainer');
  if (!container) return;

  const bookings = window.AcademicCore ? window.AcademicCore.getStoredBookings() : [];

  if (bookings.length === 0) {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: var(--text-muted); background: #f9fafb; border-radius: 6px;">
        You have no upcoming tutoring sessions. Browse the marketplace and book a session!
      </div>
    `;
    return;
  }

  container.innerHTML = bookings.map(b => {
    const isCompleted = b.status === 'Completed';
    const statusColor = isCompleted ? '#057642' : '#0a66c2';

    return `
      <div style="border: 1px solid var(--border-color); border-radius: 6px; padding: 14px; margin-bottom: 12px; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
          <div>
            <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">
              ${escapeHtml(b.subject)}: ${escapeHtml(b.topic)}
            </h4>
            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 6px;">
              Tutor: <strong>${escapeHtml(b.tutor_name)}</strong> • 📅 <strong>${b.session_date}</strong> at <strong>${b.time_slot}</strong> (${b.duration})
            </div>
            <div style="font-size: 12px; color: #4b5563;">
              📍 Location: <strong>${escapeHtml(b.location)}</strong>
              ${b.meeting_link ? `• <a href="${b.meeting_link}" target="_blank" style="font-weight: 600;">Join Meeting Link &rarr;</a>` : ''}
            </div>
          </div>

          <div style="text-align: right;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; background: ${statusColor}15; color: ${statusColor}; margin-bottom: 8px;">
              ${b.status}
            </span>
            <div>
              ${isCompleted 
                ? `<button class="btn btn-outline btn-sm" onclick="openTutorReviewModal('${b.tutor_id}', '${b.id}')">⭐ Rate & Review Tutor</button>`
                : `<button class="btn btn-secondary btn-sm" onclick="alert('Session confirmed! Meeting room is active.')">Details</button>`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Renders post-session materials uploaded by tutors (Feature 8)
 */
function renderTutoringMaterials() {
  const container = document.getElementById('tutoringMaterialsContainer');
  if (!container) return;

  const materials = window.AcademicCore ? window.AcademicCore.getStoredTutoringMaterials() : [];

  container.innerHTML = materials.map(mat => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px; background: #fdfdfd;">
      <div>
        <strong style="font-size: 13.5px; color: var(--text-main); display: block;">📑 ${escapeHtml(mat.title)}</strong>
        <span style="font-size: 11.5px; color: var(--text-muted);">
          Shared by ${escapeHtml(mat.tutor_name)} • ${mat.file_type} (${mat.file_size}) • ${mat.upload_date}
        </span>
      </div>
      <div>
        <a href="${mat.file_url}" class="btn btn-outline btn-sm" download onclick="alert('Downloading: ' + '${escapeHtml(mat.file_name)}')">
          ⬇️ Download Material
        </a>
      </div>
    </div>
  `).join('');
}

/**
 * Renders availability slots for tutor management (Feature 5)
 */
function renderMyAvailability() {
  const container = document.getElementById('myAvailabilitySlots');
  if (!container) return;

  const slots = [
    { day: 'Monday', time: '09:00 - 10:00', status: 'Booked by Tharushi' },
    { day: 'Monday', time: '10:00 - 11:00', status: 'Open' },
    { day: 'Wednesday', time: '14:00 - 16:00', status: 'Open' },
    { day: 'Thursday', time: '10:00 - 12:00', status: 'Open' }
  ];

  container.innerHTML = slots.map(s => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 6px; font-size: 13px;">
      <div>
        <strong>${s.day}</strong>: ${s.time}
      </div>
      <div>
        <span style="font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: ${s.status === 'Open' ? '#def7ec' : '#fee2e2'}; color: ${s.status === 'Open' ? '#03543f' : '#991b1b'};">
          ${s.status}
        </span>
      </div>
    </div>
  `).join('');
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

function handleTutorReviewSubmit(e) {
  e.preventDefault();
  const tutorId = document.getElementById('reviewTutorId').value;
  const sessionId = document.getElementById('reviewSessionId').value;
  const rating = document.getElementById('reviewStarRating').value;
  const feedback = document.getElementById('reviewFeedbackText').value;

  const result = window.AcademicCore.submitTutorReview({
    tutorId: tutorId,
    sessionId: sessionId,
    rating: rating,
    feedback: feedback
  });

  if (result.success) {
    closeModal('tutorReviewModal');
    showAlert(result.message, 'success');
  } else {
    alert(result.message);
  }
}

/**
 * Handles tutor study material upload (Feature 8)
 */
function handleMaterialUpload(e) {
  e.preventDefault();
  const title = document.getElementById('matTitle').value;
  const fileInput = document.getElementById('matFile');
  const file = fileInput.files[0];

  if (!file) {
    alert('Please choose a file to upload.');
    return;
  }

  const result = window.AcademicCore.uploadTutoringMaterial({
    title: title,
    fileName: file.name,
    fileType: file.name.split('.').pop().toUpperCase(),
    fileUrl: 'uploads/' + file.name
  });

  showAlert(result.message, 'success');
  document.getElementById('uploadTutoringMaterialForm').reset();
  renderTutoringMaterials();
  switchTutoringTab('bookings');
}

function openBecomeTutorModal() {
  alert('Tutor Registration Form: Select your verified coursework subjects, specify weekly availability windows, and activate your campus tutor profile!');
  switchTutoringTab('manage');
}

function openAddSlotModal() {
  const day = prompt('Enter Day of Week (e.g. Monday, Tuesday, Friday):', 'Tuesday');
  const time = prompt('Enter Time Window (e.g. 14:00 - 15:00):', '14:00 - 15:00');
  if (day && time) {
    alert(`Availability slot "${day} ${time}" added to your weekly calendar!`);
    renderMyAvailability();
  }
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
