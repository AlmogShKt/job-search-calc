/* ======================================
   LaunchPad – Job Readiness Calculator
   Wizard State Machine & Scoring Logic
   ====================================== */

(function () {
  "use strict";

  // ── Score Configuration ──
  const SCORE_MAP = {
    intro_cs: { label: "מבוא למדעי המחשב", points: 20, category: "course" },
    data_structures: { label: "מבני נתונים", points: 30, category: "course" },
    algorithms: { label: "אלגוריתמים", points: 30, category: "course" },
    oop: { label: "OOP", points: 10, category: "course" },
    os: { label: "מערכות הפעלה", points: 15, category: "course" },
    networks: { label: "רשתות תקשורת", points: 5, category: "course" },
    databases: { label: "בסיסי נתונים", points: 0, category: "course" },
    software_engineering: {
      label: "הנדסת תוכנה",
      points: 0,
      category: "course",
    },
    compilation: { label: "קומפילציה", points: 0, category: "course" },
    architecture: { label: "ארכיטקטורת מחשבים", points: 0, category: "course" },
    personal_project: {
      label: "פרויקט אישי איכותי",
      points: 30,
      category: "extra",
    },
    leetcode: { label: "תרגול LeetCode עקבי", points: 40, category: "extra" },
  };

  const CRITICAL_COURSES = ["intro_cs", "data_structures", "algorithms"];
  const MAX_SCORE = 180;

  const SCORE_BANDS = [
    {
      min: 0,
      max: 40,
      label: "מוקדם מדי",
      cssClass: "score-band--red",
      color: "var(--danger)",
    },
    {
      min: 40,
      max: 80,
      label: "בבנייה, לא להגיש עדיין",
      cssClass: "score-band--orange",
      color: "var(--warning)",
    },
    {
      min: 80,
      max: 120,
      label: "להתכונן ברצינות",
      cssClass: "score-band--yellow",
      color: "#ca8a04",
    },
    {
      min: 120,
      max: 999,
      label: "להגיש בצורה אגרסיבית! 🚀",
      cssClass: "score-band--green",
      color: "var(--success)",
    },
  ];

  // ── Result Templates ──
  const RESULTS = {
    ready_and_preparing: {
      emoji: "🚀",
      title: "אתה במסלול הנכון!",
      messageClass: "message-box--success",
      message: `
        <p>מעולה! אתה עומד בדרישות הסף האקדמיות <strong>וגם</strong> מתרגל שאלות אלגוריתמיות.</p>
        <p>אתה במיקום מצוין – תמשיך לתרגל בצורה עקבית.</p>
      `,
      actionsTitle: "הפוקוס שלך עכשיו:",
      actions: [
        "הגשות ממוקדות למשרות רלוונטיות",
        "שיפור קורות חיים – תוצאות ומספרים",
        "Networking – לינקדאין, מיטאפים, הכרויות",
        "המשך תרגול LeetCode יומי",
      ],
      cta: true,
    },
    academically_ready_not_interview_ready: {
      emoji: "⚠️",
      title: "עומד בסף – אבל לא מוכן לראיונות",
      messageClass: "message-box--warning",
      message: `
        <p>אתה עומד/ת בדרישות הסף האקדמיות – אבל בלי תרגול אלגוריתמי, הסיכוי להצליח בראיונות נמוך.</p>
        <p>אם תתחיל להגיש עכשיו בלי הכנה:</p>
        <ul style="margin: 0.5rem 0; padding-inline-start: 1.5rem;">
          <li>תיכשל בראיונות</li>
          <li>תצבור תסכול</li>
          <li>תבזבז הזדמנויות טובות</li>
        </ul>
      `,
      actionsTitle: "📋 ההמלצה שלנו:",
      actions: [
        "עצור 4–6 שבועות לפני שמתחיל להגיש",
        "בנה שגרת תרגול יומית – Easy → Medium",
        "התחל מ-Blind 75 או NeetCode 150",
        "ורק אז – הגשות אגרסיביות",
      ],
      cta: true,
    },
    finish_courses_then_apply: {
      emoji: "📘",
      title: "מעולה שיש לך פרויקט!",
      messageClass: "message-box--info",
      message: `
        <p>יש לך פרויקט אישי – זה יתרון אמיתי 👍</p>
        <p>אבל בלי קורסי הליבה הקריטיים, רוב החברות לא יתקדמו איתך בתהליך.</p>
      `,
      actionsTitle: "הפוקוס שלך עכשיו:",
      actions: [
        "סיים את קורסי הליבה (מבני נתונים + אלגוריתמים)",
        "הבן מבני נתונים לעומק – לא רק לעבור מבחן",
        "התחל בהדרגה תרגול שאלות",
        "שפר את הפרויקט – הוסף README, טסטים, תיעוד",
      ],
      cta: true,
    },
    build_foundations_and_project: {
      emoji: "🔥",
      title: "הזמן לבנות יסודות!",
      messageClass: "message-box--danger",
      message: `
        <p>אתה בשלב מוקדם – אבל זה בסדר גמור. כולם התחילו מפה.</p>
        <p>זה הזמן האידיאלי לבנות פרויקט אישי רציני.</p>
      `,
      actionsTitle: "🎯 פרויקט אישי ייתן לך:",
      actions: [
        "ניסיון מעשי אמיתי בפיתוח",
        "מה לשים בקורות חיים",
        "ביטחון עצמי בראיון",
        "יתרון מול סטודנטים אחרים",
        "סיים קורסי ליבה במקביל!",
      ],
      cta: true,
    },
  };

  // ── App State ──
  let state = {
    currentScreen: "gate",
    selectedCourses: [],
    courseStatus: null, // 'meets_threshold' | 'not_ready_courses'
    leetcodeStatus: null, // 'practicing' | 'not_practicing'
    projectStatus: null, // 'has_project' | 'no_project'
    readyLevel: null,
    criticalCount: 0,
  };

  // ── DOM References ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const screens = {
    gate: $("#screen-gate"),
    nontech: $("#screen-nontech"),
    courses: $("#screen-courses"),
    "path-a": $("#screen-path-a"),
    "path-b": $("#screen-path-b"),
    result: $("#screen-result"),
    score: $("#screen-score"),
  };

  const progressFill = $("#progressFill");
  const progressSteps = $$(".progress-step");
  const progressContainer = $("#progressContainer");

  // ── Analytics Helper ──
  function trackEvent(eventName, params) {
    if (typeof gtag === "function") {
      gtag("event", eventName, params);
    }
  }

  // ── Screen Management ──
  function showScreen(name) {
    // Hide all screens
    Object.values(screens).forEach((s) => {
      s.classList.remove("screen--active");
    });

    // Show target
    const target = screens[name];
    if (target) {
      // Force re-trigger animation
      target.style.animation = "none";
      target.offsetHeight; // force reflow
      target.style.animation = "";
      target.classList.add("screen--active");
    }

    state.currentScreen = name;
    updateProgress(name);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Track screen view
    trackEvent("wizard_step", {
      screen_name: name,
      event_category: "wizard_progress",
    });
  }

  function updateProgress(screenName) {
    const progressMap = {
      gate: { step: 1, fill: "10%" },
      nontech: { step: 1, fill: "10%", hide: true },
      courses: { step: 1, fill: "33%" },
      "path-a": { step: 2, fill: "66%" },
      "path-b": { step: 2, fill: "66%" },
      result: { step: 3, fill: "100%" },
      score: { step: 3, fill: "100%" },
    };

    const p = progressMap[screenName];
    if (!p) return;

    if (p.hide) {
      progressContainer.classList.add("hidden");
      return;
    }
    progressContainer.classList.remove("hidden");

    progressFill.style.width = p.fill;

    progressSteps.forEach((stepEl) => {
      const stepNum = parseInt(stepEl.dataset.step);
      stepEl.classList.remove("active", "done");
      if (stepNum < p.step) stepEl.classList.add("done");
      if (stepNum === p.step) stepEl.classList.add("active");
    });
  }

  // ── Gate Logic ──
  function handleGate(isTechStudent) {
    trackEvent("gate_answer", {
      is_tech_student: isTechStudent,
      event_category: "wizard_interaction",
    });
    if (isTechStudent) {
      showScreen("courses");
    } else {
      showScreen("nontech");
    }
  }

  // ── Courses Logic ──
  function handleCourses() {
    const checked = Array.from($$('input[name="course"]:checked')).map(
      (c) => c.value,
    );
    state.selectedCourses = checked;

    const criticalChecked = CRITICAL_COURSES.filter((c) => checked.includes(c));
    state.criticalCount = criticalChecked.length;

    trackEvent("courses_selected", {
      courses: checked.join(","),
      course_count: checked.length,
      critical_count: criticalChecked.length,
      event_category: "wizard_interaction",
    });

    if (criticalChecked.length === CRITICAL_COURSES.length) {
      state.courseStatus = "meets_threshold";
      showScreen("path-a");
    } else {
      state.courseStatus = "not_ready_courses";

      // Show "almost there" message if 2/3 critical courses done
      const almostMsg = $("#almostThereMsg");
      if (criticalChecked.length === 2) {
        almostMsg.style.display = "block";
        // Update title to be softer
        $("#pathBTitle").textContent = "כמעט שם! חסר עוד קורס אחד";
        $("#pathBEmoji").textContent = "💪";
      } else {
        almostMsg.style.display = "none";
        $("#pathBTitle").textContent = "עדיין לא מומלץ להגיש";
        $("#pathBEmoji").textContent = "⚠️";
      }

      showScreen("path-b");
    }
  }

  // ── LeetCode Logic ──
  function handleLeetcode(isPracticing) {
    trackEvent("leetcode_answer", {
      is_practicing: isPracticing,
      event_category: "wizard_interaction",
    });
    state.leetcodeStatus = isPracticing ? "practicing" : "not_practicing";
    state.readyLevel = isPracticing
      ? "ready_and_preparing"
      : "academically_ready_not_interview_ready";
    renderResult();
    showScreen("result");
  }

  // ── Project Logic ──
  function handleProject(hasProject) {
    trackEvent("project_answer", {
      has_project: hasProject,
      event_category: "wizard_interaction",
    });
    state.projectStatus = hasProject ? "has_project" : "no_project";
    state.readyLevel = hasProject
      ? "finish_courses_then_apply"
      : "build_foundations_and_project";
    renderResult();
    showScreen("result");
  }

  // ── Render Result ──
  function renderResult() {
    const config = RESULTS[state.readyLevel];
    if (!config) return;

    trackEvent("result_shown", {
      ready_level: state.readyLevel,
      courses_selected: state.selectedCourses.join(","),
      event_category: "wizard_result",
    });

    $("#resultEmoji").textContent = config.emoji;
    $("#resultTitle").textContent = config.title;

    const msgBox = $("#resultMessage");
    msgBox.className = "message-box result-message " + config.messageClass;
    msgBox.innerHTML = config.message;

    const actionsContainer = $("#resultActions");
    actionsContainer.innerHTML = `
      <h3>${config.actionsTitle}</h3>
      <ul>
        ${config.actions.map((a) => `<li>${a}</li>`).join("")}
      </ul>
      ${
        config.cta
          ? `
      <a href="https://www.univeli.com/course/prepare-me-for-high-tech" target="_blank" rel="noopener" class="ad-banner">
        <img src="assets/banner.jpg" alt="Zero To Hero – קורס הכנה להייטק" class="ad-banner-img" />
        <div class="ad-banner-content">
          <span class="ad-banner-badge">קורס מלא</span>
          <p class="ad-banner-title">רוצה לדעת בדיוק איך להתכונן נכון?</p>
          <p class="ad-banner-social">⭐ מעל 160 סטודנטים כבר רכשו</p>
          <p class="ad-banner-sub">לקורס המלא →</p>
        </div>
      </a>
      <a href="https://linktr.ee/AlmogZeroToHero" target="_blank" rel="noopener" class="community-link">
        👥 הצטרפו לקהילה שלנו – טיפים, שיתוף ותמיכה
      </a>
      `
          : ""
      }
    `;
  }

  // ── Scoring ──
  function computeScore() {
    const scores = {};
    let total = 0;

    // Course scores
    Object.keys(SCORE_MAP).forEach((key) => {
      const item = SCORE_MAP[key];
      let earned = 0;

      if (item.category === "course") {
        earned = state.selectedCourses.includes(key) ? item.points : 0;
      } else if (key === "personal_project") {
        earned = state.projectStatus === "has_project" ? item.points : 0;
      } else if (key === "leetcode") {
        earned = state.leetcodeStatus === "practicing" ? item.points : 0;
      }

      scores[key] = { ...item, earned };
      total += earned;
    });

    return { scores, total };
  }

  function renderScoreScreen() {
    const { scores, total } = computeScore();

    // Animate gauge
    const gaugeFill = $("#gaugeFill");
    const gaugeValue = $("#gaugeValue");
    const scoreBand = $("#scoreBand");

    const ratio = Math.min(total / MAX_SCORE, 1);
    const arcLength = 251; // approximate arc length of the SVG path
    const offset = arcLength * (1 - ratio);

    // Determine band
    const band =
      SCORE_BANDS.find((b) => total >= b.min && total < b.max) ||
      SCORE_BANDS[SCORE_BANDS.length - 1];

    trackEvent("score_viewed", {
      score: total,
      max_score: MAX_SCORE,
      score_percent: Math.round((total / MAX_SCORE) * 100),
      band_label: band.label,
      event_category: "wizard_result",
    });

    // Animate after a brief delay for effect
    requestAnimationFrame(() => {
      gaugeFill.style.strokeDashoffset = offset;
      gaugeFill.style.stroke = band.color;
    });

    // Animate counter
    animateCounter(gaugeValue, 0, total, 1000);

    scoreBand.textContent = band.label;
    scoreBand.className = "score-band " + band.cssClass;

    // Render breakdown
    const breakdown = $("#scoreBreakdown");
    const scorableItems = Object.entries(scores).filter(
      ([, v]) => v.points > 0,
    );

    breakdown.innerHTML = scorableItems
      .map(([key, item]) => {
        const pct = item.points > 0 ? (item.earned / item.points) * 100 : 0;
        const inactive = item.earned === 0 ? " score-row--inactive" : "";
        return `
          <div class="score-row${inactive}">
            <span class="score-row-label">${item.label}</span>
            <div class="score-row-bar">
              <div class="score-row-bar-fill" style="width: 0%;" data-target="${pct}"></div>
            </div>
            <span class="score-row-value">${item.earned} / ${item.points}</span>
          </div>
        `;
      })
      .join("");

    // Animate bars after render
    requestAnimationFrame(() => {
      setTimeout(() => {
        breakdown.querySelectorAll(".score-row-bar-fill").forEach((bar) => {
          bar.style.width = bar.dataset.target + "%";
        });
      }, 100);
    });
  }

  function animateCounter(element, from, to, duration) {
    const start = performance.now();
    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      element.textContent = current;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  // ── Reset ──
  function resetWizard() {
    trackEvent("wizard_reset", {
      from_screen: state.currentScreen,
      event_category: "wizard_interaction",
    });
    state = {
      currentScreen: "gate",
      selectedCourses: [],
      courseStatus: null,
      leetcodeStatus: null,
      projectStatus: null,
      readyLevel: null,
      criticalCount: 0,
    };

    // Uncheck all checkboxes
    $$('input[name="course"]').forEach((cb) => (cb.checked = false));

    // Reset gauge
    const gaugeFill = $("#gaugeFill");
    if (gaugeFill) {
      gaugeFill.style.strokeDashoffset = 251;
    }

    showScreen("gate");
  }

  // ── Theme Toggle ──
  function initTheme() {
    const saved = localStorage.getItem("launchpad-theme");
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      // Default to dark
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("launchpad-theme", next);
  }

  // ── Event Delegation ──
  function initEvents() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;

      switch (action) {
        case "gate-yes":
          handleGate(true);
          break;
        case "gate-no":
          handleGate(false);
          break;
        case "submit-courses":
          handleCourses();
          break;
        case "leetcode-yes":
          handleLeetcode(true);
          break;
        case "leetcode-no":
          handleLeetcode(false);
          break;
        case "project-yes":
          handleProject(true);
          break;
        case "project-no":
          handleProject(false);
          break;
        case "show-score":
          renderScoreScreen();
          showScreen("score");
          break;
        case "back-to-result":
          showScreen("result");
          break;
        case "reset":
          resetWizard();
          break;
      }
    });

    // Theme toggle
    $("#themeToggle").addEventListener("click", toggleTheme);

    // Track banner & community link clicks
    document.addEventListener("click", (e) => {
      const banner = e.target.closest(".ad-banner, .header-banner");
      if (banner) {
        trackEvent("banner_click", {
          banner_location: banner.closest(".header-banner-wrap")
            ? "header"
            : banner.closest('[data-screen="nontech"]')
              ? "nontech"
              : banner.closest('[data-screen="path-b"]')
                ? "path_b"
                : banner.closest('[data-screen="result"]')
                  ? "result"
                  : "unknown",
          link_url: banner.href,
          event_category: "outbound_click",
        });
      }

      const community = e.target.closest(
        '.community-link, a[href*="linktr.ee"]',
      );
      if (community) {
        trackEvent("community_click", {
          link_url: community.href,
          click_location: state.currentScreen,
          event_category: "outbound_click",
        });
      }

      const footerLink = e.target.closest(".footer-link");
      if (footerLink) {
        trackEvent("footer_link_click", {
          link_url: footerLink.href,
          link_text: footerLink.textContent.trim(),
          event_category: "outbound_click",
        });
      }
    });
  }

  // ── Init ──
  function init() {
    initTheme();
    initEvents();
    updateProgress("gate");
  }

  // Boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
