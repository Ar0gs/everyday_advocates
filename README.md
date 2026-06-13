# Everyday Advocates — Website & Internal Forms Toolkit

This package completes the build: the public website (`index.html` +
`styles.css`, already designed) is now fully interactive, and both it
and the internal operations forms toolkit are connected to a
Supabase backend.

## What's included

| File | Purpose |
|---|---|
| `index.html` | Public 6-page website (Home, About, Services, How It Works, FAQs, Contact) |
| `styles.css` | All styling, light & dark themes |
| `app.js` | **New** — page navigation, dark/light mode toggle, mobile menu, scroll progress bar, reveal animations, FAQ accordion, back-to-top, and the Contact page enquiry form |
| `everyday-advocates-lessons_learned_forms.html` | Internal staff toolkit: Enquiry, Consultation Notes, Client Profile, Session Summary, Incident Log, Timesheet, Service Agreement, Feedback, Lessons Learned |
| `forms-app.js` | **New** — saves any of the 9 internal forms to Supabase with one click |
| `supabase-config.js` | **New** — your Supabase project credentials (one place for both files) |
| `supabase/schema.sql` | **New** — database setup script |

## 1. Set up Supabase (5 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. In your project, go to **SQL Editor → New query**, paste the
   contents of `supabase/schema.sql`, and click **Run**. This creates:
   - `enquiries` — submissions from the website's Contact form
   - `form_submissions` — submissions from the internal forms toolkit
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** API key
4. Open `supabase-config.js` and paste these into:
   ```js
   const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```
5. Save. Both `index.html` and the forms toolkit will now save to
   your database automatically.

> The anon key is safe to use in the browser — the SQL script's Row
> Level Security policies only allow it to **insert** new rows, never
> read, edit, or delete existing data.

## 2. View submitted data

In Supabase, go to **Table Editor**:
- `enquiries` — every Contact form submission from the website
  (name, email, phone, who they are, service of interest, message).
- `form_submissions` — every internal form save, with `form_type`
  (e.g. "Timesheet", "Incident Log"), `form_ref` (e.g. EA-TS-001),
  and a `data` column containing every field the staff member filled
  in, stored as JSON keyed by the field's label — so it reads exactly
  like the printed form.

You can also build a simple internal dashboard later by querying
these two tables (e.g. with a Supabase view, or a small admin page).

## 3. Run the site

These are static files — no build step required.

- **Locally:** open `index.html` directly in a browser, or run
  `npx serve .` from this folder for a local server (recommended,
  since some browsers restrict `fetch`/module behaviour on `file://`).
- **Deploy:** upload the whole folder to any static host (Netlify,
  Vercel, Cloudflare Pages, GitHub Pages, etc.). No environment
  variables needed — credentials live in `supabase-config.js`.

## 4. What `app.js` does on the public site

- **Navigation** — all `data-page` links switch between the 6 pages
  instantly (single-page experience), update the browser URL hash,
  and update the page `<title>`.
- **Dark / light mode** — the toggle in the navbar switches themes
  and remembers the choice (and respects the visitor's OS preference
  on first visit).
- **Mobile menu** — the navbar collapses to a hamburger button below
  the tablet breakpoint, opening a full slide-in menu with an overlay.
- **Scroll progress bar**, **reveal-on-scroll animations** for cards
  and sections, and a **back-to-top** button.
- **FAQ accordion** — click any question to expand/collapse its answer.
- **Contact form** — validates required fields, then inserts the
  enquiry into the `enquiries` table in Supabase. Shows the existing
  "Thank you" success panel or an error message if saving fails.

## 5. What `forms-app.js` does on the internal toolkit

Each of the 9 forms already has a primary action button (e.g. "Submit
Enquiry", "Save Notes", "Submit Timesheet"). Clicking it now:

1. Reads every field on that form (text fields, dropdowns, radio
   groups, checkbox groups, and the Timesheet's session-log table).
2. Saves it as one row in `form_submissions`, tagged with the form's
   name and reference code (e.g. `EA-TS-001`).
3. Shows a small confirmation toast at the bottom of the screen.

The "Print" buttons are unchanged and continue to use the browser's
print dialog.

## Notes

- This is a **non-regulated social support service**: the site
  copy and forms intentionally avoid implying medical, care, legal,
  or financial advice, per the brand document.
- If you'd like the site to send an **email notification** whenever a
  new enquiry comes in, this can be added with a Supabase Edge
  Function (or a service like Zapier/Make watching the `enquiries`
  table) — let me know and I can set that up.
