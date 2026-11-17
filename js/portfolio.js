
/* UniSkill Hub - Portfolio Supabase Integration */

(function () {
  "use strict";

  const sections = {
    projects: {
      table: "portfolio_projects",
      form: "projectForm",
      container: "portfolioProjects",
      fields: {
        projectTitle: "title",
        projectDescription: "description",
        projectTechnology: "technologies",
        projectLink: "project_url"
      }
    },
    certificates: {
      table: "portfolio_certificates",
      form: "certificateForm",
      container: "portfolioCertificates",
      fields: {
        certificateTitle: "title",
        certificateIssuer: "issuer",
        certificateDate: "issue_date",
        certificateLink: "certificate_url"
      }
    },
    experience: {
      table: "portfolio_experience",
      form: "experienceForm",
      container: "portfolioExperience",
      fields: {
        experienceRole: "role",
        experienceCompany: "company",
        experiencePeriod: "period",
        experienceDescription: "description"
      }
    }
  };

  function getClient() {
    return window.supabaseClient;
  }

  async function getUser() {
    const client = getClient();
    if (!client) return null;

    const { data, error } = await client.auth.getUser();

    if (error) {
      console.error("Authentication error:", error);
      return null;
    }

    return data.user;
  }

  function showMessage(message) {
    alert(message);
  }

  window.togglePortfolioForm = function (id) {
    const form = document.getElementById(id);
    if (!form) return;

    const isHidden =
      window.getComputedStyle(form).display === "none";

    form.style.display = isHidden ? "grid" : "none";
  };

  function element(tag, text, className) {
    const node = document.createElement(tag);

    if (text !== undefined && text !== null) {
      node.textContent = String(text);
    }

    if (className) {
      node.className = className;
    }

    return node;
  }

  function appendText(parent, tag, value) {
    if (value) {
      parent.appendChild(element(tag, value));
    }
  }

  function appendLink(parent, url) {
    if (!url) return;

    try {
      const parsed = new URL(url);

      if (!["https:", "http:"].includes(
        parsed.protocol
      )) return;

      const link = element("a", "View Details");
      link.href = parsed.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      parent.appendChild(link);
    } catch {
      console.warn("Invalid portfolio URL");
    }
  }

  function renderCard(type, item) {
    const card = element(
      "div", undefined, "portfolio-card"
    );

    if (type === "projects") {
      appendText(card, "h3", item.title);
      appendText(card, "p", item.description);

      if (item.technologies) {
        card.appendChild(element(
          "span",
          item.technologies,
          "portfolio-tag"
        ));
      }

      appendLink(card, item.project_url);
    }

    if (type === "certificates") {
      appendText(card, "h3", item.title);
      appendText(card, "p", item.issuer);
      appendText(
        card, "p", item.issue_date
      );
      appendLink(card, item.certificate_url);
    }

    if (type === "experience") {
      appendText(card, "h3", item.role);
      appendText(card, "p", item.company);
      appendText(card, "p", item.period);
      appendText(card, "p", item.description);
    }

    const actions = element(
      "div", undefined, "portfolio-actions"
    );

    const deleteButton = element(
      "button",
      "Delete",
      "btn btn-outline btn-sm"
    );

    deleteButton.type = "button";

    deleteButton.addEventListener(
      "click",
      async function () {
        if (!confirm("Delete this item?")) return;

        const user = await getUser();

        if (!user) {
          showMessage("Please log in first.");
          return;
        }

        const client = getClient();

        const { error } = await client
          .from(sections[type].table)
          .delete()
          .eq("id", item.id)
          .eq("user_id", user.id);

        if (error) {
          console.error(error);
          showMessage("Delete failed: " + error.message);
          return;
        }

        await loadSection(type);
      }
    );

    actions.appendChild(deleteButton);
    card.appendChild(actions);

    return card;
  }

  async function loadSection(type) {
    const config = sections[type];

    const container = document.getElementById(
      config.container
    );

    if (!container) return;

    container.replaceChildren();
    container.appendChild(
      element("p", "Loading...", "portfolio-empty")
    );

    const user = await getUser();

    if (!user) {
      container.replaceChildren(
        element(
          "p",
          "Please log in to manage your portfolio.",
          "portfolio-empty"
        )
      );
      return;
    }

    const client = getClient();

    const { data, error } = await client
      .from(config.table)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false
      });

    container.replaceChildren();

    if (error) {
      console.error(error);

      container.appendChild(
        element(
          "p",
          "Unable to load portfolio: " + error.message,
          "portfolio-empty"
        )
      );
      return;
    }

    if (!data || data.length === 0) {
      container.appendChild(
        element(
          "p",
          "No items added yet.",
          "portfolio-empty"
        )
      );
      return;
    }

    data.forEach(item => {
      container.appendChild(
        renderCard(type, item)
      );
    });
  }

  async function saveSection(type, event) {
    event.preventDefault();

    const user = await getUser();

    if (!user) {
      showMessage(
        "Please log in with your Supabase account."
      );
      return;
    }

    const config = sections[type];
    const form = document.getElementById(
      config.form
    );

    const record = {
      user_id: user.id
    };

    for (const [inputId, column] of
      Object.entries(config.fields)) {

      const input = document.getElementById(
        inputId
      );

      let value = input
        ? input.value.trim() : "";

      if (!value) value = null;

      // Convert YYYY-MM to YYYY-MM-01
      if (column === "issue_date" && value) {
        value += "-01";
      }

      record[column] = value;
    }

    const client = getClient();

    const submitButton = form.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const { error } = await client
        .from(config.table)
        .insert(record);

      if (error) throw error;

      form.reset();
      form.style.display = "none";

      await loadSection(type);

      showMessage("Portfolio item saved successfully!");
    } catch (error) {
      console.error(error);

      showMessage(
        "Unable to save: " + error.message
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  }

  function initialize() {
    Object.entries(sections).forEach(
      ([type, config]) => {
        const form = document.getElementById(
          config.form
        );

        if (!form) return;

        form.addEventListener(
          "submit",
          event => saveSection(type, event)
        );

        loadSection(type);
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
