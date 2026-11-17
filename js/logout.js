/**
 * ==============================================================================
 * UniSkill Hub - Logout Functionality
 * File: js/logout.js
 * Function: logoutUser()
 * Description: Terminates user session with Supabase Auth and redirects to login.
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Bind logout buttons dynamically across any page
  const logoutButtons = document.querySelectorAll('.logout-trigger, #logoutBtn, #navLogoutBtn');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  });
});

/**
 * Signs out the current student user and redirects to login page
 */
async function logoutUser() {
  try {
    // If connected to live Supabase
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && window.supabaseClient) {
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) {
        console.warn('Supabase sign out error:', error.message);
      }
    }

    // Always clear local session cache
    localStorage.removeItem('uniskill_active_session');
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.mock) {
      window.SUPABASE_CONFIG.mock.setCurrentSession(null);
    }
    
    sessionStorage.clear();
    console.log('Student user successfully signed out.');

    // Redirect to login page
    window.location.href = 'login.html';

  } catch (err) {
    console.error('Error signing out:', err);
    window.location.href = 'login.html';
  }
}

// Make globally accessible
window.logoutUser = logoutUser;
