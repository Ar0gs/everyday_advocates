/* ════════════════════════════════════════════════════════════
   EVERYDAY ADVOCATES — INTERNAL FORMS TOOLKIT SCRIPT
   ----------------------------------------------------------------
   Generic, label-driven form capture. Every ".form-page" in
   everyday-advocates-lessons_learned_forms.html is read field by
   field (using each field's <label> text as the key) and saved as
   one JSON record per submission to the "form_submissions" table
   in Supabase (see /supabase/schema.sql).

   No per-form code is required — new fields/forms added to the
   HTML are picked up automatically as long as they follow the
   existing ".field" / ".radio-group" / ".check-group" / table
   patterns already used in the toolkit.
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Toast notification ── */
  function ensureToast() {
    let toast = document.getElementById('eaToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'eaToast';
      toast.className = 'ea-toast';
      document.body.appendChild(toast);
    }
    return toast;
  }

  function showToast(message, type) {
    const toast = ensureToast();
    toast.textContent = message;
    toast.className = 'ea-toast ea-toast-' + (type || 'info') + ' visible';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('visible'), 4200);
  }

  /* ── Helpers to read field values ── */

  // Get a field's question/label text, stripping the "*" required marker
  function labelText(el) {
    const label = el.querySelector(':scope > label');
    if (!label) return null;
    const clone = label.cloneNode(true);
    clone.querySelectorAll('.req').forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  // Text of a radio/checkbox option, excluding the input itself
  function optionText(labelEl) {
    const clone = labelEl.cloneNode(true);
    clone.querySelectorAll('input').forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function readField(fieldEl) {
    const key = labelText(fieldEl);
    if (!key) return null;

    // Radio group
    const radioGroup = fieldEl.querySelector(':scope > .radio-group, :scope .radio-group');
    if (radioGroup) {
      const checked = radioGroup.querySelector('input[type="radio"]:checked');
      const value = checked ? optionText(checked.closest('.radio-option') || checked.parentElement) : null;
      return [key, value];
    }

    // Checkbox group (multi-select)
    const checkGroup = fieldEl.querySelector(':scope > .check-group, :scope .check-group');
    if (checkGroup) {
      const values = Array.from(checkGroup.querySelectorAll('input[type="checkbox"]:checked'))
        .map((cb) => optionText(cb.closest('.check-option') || cb.parentElement));
      return [key, values];
    }

    // Standard input / select / textarea (direct child of .field)
    const input = fieldEl.querySelector(':scope > input, :scope > select, :scope > textarea');
    if (input) {
      if (input.type === 'checkbox') return [key, input.checked];
      if (input.type === 'radio') return [key, input.checked ? (input.value || true) : null];
      return [key, input.value.trim ? input.value.trim() : input.value];
    }

    return [key, null];
  }

  // Capture any data table inside a form-page (e.g. the Timesheet
  // session log) as an array of row objects keyed by column header.
  function readTables(formPage) {
    const tables = {};
    formPage.querySelectorAll('table').forEach((table, tIdx) => {
      const headers = Array.from(table.querySelectorAll('thead th')).map((th) =>
        th.textContent.replace(/\s+/g, ' ').trim()
      );
      if (!headers.length) return;

      const rows = [];
      table.querySelectorAll('tbody tr').forEach((tr) => {
        const cells = tr.querySelectorAll('td');
        const row = {};
        let hasValue = false;
        cells.forEach((td, i) => {
          const field = td.querySelector('input, select, textarea');
          let val = '';
          if (field) {
            val = field.type === 'checkbox' ? field.checked : field.value;
            if (val) hasValue = true;
          }
          row[headers[i] || `col_${i}`] = val;
        });
        if (hasValue) rows.push(row);
      });

      // Footer row(s) — e.g. "Total Hours"
      table.querySelectorAll('tfoot tr').forEach((tr) => {
        const cells = tr.querySelectorAll('td');
        if (cells.length >= 2) {
          const label = cells[0].textContent.replace(/\s+/g, ' ').trim();
          const field = cells[cells.length - 1].querySelector('input, select, textarea');
          if (field && field.value) tables[label] = field.value;
        }
      });

      const sectionTitle = table.closest('.field-section')?.querySelector('.section-title')?.textContent.trim();
      tables[sectionTitle || `table_${tIdx + 1}`] = rows;
    });
    return tables;
  }

  function collectFormData(formPage) {
    const data = {};
    formPage.querySelectorAll('.field').forEach((fieldEl) => {
      // Skip nested fields belonging to a table cell
      if (fieldEl.closest('table')) return;
      const result = readField(fieldEl);
      if (result && result[0]) {
        const [key, value] = result;
        // Avoid clobbering when duplicate labels exist
        data[key] = data.hasOwnProperty(key)
          ? [].concat(data[key], value)
          : value;
      }
    });

    Object.assign(data, readTables(formPage));
    return data;
  }

  /* ── Wire up each form's primary action button ── */
  function init() {
    document.querySelectorAll('.form-page').forEach((formPage) => {
      const actions = formPage.querySelector('.form-actions');
      if (!actions) return;
      const submitBtn = actions.querySelector('.btn-primary');
      if (!submitBtn) return;

      const originalLabel = submitBtn.textContent;
      const formTitle = formPage.querySelector('.form-title')?.textContent.trim() || 'Form';
      const formRef = formPage.querySelector('.form-ref')?.textContent.trim() || null;

      submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        if (!window.supabaseClient) {
          showToast('Supabase isn\u2019t configured yet — see supabase-config.js', 'error');
          return;
        }

        const data = collectFormData(formPage);

        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving…';

        try {
          const { data: sessionData } = await window.supabaseClient.auth.getSession();
          const userId = sessionData?.session?.user?.id || null;

          if (!userId) {
            showToast('You need to be signed in to save forms — please sign in first.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
            return;
          }

          const { error } = await window.supabaseClient
            .from('form_submissions')
            .insert([{ form_type: formTitle, form_ref: formRef, data, submitted_by: userId }]);

          if (error) throw error;

          showToast(`${formTitle} saved successfully.`, 'success');
        } catch (err) {
          console.error('Form save failed:', err);
          showToast(`Couldn\u2019t save ${formTitle}. Please try again.`, 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();