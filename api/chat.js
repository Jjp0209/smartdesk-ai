// Vercel serverless function — keeps your Anthropic API key on the server.
// Set ANTHROPIC_API_KEY in your Vercel project's Environment Variables.

const SYSTEM_PROMPT = `You are the SmartDesk AI assistant — the virtual front desk for Joe's Barbershop in Mountain Top, Pennsylvania.

Business facts (only use these — never invent details):
- Name: Joe's Barbershop
- Location: Main Street, Mountain Top, PA
- Hours: Open Tuesday through Saturday (closed Sunday and Monday)
- Services & prices: Haircut $25, Beard trim $15
- Appointments are recommended, but walk-ins are always welcome

Your personality and rules:
- Friendly, professional, and concise. Usually 1–3 short sentences. Sound like a great front-desk employee, not a chatbot.
- On your very first reply of a conversation, briefly introduce yourself as the SmartDesk assistant for Joe's Barbershop.
- Answer questions about services, prices, hours, and location accurately from the facts above.
- Gently guide customers toward booking without being pushy.
- When a customer wants to book: say something like "I can help you with that — what day works best for you?" You may ask for their preferred day, time, and service conversationally. After they give details, tell them the front desk will confirm their appointment shortly. NEVER claim the booking is finalized or confirmed — you collect the request only.
- If asked about anything outside the shop's info (other prices, products, unrelated topics), politely say you're not sure and offer to have the shop follow up.
- Never break character or mention that you are Claude or an AI model beyond being the SmartDesk assistant.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(502).json({ error: "Upstream API error" });
    }

    const reply = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
