/**
 * ==============================================================================
 * UniSkill Hub - Registration Logic
 * File: js/register.js
 * Function: registerUser()
 * Description: Validates student registration input, registers user with Supabase
 * Auth, and saves extended academic profile data to the `profiles` table.
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', registerUser);
  }

  // Password toggle visibility
  const togglePassBtn = document.getElementById('togglePassword');
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
      const passInput = document.getElementById('password');
      if (passInput.type === 'password') {
        passInput.type = 'text';
        togglePassBtn.textContent = 'Hide';
      } else {
        passInput.type = 'password';
        togglePassBtn.textContent = 'Show';
      }
    });
  }
});

/**
 * Main registration function
 * Handles user creation and profile insertion
 */
async function registerUser(event) {
  event.preventDefault();

  // 1. Get DOM Elements
  const alertBox = document.getElementById('alertBox');
  const submitBtn = document.getElementById('registerSubmitBtn');
  const btnText = document.getElementById('registerBtnText');
  const btnSpinner = document.getElementById('registerBtnSpinner');

  // Clear any existing alert
  showAlert('', 'clear');

  // 2. Read Form Values
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const faculty = document.getElementById('faculty').value;
  const degree = document.getElementById('degree').value.trim();
  const academicYear = document.getElementById('academicYear').value;
  const skills = document.getElementById('skills') ? document.getElementById('skills').value.trim() : 'General Studies';
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // 3. Client-Side Validation
  if (!fullName || !email || !faculty || !degree || !academicYear || !password || !confirmPassword) {
    showAlert('Please fill in all required academic fields.', 'error');
    return;
  }

  // Validate Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAlert('Please enter a valid university email address.', 'error');
    return;
  }

  // Validate Password Length (Supabase requires at least 6 characters)
  if (password.length < 6) {
    showAlert('Password must be at least 6 characters long.', 'error');
    return;
  }

  // Validate Password Matching
  if (password !== confirmPassword) {
    showAlert('Passwords do not match. Please re-enter your password.', 'error');
    return;
  }

  // 4. Update UI to Loading State
  setLoading(true);

  try {
    // Check if Supabase client is initialized with live credentials
    if (window.SUPABASE_CONFIG.isConfigured() && window.supabaseClient) {
      
      // Step A: Create user in Supabase Auth
      const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            faculty: faculty,
            degree: degree,
            academic_year: academicYear,
            skills: skills
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Registration failed. Please try again.');
      }

      // Step B: Insert or upsert student record into the `profiles` table
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`;
      
      const studentProfile = {
        id: authData.user.id,
        full_name: fullName,
        email: email,
        faculty: faculty,
        degree: degree,
        academic_year: academicYear,
        skills: skills || 'Web Development, Communication',
        bio: `Undergraduate student at ${faculty}. Passionate about sharing skills and knowledge on UniSkill Hub.`,
        profile_image: avatarUrl,
        created_at: new Date().toISOString()
      };

      const { error: profileError } = await window.supabaseClient
        .from('profiles')
        .upsert(studentProfile);

      if (profileError) {
        console.warn('Profile table insert warning:', profileError.message);
      }

      // Step C: Establish user session immediately (Auto-login)
      const sessionData = {
        user: {
          id: authData.user.id,
          email: email,
          user_metadata: {
            full_name: fullName,
            faculty: faculty,
            degree: degree,
            academic_year: academicYear,
            skills: skills
          }
        },
        profile: studentProfile
      };

      // Try live signInWithPassword in the background (if email confirmation is off)
      try {
        await window.supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });
      } catch (e) {
        console.log('Background signIn check completed.');
      }

      // Always save active session locally so user is already logged in immediately!
      localStorage.setItem('uniskill_active_session', JSON.stringify(sessionData));
      if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.mock) {
        window.SUPABASE_CONFIG.mock.setCurrentSession(sessionData);
      }

      // Step D: Show success message & Redirect directly to the HOME PAGE (index.html)
      showAlert('Registration successful! You are now logged in. Redirecting to Home Page...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html?registered=1';
      }, 1200);

    } else {
      // ------------------------------------------------------------------------
      // Offline Demo Mode: Saves account in browser storage for instant testing
      // ------------------------------------------------------------------------
      console.log('Running in Demo Mode: Simulating user registration & profile creation.');
      
      const mockUsers = window.SUPABASE_CONFIG.mock.getUsers();
      
      // Check if email already registered in mock
      if (mockUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('An account with this email already exists.');
      }

      const mockUserId = 'usr_' + Date.now();
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`;

      const newStudentProfile = {
        id: mockUserId,
        full_name: fullName,
        email: email,
        faculty: faculty,
        degree: degree,
        academic_year: academicYear,
        skills: skills || 'Web Development, Java, Statistics',
        bio: `Undergraduate student in ${degree} at ${faculty}. Excited to collaborate on UniSkill Hub!`,
        profile_image: avatarUrl,
        password: password, // for demo mock verification only
        created_at: new Date().toISOString()
      };

      mockUsers.push(newStudentProfile);
      window.SUPABASE_CONFIG.mock.saveUsers(mockUsers);

      const demoSession = {
        user: {
          id: mockUserId,
          email: email,
          user_metadata: { full_name: fullName }
        },
        profile: newStudentProfile
      };

      // Set active session
      localStorage.setItem('uniskill_active_session', JSON.stringify(demoSession));
      window.SUPABASE_CONFIG.mock.setCurrentSession(demoSession);

      showAlert('Registration successful! You are now logged in. Redirecting to Home Page...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html?registered=1';
      }, 1200);
    }

  } catch (error) {
    showAlert(error.message || 'An unexpected error occurred. Please try again.', 'error');
  } finally {
    setLoading(false);
  }

  // Helper to toggle button loading state
  function setLoading(isLoading) {
    if (submitBtn) submitBtn.disabled = isLoading;
    if (btnSpinner) btnSpinner.style.display = isLoading ? 'inline-block' : 'none';
    if (btnText) btnText.textContent = isLoading ? 'Creating Account...' : 'Join Now';
  }

  // Helper to show styled alert banners
  function showAlert(message, type) {
    if (!alertBox) return;
    if (type === 'clear') {
      alertBox.style.display = 'none';
      alertBox.className = 'alert';
      alertBox.textContent = '';
      return;
    }
    alertBox.style.display = 'flex';
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
  }
}
