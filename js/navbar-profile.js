
/*
 * UniSkill Hub - Global Profile Synchronization
 * Supabase Auth + Profiles Table
 */

(function () {
  "use strict";

  const DEFAULT_AVATAR =
    "https://api.dicebear.com/7.x/avataaars/svg?seed=student";

  let syncing = false;

  function updateProfileUI(profile) {
    const name = profile.full_name || "Student";
    const avatar = profile.profile_image || DEFAULT_AVATAR;

    // Navbar username
    document.querySelectorAll(
      "#navUserName, .nav-user-name"
    ).forEach(element => {
      element.textContent = name;
    });

    // Navbar avatar
    document.querySelectorAll(
      "#navUserAvatar, img.nav-avatar"
    ).forEach(element => {
      element.src = avatar;
      element.alt = name;
    });

    // My Profile avatar
    const profileAvatar =
      document.getElementById("myProfileAvatar");

    if (profileAvatar) {
      profileAvatar.src = avatar;
    }
  }

  async function syncGlobalProfile() {
    if (syncing) return;
    syncing = true;

    try {
      const sb =
        window.supabaseClient ||
        window.SUPABASE_CONFIG?.client;

      if (!sb) {
        console.warn("Supabase client not initialized");
        return;
      }

      const { data: auth, error: authError } =
        await sb.auth.getUser();

      if (authError || !auth?.user) {
        console.warn("No authenticated Supabase user");
        return;
      }

      const user = auth.user;

      const { data: profile, error } = await sb
        .from("profiles")
        .select("full_name, profile_image")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      updateProfileUI({
        full_name:
          profile?.full_name ||
          user.user_metadata?.full_name ||
          "Student",
        profile_image: profile?.profile_image
      });

      console.log("Global profile synchronized");

    } catch (error) {
      console.error(
        "Global profile sync error:",
        error.message
      );
    } finally {
      syncing = false;
    }
  }

  window.refreshNavbarProfile = syncGlobalProfile;

  function initialize() {
    syncGlobalProfile();

    // Refresh after navigating back to a page
    window.addEventListener(
      "pageshow",
      syncGlobalProfile
    );

    // Refresh when returning to the browser tab
    document.addEventListener(
      "visibilitychange",
      () => {
        if (!document.hidden) {
          syncGlobalProfile();
        }
      }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );
  } else {
    initialize();
  }
})();
