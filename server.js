const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const SYSTEM_PROMPT = `You are the EHS Agent for Embrenn Hardware Solutions (EHS), a hardware solutions company. You are friendly, professional, and concise.

You help customers with: products, EOL replacement, pricing, orders, warranty, commercial displays, UPS solutions, and technical/installation help.

RESPONSE RULES:
- Keep every reply to 1-2 sentences maximum. No long paragraphs ever.
- Do not use emojis. Keep tone professional and corporate.
- Never make up prices, stock levels, or order details.
- For sales contact: call (289) 815-2771 or email sales@embrenn.ca.
- When telling customers someone will follow up, say "within 10 minutes" during business hours.

PRODUCT PAGE BEHAVIOR:
- If a product name is provided in the context, you already know what the customer is looking at.
- When on a product page, proactively offer: stock availability check, multi-unit/bulk discount, or a quick quote.
- Keep product-specific responses relevant and direct.`;

async function sendLeadEmail(lead) {
  try {
    const body = `
New Quote Request from EHS Agent

Name: ${lead.name}
Email: ${lead.email}
Company: ${lead.company}
Phone: ${lead.phone}
${lead.product ? 'Product Interest: ' + lead.product : ''}
Submitted: ${new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' })}
    `.trim();

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY
      },
      body: JSON.stringify({
        from: 'EHS Agent <onboarding@resend.dev>',
        to: ['sales@embrenn.ca'],
        subject: 'RFQ: Chat Lead - ' + lead.name + ' from ' + lead.company,
        text: body
      })
    });
    const data = await response.json();
    console.log('Email sent:', data);
  } catch (err) {
    console.error('Email error:', err);
  }
}

app.get('/', (req, res) => res.send('EHS Agent is running!'));

app.post('/chat', async (req, res) => {
  const { messages, productContext } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }
  try {
    let systemPrompt = SYSTEM_PROMPT;
    if (productContext) {
      systemPrompt += `\n\nCURRENT PAGE CONTEXT: The customer is viewing the product page for "${productContext.name}". Greet them proactively about this specific product offering stock availability, multi-unit discount, or quick quote.`;
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages
      })
    });
    const data = await response.json();
    if (data.error) {
      console.error('Anthropic API error:', data.error);
      return res.status(500).json({ reply: 'Sorry, I am having trouble connecting right now. Please try again in a moment.' });
    }
    if (!data.content || !Array.isArray(data.content)) {
      console.error('Unexpected response:', data);
      return res.status(500).json({ reply: 'Sorry, I am having trouble connecting right now. Please try again in a moment.' });
    }
    const reply = data.content.map(b => b.text || '').join('');
    res.json({ reply });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ reply: 'Sorry, I am having trouble connecting right now. Please try again in a moment.' });
  }
});

app.post('/submit-quote', async (req, res) => {
  const { name, email, company, phone, product } = req.body;
  await sendLeadEmail({ name, email, company, phone, product });
  res.json({ success: true });
});

