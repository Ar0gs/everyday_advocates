/* ════════════════════════════════════════════════════════════
   EVERYDAY ADVOCATES — STAFF PORTAL AUTH
   Handles sign in, request-access sign up, and routing based on
   the signed-in user's approval status in the "staff" table.
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Theme toggle (same pattern as the main site) ── */
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const THEME_KEY = 'ea-theme';

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', theme === 'dark');
  }
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

  /* ── Tabs ── */
  const tabs = document.querySelectorAll('.auth-tab');
  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');
  const authHeading = document.getElementById('authHeading');
  const authSubheading = document.getElementById('authSubheading');
  const messageEl = document.getElementById('authMessage');

  const COPY = {
    signin: { heading: 'Welcome back', sub: 'Sign in with the account your admin set up for you.' },
    signup: { heading: 'Request access', sub: 'Tell us who you are — an admin will review and approve your account.' }
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.toggle('active', t === tab));
      const isSignin = tab.dataset.tab === 'signin';
      signinForm.classList.toggle('hidden', !isSignin);
      signupForm.classList.toggle('hidden', isSignin);
      authHeading.textContent = COPY[tab.dataset.tab].heading;
      authSubheading.textContent = COPY[tab.dataset.tab].sub;
      hideMessage();
    });
  });

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'auth-message visible ' + type;
  }
  function hideMessage() {
    messageEl.className = 'auth-message';
  }

  function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.querySelector('.btn-text').style.display = loading ? 'none' : 'inline';
    btn.querySelector('.btn-loading').style.display = loading ? 'inline' : 'none';
  }

  function client() {
    if (!window.supabaseClient) {
      showMessage('Supabase isn\u2019t configured yet. Please set up supabase-config.js first.', 'error');
      return null;
    }
    return window.supabaseClient;
  }

  /* ── Route a signed-in user based on staff.status ── */
  async function routeSignedInUser(supabase, user, { silentIfPending = false } = {}) {
    const { data: staffRow, error } = await supabase
      .from('staff')
      .select('full_name, role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !staffRow) {
      showMessage('We couldn\u2019t find a staff record for this account. Please contact an admin.', 'error');
      await supabase.auth.signOut();
      return;
    }

    if (staffRow.status === 'active') {
      window.location.href = staffRow.role === 'admin' ? 'admin-dashboard.html' : 'staff-dashboard.html';
      return;
    }

    if (staffRow.status === 'pending') {
      showMessage('Your account is awaiting approval from an admin. You\u2019ll be able to sign in once it\u2019s approved.', 'success');
    } else if (staffRow.status === 'suspended') {
      showMessage('This account\u2019s access has been suspended. Please contact an admin if you think this is a mistake.', 'error');
    }
    await supabase.auth.signOut();
  }

  /* ── Sign in ── */
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();
    const supabase = client();
    if (!supabase) return;

    const btn = document.getElementById('signinBtn');
    setLoading(btn, true);

    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await routeSignedInUser(supabase, data.user);
    } catch (err) {
      showMessage(err.message || 'Sign in failed. Please check your details and try again.', 'error');
    } finally {
      setLoading(btn, false);
    }
  });

  /* ── Request access (sign up) ── */
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();
    const supabase = client();
    if (!supabase) return;

    const btn = document.getElementById('signupBtn');
    setLoading(btn, true);

    const fullName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (error) throw error;

      signupForm.reset();
      if (data.session) {
        // Email confirmation disabled — account exists immediately but pending approval
        showMessage('Request submitted! Your account is pending approval from an admin. You\u2019ll be able to sign in once it\u2019s approved.', 'success');
        await supabase.auth.signOut();
      } else {
        showMessage('Almost there — please check your email to confirm your address. Once confirmed, your request will be pending approval from an admin.', 'success');
      }
    } catch (err) {
      showMessage(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(btn, false);
    }
  });

  /* ── If already signed in, route immediately ── */
  (async function checkExistingSession() {
    const supabase = client();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (data.session && data.session.user) {
      await routeSignedInUser(supabase, data.session.user, { silentIfPending: true });
    }
  })();
})();
