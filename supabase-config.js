/* ════════════════════════════════════════════════════════════
   SUPABASE CONFIGURATION
   ----------------------------------------------------------------
   1. Create a free project at https://supabase.com
   2. Run the SQL in /supabase/schema.sql inside your project's
      SQL editor (Supabase dashboard → SQL Editor → New query).
   3. Go to Project Settings → API and copy:
        - "Project URL"      → paste into SUPABASE_URL below
        - "anon public" key  → paste into SUPABASE_ANON_KEY below
   4. Save this file. That's it — both the public website
      (index.html) and the internal forms tool
      (everyday-advocates-lessons_learned_forms.html) read this
      file to talk to your database.

   NOTE: The "anon" key is safe to expose in client-side code —
   it only allows the actions permitted by the Row Level Security
   policies defined in schema.sql (insert-only, no read/update).
═══════════════════════════════════════════════════════════════ */

const SUPABASE_URL = 'https://lexmjvcsnugfsjegkfrb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxleG1qdmNzbnVnZnNqZWdrZnJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzQzOTIsImV4cCI6MjA5NjkxMDM5Mn0.LXYV1zl26RvH8PPTd6gQF0zSerXvfQiK9bhjTJ_BWfk';

(function () {
  const isConfigured =
    SUPABASE_URL && !SUPABASE_URL.startsWith('YOUR_') &&
    SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.startsWith('YOUR_');

  if (isConfigured && window.supabase && typeof window.supabase.createClient === 'function') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    window.supabaseClient = null;
    console.warn(
      'Supabase is not configured yet. Forms will not be able to save data.\n' +
      'Open supabase-config.js and add your Project URL and anon key.\n' +
      'See /supabase/schema.sql for the required database setup.'
    );
  }
})();
