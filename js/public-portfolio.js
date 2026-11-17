
(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);

  const params = new URLSearchParams(window.location.search);

  function getClient() {
    const candidates = [
      window.supabaseClient,
      window.sb,
      window.supabaseDb,
      window._supabase
    ];

    return candidates.find(
      (client) => client && typeof client.from === "function"
    ) || null;
  }

  function getStudentId() {
    const urlId =
      params.get("id") ||
      params.get("student_id") ||
      params.get("user_id");

    if (urlId) return urlId;

    if (typeof window.getActiveStudent === "function") {
      const student = window.getActiveStudent();

      if (student) {
        return (
          student.user_id ||
          student.auth_user_id ||
          student.id ||
          null
        );
      }
    }

    return null;
  }

  function showMessage(message) {
    const status = byId("publicPortfolioStatus");

    if (status) {
      status.textContent = message;
    }
  }

  function createText(tag, value, className = "") {
    const element = document.createElement(tag);

    element.textContent = String(value ?? "");

    if (className) {
      element.className = className;
    }

    return element;
  }

  function addText(card, value, className = "") {
    if (!value) return;

    card.appendChild(createText("p", value, className));
  }

  function addLink(card, url, label) {
    if (!url) return;

    try {
      const parsed = new URL(url);

      if (!["https:", "http:"].includes(parsed.protocol)) {
        return;
      }

      const link = createText("a", label);

      link.href = parsed.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      card.appendChild(link);
    } catch {
      console.warn("Invalid portfolio URL:", url);
    }
  }

  function renderPortfolio(containerId, rows, type) {
    const container = byId(containerId);

    if (!container) return;

    container.replaceChildren();

    if (!rows || rows.length === 0) {
      container.appendChild(
        createText(
          "p",
          "Nothing added yet.",
          "public-portfolio-empty"
        )
      );
      return;
    }

    rows.forEach((item) => {
      const card = document.createElement("article");

      card.className = "public-portfolio-item";

      if (type === "projects") {
        card.appendChild(
          createText("h4", item.title || "Untitled Project")
        );

        addText(card, item.description);

        if (item.technologies) {
          addText(
            card,
            "Technologies: " + item.technologies,
            "meta"
          );
        }

        addLink(card, item.project_url, "View Project");
      }

      if (type === "certificates") {
        card.appendChild(
          createText("h4", item.title || "Certificate")
        );

        addText(card, item.issuer, "meta");
        addText(card, item.issue_date, "meta");

        addLink(
          card,
          item.certificate_url,
          "View Certificate"
        );
      }

      if (type === "experience") {
        card.appendChild(
          createText("h4", item.role || "Experience")
        );

        addText(card, item.company, "meta");
        addText(card, item.period, "meta");
        addText(card, item.description);
      }

      container.appendChild(card);
    });
  }

  async function loadPublicPortfolio() {
    const studentId = getStudentId();
    const supabase = getClient();

    if (!studentId) {
      showMessage(
        "Student ID not found. Open this profile from the student directory."
      );
      return;
    }

    if (!supabase) {
      showMessage(
        "Supabase connection not found. Check supabase-config.js."
      );
      return;
    }

    const sections = [
      {
        table: "portfolio_projects",
        container: "publicProjects",
        type: "projects"
      },
      {
        table: "portfolio_certificates",
        container: "publicCertificates",
        type: "certificates"
      },
      {
        table: "portfolio_experience",
        container: "publicExperience",
        type: "experience"
      }
    ];

    const results = await Promise.all(
      sections.map(async (section) => {
        try {
          const { data, error } = await supabase
            .from(section.table)
            .select("*")
            .eq("user_id", studentId)
            .order("created_at", {
              ascending: false
            });

          if (error) throw error;

          renderPortfolio(
            section.container,
            data || [],
            section.type
          );

          return true;
        } catch (error) {
          console.error(
            "Portfolio loading error:",
            section.table,
            error
          );

          const container = byId(section.container);

          if (container) {
            container.replaceChildren(
              createText(
                "p",
                "Unable to load this section.",
                "public-portfolio-empty"
              )
            );
          }

          return false;
        }
      })
    );

    if (results.every(Boolean)) {
      showMessage("");
    } else {
      showMessage(
        "Some portfolio sections could not be loaded."
      );
    }
  }

  function setupShareButton() {
    const button = byId("sharePortfolioBtn");

    if (!button) return;

    button.addEventListener("click", async () => {
      const studentId = getStudentId();

      if (!studentId) {
        showMessage("Student ID not found.");
        return;
      }

      const url = new URL(window.location.href);

      url.search = "";
      url.searchParams.set("id", studentId);

      try {
        await navigator.clipboard.writeText(
          url.toString()
        );

        showMessage("Portfolio link copied!");
      } catch {
        window.prompt(
          "Copy your portfolio link:",
          url.toString()
        );
      }
    });
  }

  function initializePortfolio() {
    setupShareButton();
    loadPublicPortfolio();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializePortfolio
    );
  } else {
    initializePortfolio();
  }
})();