app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`(function() {
  var CHAT_URL = 'https://ehs-agent-server.onrender.com/chat';
  var QUOTE_URL = 'https://ehs-agent-server.onrender.com/submit-quote';
  var hist = [], started = false, autoOpened = false, inQuote = false;
  var quoteStep = 0, quoteName = '', quoteEmail = '', quoteCompany = '', quotePhone = '';
  var productCtx = null;

  function getProductContext() {
    var isProduct = window.location.pathname.indexOf('/products/') !== -1;
    if (!isProduct) return null;
    var name = document.querySelector('h1.productView-title, h1[itemprop="name"], .productView h1');
    return { name: name ? name.innerText.trim() : document.title, url: window.location.href };
  }

  var s = document.createElement('style');
  s.textContent = '#ehs-fab{position:fixed;bottom:24px;right:24px;z-index:99999;width:56px;height:56px;border-radius:50%;background:#185FA5;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.2);}#ehs-fab svg{width:24px;height:24px;fill:white;}#ehs-box{position:fixed;bottom:90px;right:24px;z-index:99999;width:320px;background:#fff;border-radius:12px;border:1px solid #ddd;font-family:system-ui,sans-serif;font-size:13px;display:none;flex-direction:column;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.15);}#ehs-box.on{display:flex;}.eh-hd{background:#185FA5;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;}.eh-av{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;letter-spacing:.5px;}.eh-ti{flex:1;}.eh-nm{font-size:15px;font-weight:600;margin:0;line-height:1.3;}.eh-st{font-size:11px;opacity:.85;display:flex;align-items:center;gap:5px;margin-top:2px;}.eh-dot{width:7px;height:7px;border-radius:50%;background:#97C459;display:inline-block;}.eh-cx{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0;line-height:1;opacity:.8;}.eh-intro{padding:14px 16px;border-bottom:1px solid #eee;}.eh-intro p{margin:0 0 4px;font-size:13px;color:#333;line-height:1.5;}.eh-intro .eh-tag{font-size:11px;color:#888;margin:0;}.eh-actions{padding:12px 16px;display:flex;flex-direction:column;gap:8px;border-bottom:1px solid #eee;}.eh-qb{border:1px solid #185FA5;border-radius:8px;padding:9px 12px;background:#fff;color:#185FA5;cursor:pointer;text-align:left;width:100%;display:flex;align-items:center;gap:8px;font-size:13px;transition:background .15s;}.eh-qb:hover{background:#EBF4FF;}.eh-qb svg{width:15px;height:15px;flex-shrink:0;fill:none;stroke:#185FA5;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}.eh-contact{padding:10px 16px;border-bottom:1px solid #eee;display:flex;flex-direction:column;gap:6px;}.eh-clink{display:flex;align-items:center;gap:8px;font-size:12px;color:#185FA5;text-decoration:none;}.eh-clink svg{width:14px;height:14px;flex-shrink:0;fill:none;stroke:#185FA5;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}.eh-ms{display:none;flex-direction:column;gap:8px;max-height:200px;overflow-y:auto;padding:12px 16px;}.eh-ms.on{display:flex;}.mu{align-self:flex-end;background:#185FA5;color:#fff;border-radius:10px 10px 2px 10px;padding:7px 11px;max-width:80%;line-height:1.5;word-break:break-word;}.ma{align-self:flex-start;background:#f5f5f5;color:#333;border-radius:10px 10px 10px 2px;padding:7px 11px;max-width:85%;line-height:1.5;word-break:break-word;}.mt{color:#999;font-style:italic;font-size:12px;padding:2px 0;}.eh-ft{padding:10px 12px 12px;border-top:1px solid #eee;}.eh-back{display:none;background:none;border:none;color:#185FA5;font-size:12px;cursor:pointer;padding:0 0 8px;text-decoration:underline;}.eh-back.on{display:block;}.eh-ir{display:flex;gap:6px;}.eh-in{flex:1;border:1px solid #ccc;border-radius:8px;padding:8px 12px;font-size:13px;font-family:inherit;color:#333;outline:none;}.eh-in:focus{border-color:#185FA5;}.eh-sb{width:34px;height:34px;border-radius:8px;background:#185FA5;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}.eh-sb svg{width:16px;height:16px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}.eh-ds{font-size:11px;color:#aaa;text-align:center;margin-top:7px;}.eh-prog{display:none;padding:0 16px 10px;}.eh-prog.on{display:block;}.eh-prog-bar{height:3px;background:#eee;border-radius:3px;overflow:hidden;}.eh-prog-fill{height:100%;background:#185FA5;border-radius:3px;transition:width .3s;}.eh-prog-label{font-size:11px;color:#888;margin-top:4px;}.eh-prod-badge{background:#EBF4FF;border:1px solid #c3d9f5;border-radius:6px;padding:6px 12px;font-size:12px;color:#185FA5;margin:0 16px 10px;display:none;}.eh-prod-badge.on{display:block;}';
  document.head.appendChild(s);

  document.body.insertAdjacentHTML('beforeend',
    '<button id="ehs-fab" aria-label="Chat with EHS Agent"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>' +
    '<div id="ehs-box">' +
      '<div class="eh-hd"><div class="eh-av">EHS</div><div class="eh-ti"><p class="eh-nm">EHS Agent</p><div class="eh-st"><span class="eh-dot"></span> Online now</div></div><button class="eh-cx" id="ehs-cx">&times;</button></div>' +
      '<div class="eh-intro" id="ehs-intro"><p>Hi there! I am EHS Agent from Embrenn Hardware Solutions.</p><p class="eh-tag">I can help with Products, EOL Replacement, Pricing, Orders, Warranty and more.</p></div>' +
      '<div id="ehs-prod-badge" class="eh-prod-badge"></div>' +
      '<div class="eh-prog" id="ehs-prog"><div class="eh-prog-bar"><div class="eh-prog-fill" id="ehs-prog-fill" style="width:0%"></div></div><div class="eh-prog-label" id="ehs-prog-label"></div></div>' +
      '<div class="eh-actions" id="ehs-bd">' +
        '<button class="eh-qb" id="ehs-quote-btn"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>Request a Quote</button>' +
        '<button class="eh-qb" data-q="Tell me about your commercial display products"><svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>Commercial Displays</button>' +
        '<button class="eh-qb" data-q="Tell me about your UPS solutions"><svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>UPS Solutions</button>' +
      '</div>' +
      '<div class="eh-contact">' +
        '<a class="eh-clink" href="tel:+12898152771"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>(289) 815-2771</a>' +
        '<a class="eh-clink" href="mailto:sales@embrenn.ca"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>sales@embrenn.ca</a>' +
      '</div>' +
      '<div class="eh-ms" id="ehs-ms"></div>' +
      '<div class="eh-ft">' +
        '<button class="eh-back" id="ehs-back">&#8592; Back to main menu</button>' +
        '<div class="eh-ir"><input class="eh-in" id="ehs-in" type="text" placeholder="Ask EHS Agent a question..."/><button class="eh-sb" id="ehs-sb"><svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div>' +
        '<div class="eh-ds">Personal data processed in accordance with Embrenn Privacy Policy.</div>' +
      '</div>' +
    '</div>'
  );

  productCtx = getProductContext();
  if (productCtx) {
    var badge = document.getElementById('ehs-prod-badge');
    badge.textContent = 'Viewing: ' + productCtx.name;
    badge.classList.add('on');
  }

  var quoteSteps = [
    { label: 'Step 1 of 4 - Name', pct: '25%', msg: 'To get started with your quote, what is your full name?' },
    { label: 'Step 2 of 4 - Email', pct: '50%', msg: 'Thank you! What is your email address?' },
    { label: 'Step 3 of 4 - Company', pct: '75%', msg: 'What is your company name?' },
    { label: 'Step 4 of 4 - Phone (optional)', pct: '100%', msg: 'Last one - what is your phone number? You can type skip to leave this blank.' }
  ];

  function startQuoteFlow() {
    inQuote = true; quoteStep = 0;
    quoteName = ''; quoteEmail = ''; quoteCompany = ''; quotePhone = '';
    startChat();
    updateProgress(0);
    document.getElementById('ehs-back').classList.add('on');
    addMsg(quoteSteps[0].msg, 'a');
    document.getElementById('ehs-in').placeholder = 'Enter your full name...';
    document.getElementById('ehs-in').focus();
  }

  function updateProgress(step) {
    var prog = document.getElementById('ehs-prog');
    var fill = document.getElementById('ehs-prog-fill');
    var label = document.getElementById('ehs-prog-label');
    prog.classList.add('on');
    fill.style.width = quoteSteps[step].pct;
    label.textContent = quoteSteps[step].label;
  }

  function handleQuoteStep(txt) {
    addMsg(txt, 'u');
    if (quoteStep === 0) {
      quoteName = txt; quoteStep = 1; updateProgress(1);
      addMsg(quoteSteps[1].msg, 'a');
      document.getElementById('ehs-in').placeholder = 'Enter your email address...';
    } else if (quoteStep === 1) {
      quoteEmail = txt; quoteStep = 2; updateProgress(2);
      addMsg(quoteSteps[2].msg, 'a');
      document.getElementById('ehs-in').placeholder = 'Enter your company name...';
    } else if (quoteStep === 2) {
      quoteCompany = txt; quoteStep = 3; updateProgress(3);
      addMsg(quoteSteps[3].msg, 'a');
      document.getElementById('ehs-in').placeholder = 'Enter phone number or type skip...';
    } else if (quoteStep === 3) {
      quotePhone = (txt.toLowerCase() === 'skip') ? 'Not provided' : txt;
      finishQuote();
    }
  }

  function finishQuote() {
    inQuote = false;
    document.getElementById('ehs-prog').classList.remove('on');
    document.getElementById('ehs-in').placeholder = 'Ask EHS Agent a question...';
    var summary = 'Thank you ' + quoteName + ' from ' + quoteCompany + '. Our sales team will contact you at ' + quoteEmail + (quotePhone !== 'Not provided' ? ' or ' + quotePhone : '') + ' within 10 minutes with your quote.';
    addMsg(summary, 'a');
    fetch(QUOTE_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        name: quoteName, email: quoteEmail, company: quoteCompany, phone: quotePhone,
        product: productCtx ? productCtx.name : null
      })
    }).catch(function(e) { console.error('Quote email error:', e); });
  }

  function resetToMain() {
    inQuote = false; quoteStep = 0; started = false; hist = [];
    document.getElementById('ehs-ms').innerHTML = '';
    document.getElementById('ehs-ms').classList.remove('on');
    document.getElementById('ehs-bd').style.display = '';
    document.getElementById('ehs-intro').style.display = '';
    document.getElementById('ehs-prog').classList.remove('on');
    document.getElementById('ehs-back').classList.remove('on');
    document.getElementById('ehs-in').placeholder = 'Ask EHS Agent a question...';
  }

  document.getElementById('ehs-fab').onclick = function() { document.getElementById('ehs-box').classList.toggle('on'); };
  document.getElementById('ehs-cx').onclick = function() { document.getElementById('ehs-box').classList.remove('on'); };
  document.getElementById('ehs-back').onclick = resetToMain;
  document.getElementById('ehs-quote-btn').onclick = startQuoteFlow;
  document.getElementById('ehs-sb').onclick = send;
  document.getElementById('ehs-in').addEventListener('keydown', function(e) { if (e.key === 'Enter') send(); });
  document.querySelectorAll('.eh-qb:not(#ehs-quote-btn)').forEach(function(b) { b.onclick = function() { go(this.getAttribute('data-q')); }; });

  if (productCtx) {
    setTimeout(function() {
      if (!autoOpened) {
        autoOpened = true;
        document.getElementById('ehs-box').classList.add('on');
        startChat();
        var greeting = 'I am on the product page for "' + productCtx.name + '". Can you help me with stock availability, multi-unit pricing, or a quick quote?';
        hist.push({role:'user', content: greeting});
        typing(true);
        fetch(CHAT_URL, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:hist,productContext:productCtx})})
        .then(function(r){return r.json();}).then(function(d){typing(false);hist.push({role:'assistant',content:d.reply});addMsg(d.reply,'a');document.getElementById('ehs-back').classList.add('on');})
        .catch(function(){typing(false);});
      }
    }, 4000);
  }

  function startChat() {
    if (started) return; started = true;
    document.getElementById('ehs-bd').style.display = 'none';
    document.getElementById('ehs-intro').style.display = 'none';
    document.getElementById('ehs-ms').classList.add('on');
  }
  function addMsg(txt, who) { var ms = document.getElementById('ehs-ms'); var d = document.createElement('div'); d.className = who === 'u' ? 'mu' : 'ma'; d.textContent = txt; ms.appendChild(d); ms.scrollTop = ms.scrollHeight; }
  function typing(show) { var t = document.getElementById('ehs-typ'); if (show && !t) { var ms = document.getElementById('ehs-ms'); t = document.createElement('div'); t.id = 'ehs-typ'; t.className = 'mt'; t.textContent = 'EHS Agent is typing...'; ms.appendChild(t); ms.scrollTop = ms.scrollHeight; } else if (!show && t) { t.parentNode.removeChild(t); } }
  function go(txt) {
    startChat();
    document.getElementById('ehs-back').classList.add('on');
    addMsg(txt, 'u'); hist.push({role:'user',content:txt}); typing(true);
    fetch(CHAT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:hist,productContext:productCtx})})
    .then(function(r){return r.json();}).then(function(d){typing(false);hist.push({role:'assistant',content:d.reply});addMsg(d.reply,'a');})
    .catch(function(){typing(false);addMsg('Sorry, having trouble connecting. Please try again.','a');});
  }
  function send() {
    var inp = document.getElementById('ehs-in');
    var txt = inp.value.trim();
    if (!txt) return;
    inp.value = '';
    if (inQuote) { handleQuoteStep(txt); return; }
    go(txt);
  }
})();`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`EHS Agent server running on port ${PORT}`));
