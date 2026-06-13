-- ════════════════════════════════════════════════════════════
-- EVERYDAY ADVOCATES — SUPABASE SCHEMA
-- ----------------------------------------------------------------
-- Run this whole file in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).
--
-- It creates:
--   1. enquiries           – submissions from the public website's
--                             "Contact" enquiry form
--   2. form_submissions     – submissions from the internal
--                             operations forms toolkit (Consultation
--                             Notes, Client Profile, Session Summary,
--                             Incident Log, Timesheet, Service
--                             Agreement, Feedback, Lessons Learned,
--                             and the staff copy of the Enquiry form)
--
-- Row Level Security (RLS) is enabled on both tables. The "anon"
-- key used in the browser is only granted INSERT — it cannot read,
-- update or delete data. Use the Supabase Table Editor (logged in
-- as the project owner) or a service-role key on a trusted backend
-- to view/manage submissions.
-- ════════════════════════════════════════════════════════════

-- ── 1. PUBLIC WEBSITE ENQUIRY FORM ──────────────────────────────
create table if not exists public.enquiries (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  name             text not null,
  email            text not null,
  phone            text,
  enquirer_type    text,        -- family / self / professional / other
  service_interest text,        -- companionship / admin / tech / transitions / futures / general
  message          text not null,
  consent          boolean not null default false,
  status           text not null default 'new'  -- new / contacted / closed (managed internally)
);

alter table public.enquiries enable row level security;

-- Allow anyone (anon key) to submit an enquiry
create policy "Public can submit enquiries"
  on public.enquiries
  for insert
  to anon
  with check (true);

-- (Optional) Allow authenticated staff to read/manage enquiries
create policy "Authenticated staff can view enquiries"
  on public.enquiries
  for select
  to authenticated
  using (true);

create policy "Authenticated staff can update enquiries"
  on public.enquiries
  for update
  to authenticated
  using (true);


-- ── 2. INTERNAL OPERATIONS FORMS (generic store) ────────────────
-- One flexible table for every form in the internal toolkit.
-- "form_type" identifies which form was submitted, "form_ref" is
-- the printed reference code (e.g. EA-ENQ-001), and "data" stores
-- the full set of field answers as JSON, keyed by the form's
-- field labels — so new fields/forms never require a migration.
create table if not exists public.form_submissions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  form_type   text not null,   -- e.g. 'Enquiry Form', 'Timesheet', 'Incident Log'...
  form_ref    text,            -- e.g. 'EA-ENQ-001'
  data        jsonb not null   -- all field label/value pairs
);

alter table public.form_submissions enable row level security;

-- Allow anyone with the anon key to submit (the internal toolkit is
-- a client-side page; restrict access to it at the hosting/network
-- level if it should not be publicly reachable)
create policy "Anyone can submit operational forms"
  on public.form_submissions
  for insert
  to anon
  with check (true);

create policy "Authenticated staff can view form submissions"
  on public.form_submissions
  for select
  to authenticated
  using (true);

-- Helpful index for filtering by form type in the dashboard
create index if not exists form_submissions_type_idx
  on public.form_submissions (form_type, created_at desc);

create index if not exists enquiries_created_idx
  on public.enquiries (created_at desc);
