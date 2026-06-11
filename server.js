const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const SYSTEM_PROMPT = `You are the EHS Agent for Embrenn Hardware Solutions (EHS), a hardware solutions company. You are friendly, warm, and conversational — never robotic. You help customers with:
- Product and inventory questions
- Quotes and pricing
- Order tracking and support
- Technical and installation help
- Commercial display products
- UPS (Uninterruptible Power Supply) solutions

Keep replies concise (2-4 sentences max). If you need to escalate or don't know something, offer to connect them with the human team. Never make up specific prices or order details — offer to have the team follow up instead. Always stay on-brand: helpful, approachable, and knowledgeable about hardware.`;

app.get('/', (req, res) => res.send('EHS Agent is running!'));

app.post('/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages
      })
    });
    const data = await response.json();
    console.log('Anthropic response status:', response.status);
    console.log('Anthropic response:', JSON.stringify(data));
    if (data.error) {
      console.error('Anthropic API error:', data.error);
      return res.status(500).json({ reply: 'Sorry, I am having trouble connecting right now. Please try again in a moment!' });
    }
    if (!data.content || !Array.isArray(data.content)) {
      console.error('Unexpected response format:', data);
      return res.status(500).json({ reply: 'Sorry, I am having trouble connecting right now. Please try again in a moment!' });
    }
    const reply = data.content.map(b => b.text || '').join('');
    res.json({ reply });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ reply: 'Sorry, I am having trouble connecting right now. Please try again in a moment!' });
  }
});

app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`(function() {
  var s = document.createElement('style');
  s.textContent = '#ehs-fab{position:fixed;bottom:24px;right:24px;z-index:99999;width:56px;height:56px;border-radius:50%;background:#185FA5;border:none;cursor:pointer;color:#fff;font-size:22px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.2);}#ehs-box{position:fixed;bottom:90px;right:24px;z-index:99999;width:310px;background:#fff;border-radius:12px;border:1px solid #ddd;font-family:sans-serif;font-size:13px;display:none;flex-direction:column;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.15);}#ehs-box.on{display:flex;}.eh-hd{background:#185FA5;color:#fff;padding:12px 14px;display:flex;align-items:center;gap:8px;}.eh-av{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}.eh-ti{flex:1;}.eh-nm{font-size:14px;font-weight:600;margin:0;}.eh-st{font-size:11px;opacity:.8;}.eh-cx{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0;}.eh-bd{padding:12px;display:flex;flex-direction:column;gap:8px;}.eh-wl{background:#f5f5f5;border-radius:8px;padding:10px;line-height:1.5;color:#333;}.eh-qb{border:1px solid #185FA5;border-radius:6px;padding:8px 10px;background:#fff;color:#185FA5;cursor:pointer;text-align:left;width:100%;margin-bottom:4px;}.eh-ms{display:none;flex-direction:column;gap:8px;max-height:180px;overflow-y:auto;padding:12px;}.eh-ms.on{display:flex;}.mu{align-self:flex-end;background:#185FA5;color:#fff;border-radius:8px 8px 2px 8px;padding:6px 10px;max-width:80%;}.ma{align-self:flex-start;background:#f5f5f5;color:#333;border-radius:8px 8px 8px 2px;padding:6px 10px;max-width:85%;}.mt{color:#999;font-style:italic;font-size:12px;}.eh-ft{padding:10px 12px;border-top:1px solid #eee;}.eh-ir{display:flex;gap:6px;}.eh-in{flex:1;border:1px solid #ccc;border-radius:6px;padding:8px;font-size:13px;font-family:sans-serif;outline:none;}.eh-sb{width:34px;height:34px;border-radius:6px;background:#185FA5;border:none;cursor:pointer;color:#fff;font-size:16px;}.eh-ds{font-size:11px;color:#aaa;text-align:center;margin-top:6px;}';
  document.head.appendChild(s);

  document.body.insertAdjacentHTML('beforeend', '<button id="ehs-fab" aria-label="Chat with EHS Agent">&#x1F4AC;</button><div id="ehs-box"><div class="eh-hd"><div class="eh-av">EHS</div><div class="eh-ti"><p class="eh-nm">EHS Agent</p><div class="eh-st">&#9679; Online now</div></div><button class="eh-cx" id="ehs-cx">&times;</button></div><div class="eh-bd" id="ehs-bd"><div class="eh-wl">&#x1F44B; Welcome to Embrenn Hardware Solutions! I can help with products, pricing, orders, and more.</div><div><button class="eh-qb" data-q="I would like to request a quote">&#x1F4CB; Request a quote</button><button class="eh-qb" data-q="I would like to speak with your sales team">&#x1F3A7; Contact sales</button><button class="eh-qb" data-q="Tell me about your commercial display products">&#x1F5A5; Commercial displays</button><button class="eh-qb" data-q="Tell me about your UPS solutions">&#x26A1; UPS solutions</button></div></div><div class="eh-ms" id="ehs-ms"></div><div class="eh-ft"><div class="eh-ir"><input class="eh-in" id="ehs-in" type="text" placeholder="Ask a question..."/><button class="eh-sb" id="ehs-sb">&#x27A4;</button></div><div class="eh-ds">Handled in accordance with our Privacy Policy.</div></div></div>');

  var URL = 'https://ehs-agent-server.onrender.com/chat';
  var hist = [], started = false;

  document.getElementById('ehs-fab').onclick = function() { document.getElementById('ehs-box').classList.toggle('on'); };
  document.getElementById('ehs-cx').onclick = function() { document.getElementById('ehs-box').classList.remove('on'); };
  document.getElementById('ehs-sb').onclick = send;
  document.getElementById('ehs-in').addEventListener('keydown', function(e) { if (e.key === 'Enter') send(); });
  document.querySelectorAll('.eh-qb').forEach(function(b) { b.onclick = function() { go(this.getAttribute('data-q')); }; });

  function startChat() { if (started) return; started = true; document.getElementById('ehs-bd').style.display = 'none'; document.getElementById('ehs-ms').classList.add('on'); }
  function addMsg(txt, who) { var ms = document.getElementById('ehs-ms'); var d = document.createElement('div'); d.className = who === 'u' ? 'mu' : 'ma'; d.textContent = txt; ms.appendChild(d); ms.scrollTop = ms.scrollHeight; }
  function typing(show) { var t = document.getElementById('ehs-typ'); if (show && !t) { var ms = document.getElementById('ehs-ms'); t = document.createElement('div'); t.id = 'ehs-typ'; t.className = 'mt'; t.textContent = 'EHS Agent is typing...'; ms.appendChild(t); } else if (!show && t) { t.parentNode.removeChild(t); } }
  function go(txt) { startChat(); addMsg(txt, 'u'); hist.push({role:'user',content:txt}); typing(true); fetch(URL, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:hist})}).then(function(r){return r.json();}).then(function(d){typing(false);hist.push({role:'assistant',content:d.reply});addMsg(d.reply,'a');}).catch(function(){typing(false);addMsg('Sorry, having trouble connecting. Please try again!','a');}); }
  function send() { var inp = document.getElementById('ehs-in'); var txt = inp.value.trim(); if (!txt) return; inp.value = ''; go(txt); }
})();`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`EHS Agent server running on port ${PORT}`));
