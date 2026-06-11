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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages
      })
    });

    const data = await response.json();
    const reply = data.content.map(b => b.text || '').join('');
    res.json({ reply });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`EHS Agent server running on port ${PORT}`));
