
/* =====================================================
   UniSkillHub - Global Dark / Light Theme Manager
   ===================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "uniskill_theme";
  const root = document.documentElement;

  // SVG Icons
  const moonSVG = `
    <svg width="20" height="20" fill="none"
      stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M20.354 15.354A9 9 0 018.646 3.646
        9.003 9.003 0 0012 21
        a9.003 9.003 0 008.354-5.646z"/>
    </svg>
  `;

  const sunSVG = `
    <svg width="20" height="20" fill="none"
      stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 3v1m0 16v1m9-9h-1
        M4 12H3m15.364 6.364l-.707-.707
        M6.343 6.343l-.707-.707
        m12.728 0l-.707.707
        M6.343 17.657l-.707.707
        M16 12a4 4 0 11-8 0
        4 4 0 018 0z"/>
    </svg>
  `;

  // Get saved theme
  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "dark"
        ? "dark"
        : "light";
    } catch (error) {
      return "light";
    }
  }

  // Save selected theme
  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      console.warn("Theme could not be saved.");
    }
  }

  // Apply theme
  function applyTheme(theme) {
    const isDark = theme === "dark";

    root.setAttribute(
      "data-theme",
      isDark ? "dark" : "light"
    );

    root.style.colorScheme = isDark
      ? "dark"
      : "light";

    updateToggleButton();
  }

  // Update button icon
  function updateToggleButton() {
    const btn = document.getElementById(
      "themeToggleBtn"
    );

    if (!btn) return;

    const isDark =
      root.getAttribute("data-theme") === "dark";

    btn.innerHTML = isDark ? sunSVG : moonSVG;

    btn.title = isDark
      ? "Switch to Light Mode"
      : "Switch to Dark Mode";

    btn.setAttribute(
      "aria-label",
      btn.title
    );

    btn.setAttribute(
      "aria-pressed",
      String(isDark)
    );
  }

  // Toggle dark / light
  function toggleTheme() {
    const currentTheme =
      root.getAttribute("data-theme");

    const newTheme =
      currentTheme === "dark"
        ? "light"
        : "dark";

    applyTheme(newTheme);
    saveTheme(newTheme);
  }

  // Create theme toggle button
  function createThemeButton() {
    const existingBtn = document.getElementById(
      "themeToggleBtn"
    );

    if (existingBtn) {
      existingBtn.type = "button";
      existingBtn.addEventListener(
        "click",
        toggleTheme
      );
      updateToggleButton();
      return;
    }

    const navMenu = document.querySelector(
      ".nav-menu"
    );

    const navAuth = document.querySelector(
      ".nav-auth-buttons"
    );

    const navContainer = document.querySelector(
      ".nav-container"
    );

    if (!navContainer) return;

    const btn = document.createElement("button");

    btn.id = "themeToggleBtn";
    btn.className = "theme-toggle-btn";
    btn.type = "button";

    // Button styles
    Object.assign(btn.style, {
      marginRight: "15px",
      background: "transparent",
      border: "1px solid var(--border-color, #555)",
      borderRadius: "50%",
      width: "36px",
      height: "36px",
      minWidth: "36px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--text-main, #e7e9ea)",
      transition: "all 0.3s ease"
    });

    // Insert button into navbar
    if (navAuth) {
      navAuth.insertBefore(
        btn,
        navAuth.firstChild
      );
    } else if (navMenu) {
      navMenu.appendChild(btn);
    } else {
      navContainer.appendChild(btn);
    }

    btn.addEventListener(
      "click",
      toggleTheme
    );

    updateToggleButton();
  }

  // Apply saved theme immediately
  applyTheme(getSavedTheme());

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      createThemeButton
    );
  } else {
    createThemeButton();
  }

  // Synchronize theme across browser tabs
  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY) {
      applyTheme(getSavedTheme());
    }
  });

})();
