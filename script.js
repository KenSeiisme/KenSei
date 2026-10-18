(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const themes = {
    hero: { primary: "rgba(244, 114, 182, 0.16)", secondary: "rgba(168, 85, 247, 0.11)" },
    about: { primary: "rgba(167, 139, 250, 0.16)", secondary: "rgba(236, 72, 153, 0.10)" },
    stack: { primary: "rgba(52, 211, 153, 0.13)", secondary: "rgba(45, 212, 191, 0.10)" },
    projects: { primary: "rgba(244, 63, 94, 0.14)", secondary: "rgba(192, 132, 252, 0.11)" },
  };

  const primaryTransform = {
    hero: "translate(-50%, 0) scale(1)",
    about: "translate(-55%, 8%) scale(1.05)",
    stack: "translate(-45%, 10%) scale(0.95)",
    projects: "translate(-52%, 14%) scale(1.08)",
  };

  const secondaryTransform = {
    hero: "translate(0, 0) scale(1)",
    about: "translate(-10%, -12%) scale(1.1)",
    stack: "translate(-22%, -15%) scale(0.95)",
    projects: "translate(0, 0) scale(1)",
  };

  const sections = ["hero", "about", "stack", "projects"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const glowPrimary = document.getElementById("glowPrimary");
  const glowSecondary = document.getElementById("glowSecondary");
  const progressBar = document.getElementById("scrollProgress");
  const navLinks = Array.from(document.querySelectorAll("[data-nav]"));
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileNavLinks = Array.from(document.querySelectorAll("[data-mobile-nav]"));
  const root = document.documentElement;

  let activeTheme = "";
  let pointerX = 0;
  let pointerY = 0;
  let scrollScheduled = false;
  let glowScheduled = false;

  function applyGlow(themeName) {
    if (!glowPrimary || !glowSecondary) return;

    const key = primaryTransform[themeName] ? themeName : "hero";
    const dx = pointerX * 26;
    const dy = pointerY * 22;

    glowPrimary.style.transform = `${primaryTransform[key]} translate3d(${dx}px, ${dy}px, 0)`;
    glowSecondary.style.transform = `${secondaryTransform[key]} translate3d(${-dx * 0.7}px, ${-dy * 0.7}px, 0)`;
  }

  function updateBackgroundTheme() {
    if (!sections.length) return;

    const viewportCenter = window.scrollY + window.innerHeight * 0.45;
    let closestSection = sections[0];
    let shortestDistance = Infinity;

    sections.forEach((section) => {
      const sectionCenter = section.offsetTop + section.offsetHeight / 2;
      const distance = Math.abs(viewportCenter - sectionCenter);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestSection = section;
      }
    });

    const themeName = closestSection.id;
    if (themeName === activeTheme) return;

    activeTheme = themeName;
    const theme = themes[themeName] || themes.hero;
    root.style.setProperty("--glow-primary", theme.primary);
    root.style.setProperty("--glow-secondary", theme.secondary);
    applyGlow(themeName);
  }

  function updateProgress() {
    if (!progressBar) return;
    const max = root.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    progressBar.style.transform = `scaleX(${ratio})`;
  }

  function updateActiveNav() {
    if (!sections.length || !navLinks.length) return;
    const marker = window.scrollY + window.innerHeight * 0.35;
    let current = sections[0].id;

    sections.forEach((section) => {
      if (section.offsetTop <= marker) current = section.id;
    });
    navLinks.forEach((link) => link.classList.toggle("is-active", link.dataset.nav === current));
  }

  function onScrollFrame() {
    scrollScheduled = false;
    updateBackgroundTheme();
    updateProgress();
    updateActiveNav();
  }

  function scheduleScroll() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    window.requestAnimationFrame(onScrollFrame);
  }

  function scheduleGlow() {
    if (glowScheduled) return;
    glowScheduled = true;
    window.requestAnimationFrame(() => {
      glowScheduled = false;
      applyGlow(activeTheme || "hero");
    });
  }

  function setMobileMenu(open) {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    mobileMenu.classList.toggle("is-open", open);
  }

  window.addEventListener("scroll", scheduleScroll, { passive: true });
  window.addEventListener("resize", scheduleScroll);
  window.addEventListener("load", scheduleScroll);

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      setMobileMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });
    mobileNavLinks.forEach((link) => link.addEventListener("click", () => setMobileMenu(false)));
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 640) setMobileMenu(false);
    });
  }

  if (finePointer && !reduceMotion) {
    window.addEventListener("pointermove", (event) => {
      pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      pointerY = (event.clientY / window.innerHeight) * 2 - 1;
      scheduleGlow();
    }, { passive: true });
  }

  const revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((element) => revealObserver.observe(element));
  }

  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--x", `${event.clientX - rect.left}px`);
        card.style.setProperty("--y", `${event.clientY - rect.top}px`);
      }, { passive: true });
      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--x");
        card.style.removeProperty("--y");
      });
    });
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  updateBackgroundTheme();
  updateProgress();
  updateActiveNav();
  applyGlow(activeTheme || "hero");
})();
