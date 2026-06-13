/* ════════════════════════════════════════════════════════════
   EVERYDAY ADVOCATES — SITE SCRIPT
   Handles: SPA page routing, theme toggle, mobile nav, scroll
   progress, reveal animations, FAQ accordion, back-to-top, and
   the enquiry form (Supabase).
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── 1. THEME (LIGHT / DARK) ── */
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const THEME_KEY = 'ea-theme';

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', theme === 'dark');
  }

  // Respect saved preference, otherwise system preference
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  /* ── 2. MOBILE NAVIGATION ── */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');

  function closeMenu() {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    navOverlay.classList.remove('visible');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-locked');
  }

  function toggleMenu() {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    navOverlay.classList.toggle('visible', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('nav-locked', isOpen);
  }

  if (hamburger) hamburger.addEventListener('click', toggleMenu);
  if (navOverlay) navOverlay.addEventListener('click', closeMenu);

  /* ── 3. SPA PAGE ROUTING ── */
  const pages = document.querySelectorAll('.page');
  const navLinkEls = document.querySelectorAll('.nav-link, .nav-cta');

  const PAGE_TITLES = {
    home: 'Everyday Advocates — Later Life Support You Can Count On',
    about: 'About Us | Everyday Advocates',
    services: 'Our Services | Everyday Advocates',
    'how-it-works': 'How It Works | Everyday Advocates',
    faqs: 'FAQs | Everyday Advocates',
    contact: 'Contact Us | Everyday Advocates'
  };

  function showPage(name, opts = {}) {
    let found = false;
    pages.forEach((page) => {
      const match = page.id === `page-${name}`;
      page.classList.toggle('active', match);
      if (match) found = true;
    });
    if (!found) return false;

    navLinkEls.forEach((link) => {
      link.classList.toggle('active', link.dataset.page === name && link.classList.contains('nav-link'));
    });

    if (PAGE_TITLES[name]) document.title = PAGE_TITLES[name];

    if (!opts.skipScroll) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    closeMenu();
    refreshReveals();
    return true;
  }

  // Intercept any click on an element with data-page
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-page]');
    if (!target) return;
    const name = target.dataset.page;
    if (!name) return;
    e.preventDefault();
    if (showPage(name)) {
      history.pushState({ page: name }, '', `#${name}`);
    }
  });

  window.addEventListener('popstate', () => {
    const name = (location.hash || '#home').replace('#', '');
    showPage(name || 'home');
  });

  // Initial route from hash
  (function initRoute() {
    const name = (location.hash || '').replace('#', '');
    if (name) showPage(name, { skipScroll: true });
  })();

  /* ── 4. SCROLL PROGRESS BAR ── */
  const progressBar = document.getElementById('pageProgress');
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');

  function onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + '%';

    if (navbar) navbar.classList.toggle('scrolled', scrollTop > 12);
    if (backToTop) backToTop.classList.toggle('visible', scrollTop > 480);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── 5. REVEAL-ON-SCROLL ANIMATIONS ── */
  const revealSelector = '.reveal, .reveal-up, .reveal-right, .reveal-card';
  let revealObserver;

  function refreshReveals() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll(revealSelector).forEach((el) => el.classList.add('visible'));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    }
    document.querySelectorAll(revealSelector).forEach((el) => {
      if (!el.classList.contains('visible')) revealObserver.observe(el);
    });
  }
  refreshReveals();

  /* ── 6. FAQ ACCORDION ── */
  document.querySelectorAll('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });

  /* ── 7. ENQUIRY FORM → SUPABASE ── */
  const form = document.getElementById('enquiryForm');
  if (form) {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
    const btnLoading = submitBtn ? submitBtn.querySelector('.btn-loading') : null;
    const successEl = document.getElementById('cfSuccess');
    const errorEl = document.getElementById('cfError');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorEl) errorEl.style.display = 'none';
      if (successEl) successEl.style.display = 'none';

      // Basic validation (native + a quick check on consent)
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim() || null,
        enquirer_type: form.who.value || null,
        service_interest: form.service.value || null,
        message: form.message.value.trim(),
        consent: form.consent.checked
      };

      // Loading state
      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'inline';

      try {
        if (!window.supabaseClient) throw new Error('Supabase not configured');

        const { error } = await window.supabaseClient
          .from('enquiries')
          .insert([data]);

        if (error) throw error;

        form.reset();
        form.style.display = 'none';
        if (successEl) successEl.style.display = 'block';
      } catch (err) {
        console.error('Enquiry submission failed:', err);
        if (errorEl) errorEl.style.display = 'block';
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
      }
    });
  }

})();
