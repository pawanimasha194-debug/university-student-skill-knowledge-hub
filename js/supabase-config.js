/**
 * ==============================================================================
 * UniSkill Hub - Supabase Configuration & Client Initialization
 * File: js/supabase-config.js
 * Description: Sets up the Supabase client using the Supabase JS SDK.
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. SUPABASE CREDENTIALS SETUP
// Configured with your live Supabase project.
// ------------------------------------------------------------------------------
const SUPABASE_URL = 'https://eyqlpfseaikmjipgftji.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_A5FwO4D8xgbYLvCeZYuypg_11-eZVv8';

// Check if actual credentials have been provided
function isSupabaseConfigured() {
  return (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('YOUR_SUPABASE_PROJECT_ID') &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_PUBLIC_KEY')
  );
}

// ------------------------------------------------------------------------------
// 2. INITIALIZE SUPABASE CLIENT
// ------------------------------------------------------------------------------
let supabaseClient = null;

function initSupabase() {
  if (typeof window.supabase !== 'undefined' && isSupabaseConfigured()) {
    try {
      if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supabaseClient;
        if (window.SUPABASE_CONFIG) {
          window.SUPABASE_CONFIG.client = supabaseClient;
        }
        console.log('✅ UniSkill Hub: Connected to live Supabase backend successfully.');
      }
      return supabaseClient;
    } catch (err) {
      console.error('❌ UniSkill Hub: Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

// Initial attempt
initSupabase();

// Retry on DOMContentLoaded if CDN script took a few milliseconds to parse
document.addEventListener('DOMContentLoaded', () => {
  if (!supabaseClient) {
    initSupabase();
  }
});

// ------------------------------------------------------------------------------
// 3. OFFLINE DEMO HELPER (Fallback for effortless evaluation & presentation)
// This ensures that before entering live keys, your undergraduate presentation
// still works 100% seamlessly in any web browser!
// ------------------------------------------------------------------------------
const MockAuthService = {
  getUsers() {
    return JSON.parse(localStorage.getItem('uniskill_mock_users') || '[]');
  },
  saveUsers(users) {
    localStorage.setItem('uniskill_mock_users', JSON.stringify(users));
  },
  getCurrentSession() {
    return JSON.parse(localStorage.getItem('uniskill_current_session') || 'null');
  },
  setCurrentSession(session) {
    if (session) {
      localStorage.setItem('uniskill_current_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('uniskill_current_session');
    }
  }
};

// Expose on global window object
window.supabaseClient = supabaseClient;
window.SUPABASE_CONFIG = {
  isConfigured: isSupabaseConfigured,
  client: supabaseClient,
  mock: MockAuthService
};
