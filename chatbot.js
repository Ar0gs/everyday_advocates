/* ════════════════════════════════════════════════════════════
   EVA — EVERYDAY ADVOCATES SITE ASSISTANT
   ----------------------------------------------------------------
   A lightweight, fully client-side assistant that answers common
   questions about Everyday Advocates using the same information
   published across the site. No external API or key required.

   Each "intent" below has:
     - keywords: words/phrases that should trigger this answer
     - reply:    HTML shown in the chat bubble (kept short, plain)
     - actions:  optional follow-up buttons. Use { page: 'services' }
                 to navigate the site (handled by app.js's existing
                 [data-page] click listener), or { chip: 'text' } to
                 ask a related follow-up question.
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const KNOWLEDGE_BASE = [
    {
      id: 'greeting',
      keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
      reply: "Hello! I'm Arogs 👋 I can tell you about our services, pricing, areas we cover, and how to get started. What would you like to know?",
      actions: [
        { chip: 'What services do you offer?' },
        { chip: 'How much does it cost?' },
        { chip: 'Do you cover my area?' }
      ]
    },
    {
      id: 'about',
      keywords: ['about', 'who are you', 'what is everyday advocates', 'what do you do', 'what is this', 'company', 'service is this'],
      reply: "Everyday Advocates provides later-life support in Coventry and the surrounding areas — companionship visits, help with life admin and paperwork, and tech support for seniors. We're a social support service, not a care agency, so we focus on connection, confidence, and practical help with everyday life.",
      actions: [
        { chip: 'What services do you offer?' },
        { page: 'about', label: 'Read more about us →' }
      ]
    },
    {
      id: 'services-overview',
      keywords: ['service', 'services', 'what do you offer', 'help with', 'support', 'offer'],
      reply: "We have three service lines:<br>• <strong>Everyday Support</strong> — available now: companionship visits, life admin help, and tech support.<br>• <strong>Everyday Transitions</strong> — coming soon: support through major life changes like hospital to home.<br>• <strong>Everyday Futures</strong> — coming soon: coaching and group programmes for the next chapter of life.",
      actions: [
        { page: 'services', label: 'View all services →' },
        { chip: 'How much does it cost?' }
      ]
    },
    {
      id: 'companionship',
      keywords: ['companionship', 'companion', 'visit', 'visits', 'loneliness', 'lonely', 'tea', 'chat', 'company'],
      reply: "Our Companionship & Wellbeing Visits are relaxed and personal — a cup of tea, a walk, a trip to a café, or just good conversation, shaped around what the client enjoys. We aim for a consistent advocate so there's always a familiar face. Pricing starts from £20/hour, with monthly packages available.",
      actions: [
        { page: 'services', label: 'See companionship details →' },
        { chip: 'How do I get started?' }
      ]
    },
    {
      id: 'life-admin',
      keywords: ['admin', 'paperwork', 'forms', 'letters', 'benefits', 'appointments', 'bills', 'nhs', 'gp'],
      reply: "Our Life Admin & Support service helps with the things that pile up — understanding letters, filling in forms, booking and chasing appointments, and organising paperwork. We don't provide legal or financial advice and never handle client finances directly. Pricing starts from £20/hour.",
      actions: [
        { page: 'services', label: 'See life admin details →' },
        { chip: 'Can you help with finances?' }
      ]
    },
    {
      id: 'tech-support',
      keywords: ['tech', 'technology', 'phone', 'smartphone', 'tablet', 'whatsapp', 'video call', 'scam', 'internet', 'app'],
      reply: "Our Tech Support sessions help clients get confident with the devices they already have — smartphones, tablets, WhatsApp, video calls, the NHS App, and staying safe from online scams. Sessions are from £25 (90 minutes), with reduced rates for blocks of four.",
      actions: [
        { page: 'services', label: 'See tech support details →' },
        { chip: 'How do I get started?' }
      ]
    },
    {
      id: 'finances',
      keywords: ['finance', 'financial', 'money', 'bank', 'pension', 'funds'],
      reply: "We can help clients organise financial paperwork, understand letters from banks or pension providers, and find the right forms to complete. We don't provide financial advice, and we never handle client funds or access bank accounts directly.",
      actions: [{ chip: 'What services do you offer?' }]
    },
    {
      id: 'transitions-futures',
      keywords: ['transition', 'transitions', 'hospital', 'futures', 'retirement', 'coaching', 'next chapter'],
      reply: "Everyday Transitions (specialist support through major life changes, like hospital to home) and Everyday Futures (coaching and group programmes for retirement and beyond) are both <strong>coming soon</strong>. If you're facing one of these situations now, get in touch — we may still be able to help or point you in the right direction.",
      actions: [{ page: 'contact', label: 'Get in touch →' }]
    },
    {
      id: 'pricing',
      keywords: ['price', 'pricing', 'cost', 'cost', 'fee', 'fees', 'how much', 'rate', 'rates', 'expensive', 'afford'],
      reply: "Our starting rates are simple and transparent:<br>• Companionship & Wellbeing Visits — from £20/hour<br>• Life Admin & Support — from £20/hour<br>• Tech Support — from £25 per 90-minute session<br>Monthly packages are available for all services. Exact pricing is always agreed upfront during your free consultation — no hidden fees, ever.",
      actions: [{ page: 'contact', label: 'Book a free consultation →' }]
    },
    {
      id: 'areas',
      keywords: ['area', 'areas', 'location', 'where', 'coventry', 'kenilworth', 'leamington', 'rugby', 'nuneaton', 'solihull', 'cover', 'based'],
      reply: "We're based in Coventry and serve Coventry and the surrounding areas, including Kenilworth, Leamington Spa, Rugby, Nuneaton, and Solihull. Not sure if we cover your area? Just get in touch and we'll let you know.",
      actions: [{ page: 'contact', label: 'Ask us about your area →' }]
    },
    {
      id: 'care-agency',
      keywords: ['care agency', 'regulated', 'personal care', 'washing', 'dressing', 'medication', 'cqc', 'carer', 'nurse'],
      reply: "No — Everyday Advocates is a <strong>social support service</strong>, not a regulated care agency. We focus on companionship, life admin, and practical help with everyday life, and we don't provide personal care such as washing, dressing, or medication. If you need regulated care, we're happy to help point you toward appropriate services.",
      actions: [{ page: 'faqs', label: 'See more FAQs →' }]
    },
    {
      id: 'safety',
      keywords: ['dbs', 'safe', 'safety', 'vetted', 'trust', 'background check', 'insurance', 'safeguarding', 'qualified', 'trained'],
      reply: "All Everyday Advocates staff and volunteers are DBS checked before working with any client, fully trained in our service standards and values, and covered by public liability and professional indemnity insurance. Our founder holds qualifications in business analysis and wellbeing, and clear safeguarding protocols are followed at all times.",
      actions: [{ page: 'about', label: 'See our credentials →' }]
    },
    {
      id: 'getting-started',
      keywords: ['get started', 'how does it work', 'how it works', 'begin', 'sign up', 'start', 'process', 'steps'],
      reply: "Getting started is simple:<br>1. Get in touch (form, email, or call)<br>2. Free consultation to understand what you need<br>3. We create your personal plan<br>4. Meet your advocate<br>5. Your service begins<br>6. Regular reviews to make sure it's working well<br>There's no commitment until you're ready, and no long contracts — just two weeks' notice to end the service.",
      actions: [
        { page: 'how-it-works', label: 'See how it works →' },
        { page: 'contact', label: 'Get in touch →' }
      ]
    },
    {
      id: 'reluctant-relative',
      keywords: ["doesn't want help", "don't want help", "won't accept", "refuses", "independence", "proud", "stubborn"],
      reply: "This is very common, and completely understandable — many older people are proud of their independence. We'd suggest starting with something light, like a friendly visit over a cup of tea, rather than leading with the idea of \"support.\" Most clients warm to their advocate quickly once they see we're there to walk alongside them, not take over. We're happy to talk this through with you.",
      actions: [{ page: 'contact', label: 'Talk it through with us →' }]
    },
    {
      id: 'consultation',
      keywords: ['consultation', 'free consultation', 'book', 'booking', 'enquiry', 'enquire', 'appointment'],
      reply: "We offer a free initial consultation — a relaxed, no-pressure conversation (by phone, video, or in person) to understand what you're looking for and see if we're the right fit. There's no obligation at all.",
      actions: [{ page: 'contact', label: 'Book your free consultation →' }]
    },
    {
      id: 'contact',
      keywords: ['contact', 'email', 'phone number', 'call', 'reach', 'touch', 'hours', 'opening hours', 'office hours'],
      reply: "You can reach us by email at <strong>hello@everydayadvocates.co.uk</strong>, or use the enquiry form on our Contact page. We're available Monday to Friday, 9am–5pm, and we aim to respond to all enquiries within one working day.",
      actions: [{ page: 'contact', label: 'Go to Contact page →' }]
    },
    {
      id: 'advocate-choice',
      keywords: ['choose advocate', 'same person', 'consistency', 'who visits', 'match'],
      reply: "We take matching seriously and aim to pair clients with an advocate who suits their personality and needs — and wherever possible, the same advocate visits each time so familiarity and trust can build. If something isn't working, we'll always find a solution.",
      actions: [{ page: 'faqs', label: 'Read more FAQs →' }]
    },
    {
      id: 'health-emergency',
      keywords: ['emergency', 'health concern', 'unwell', 'medical emergency', '999', 'ambulance'],
      reply: "The safety of our clients always comes first. Our advocates are trained to recognise signs of concern and know exactly what to do, including contacting emergency services if necessary. Every client has an emergency contact on file, and clear safeguarding protocols are followed consistently.",
      actions: [{ page: 'faqs', label: 'See more FAQs →' }]
    },
    {
      id: 'thanks',
      keywords: ['thank you', 'thanks', 'cheers', 'appreciate'],
      reply: "You're very welcome! Is there anything else I can help with?",
      actions: [
        { chip: 'How do I get started?' },
        { page: 'contact', label: 'Get in touch →' }
      ]
    }
  ];

  const FALLBACK = {
    reply: "I'm not quite sure about that one — but our team would love to help directly. You can get in touch and we'll respond within one working day, or take a look at our FAQs for more detail.",
    actions: [
      { page: 'faqs', label: 'Browse FAQs →' },
      { page: 'contact', label: 'Contact us →' }
    ]
  };

  const GREETING = {
    reply: "Hi, I'm Arogs — your Everyday Advocates assistant 😊 Ask me about our services, pricing, the areas we cover, or how to get started.",
    actions: [
      { chip: 'What services do you offer?' },
      { chip: 'How much does it cost?' },
      { chip: 'How do I get started?' }
    ]
  };

  /* ── Matching ── */
  function findIntent(text) {
    const input = text.toLowerCase();
    let best = null;
    let bestScore = 0;

    KNOWLEDGE_BASE.forEach((intent) => {
      let score = 0;
      intent.keywords.forEach((kw) => {
        if (input.includes(kw)) score += kw.split(' ').length; // longer phrases score higher
      });
      if (score > bestScore) {
        bestScore = score;
        best = intent;
      }
    });

    return best || FALLBACK;
  }

  /* ── DOM ── */
  const widget = document.getElementById('chatWidget');
  const launcher = document.getElementById('chatLauncher');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const messagesEl = document.getElementById('chatMessages');
  const suggestionsEl = document.getElementById('chatSuggestions');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');

  if (!widget) return;

  let hasOpened = false;

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderActions(actions) {
    suggestionsEl.innerHTML = '';
    if (!actions || !actions.length) return;
    actions.forEach((action) => {
      const chip = document.createElement('button');
      chip.className = 'chat-chip';
      chip.type = 'button';
      if (action.chip) {
        chip.textContent = action.chip;
        chip.addEventListener('click', () => sendMessage(action.chip));
      } else if (action.page) {
        chip.textContent = action.label || `Go to ${action.page} →`;
        chip.dataset.page = action.page;
      }
      suggestionsEl.appendChild(chip);
    });
  }

  // Inline action buttons rendered inside a bot message (for page links)
  function renderInlineActions(actions) {
    if (!actions) return '';
    const pageActions = actions.filter((a) => a.page);
    if (!pageActions.length) return '';
    return pageActions
      .map((a) => `<button type="button" class="chat-msg-link" data-page="${a.page}">${a.label || `Go to ${a.page} →`}</button>`)
      .join('');
  }

  function addMessage(role, html, actions) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg ' + role;
    msg.innerHTML = `<p>${html}</p>` + (role === 'bot' ? renderInlineActions(actions) : '');
    messagesEl.appendChild(msg);
    scrollToBottom();
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.id = 'chatTyping';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(typing);
    scrollToBottom();
  }

  function hideTyping() {
    const typing = document.getElementById('chatTyping');
    if (typing) typing.remove();
  }

  function respond(intent) {
    showTyping();
    const delay = 480 + Math.random() * 420;
    setTimeout(() => {
      hideTyping();
      addMessage('bot', intent.reply, intent.actions);
      renderActions(intent.actions);
    }, delay);
  }

  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    addMessage('user', escapeHtml(trimmed));
    renderActions(null);
    const intent = findIntent(trimmed);
    respond(intent);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ── Open / close ── */
  function openChat() {
    widget.classList.add('open');
    launcher.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');

    if (!hasOpened) {
      hasOpened = true;
      showTyping();
      setTimeout(() => {
        hideTyping();
        addMessage('bot', GREETING.reply, GREETING.actions);
        renderActions(GREETING.actions);
      }, 500);
    }
    setTimeout(() => input.focus(), 320);
  }

  function closeChat() {
    widget.classList.remove('open');
    launcher.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
  }

  launcher.addEventListener('click', () => {
    widget.classList.contains('open') ? closeChat() : openChat();
  });
  closeBtn.addEventListener('click', closeChat);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value;
    input.value = '';
    sendMessage(text);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && widget.classList.contains('open')) closeChat();
  });
})();
