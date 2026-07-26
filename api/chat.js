// Vercel serverless function — SmartDesk AI
// Revision: Added rate limiting to prevent API cost attacks.
// Max 10 requests per IP address per minute.
// Previously identified as the most serious vulnerability during testing phase.

// ── RATE LIMITER ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10;       // max requests per window
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  // Reset window if expired
  if (now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  // Within window — check count
  if (record.count >= RATE_LIMIT_MAX) {
    const resetIn = Math.ceil((RATE_LIMIT_WINDOW - (now - record.windowStart)) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

// Clean up old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, 300000);

// ── SIMULATED AVAILABILITY ────────────────────────────────────────────────────
const AVAILABILITY = {
  barbershop: {
    Monday: [],
    Tuesday: ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"],
    Wednesday: ["9:00 AM", "10:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"],
    Thursday: ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "4:30 PM"],
    Friday: ["9:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "3:30 PM"],
    Saturday: ["9:00 AM", "10:00 AM", "10:30 AM", "11:00 AM", "12:00 PM"],
    Sunday: [],
  },
  dental: {
    Monday: ["8:00 AM", "9:00 AM", "10:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"],
    Tuesday: ["8:00 AM", "9:30 AM", "11:00 AM", "1:00 PM", "2:30 PM"],
    Wednesday: ["8:00 AM", "10:00 AM", "1:00 PM", "2:00 PM", "4:00 PM"],
    Thursday: ["8:00 AM", "9:00 AM", "11:00 AM", "2:00 PM", "3:30 PM"],
    Friday: ["8:00 AM", "9:00 AM", "10:30 AM", "1:00 PM", "2:00 PM"],
    Saturday: ["9:00 AM", "10:00 AM", "11:00 AM"],
    Sunday: [],
  },
};

function generateConfirmationCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SD-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getAvailableSlots(businessId, day) {
  const slots = AVAILABILITY[businessId]?.[day];
  if (!slots || slots.length === 0) return null;
  return slots;
}

function getDayFromText(text) {
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const lower = text.toLowerCase();
  return days.find(d => lower.includes(d.toLowerCase())) || null;
}

// ── SYSTEM PROMPTS ────────────────────────────────────────────────────────────
const SYSTEM_PROMPTS = {
  barbershop: `You are the SmartDesk AI assistant — the virtual front desk for Joe's Barbershop in Mountain Top, Pennsylvania.

Business facts (only use these — never invent details):
- Name: Joe's Barbershop
- Location: Main Street, Mountain Top, PA
- Hours: Open Tuesday through Saturday (closed Sunday and Monday)
- Services & prices: Haircut $25, Beard trim $15
- Appointments recommended, walk-ins always welcome

ENHANCED BOOKING FLOW — follow this exactly when a customer wants to book:
Step 1: Ask what service they want (haircut or beard trim)
Step 2: Ask what day they prefer
Step 3: The system will provide available slots — present them clearly as a numbered list
Step 4: When customer picks a slot, confirm: "Perfect! I have you down for a [service] on [day] at [time]. Your confirmation code is [CODE]. The front desk will send a reminder the day before."
Step 5: Never say the booking is 100% finalized — always mention the front desk will confirm

Personality: Friendly, warm, concise. 1-3 sentences. Sound like a great barber shop receptionist.
Never break character or mention Claude or AI.`,

  dental: `You are the SmartDesk AI assistant — the virtual front desk for Mountain Top Dental in Mountain Top, Pennsylvania.

Business facts (only use these — never invent details):
- Name: Mountain Top Dental
- Location: Oak Street, Mountain Top, PA
- Hours: Monday through Friday 8am–5pm. Saturday by appointment only. Closed Sunday.
- Services & prices: Routine cleaning $120, Teeth whitening $250, New patient exam $85
- Most major insurance plans accepted. New patients welcome.

ENHANCED BOOKING FLOW — follow this exactly when a patient wants to book:
Step 1: Ask if they are a new or existing patient
Step 2: Ask what type of appointment (cleaning, whitening, exam, or other)
Step 3: Ask what day they prefer
Step 4: The system will provide available slots — present them clearly as a numbered list
Step 5: When patient picks a slot, confirm with service, day, time, and confirmation code
Step 6: Never say the booking is 100% finalized

Personality: Warm, calm, professional. 1-3 sentences. Sound like a friendly dental receptionist.
Never break character or mention Claude or AI.`,
};

// ── HANDLER ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── RATE LIMITING ──────────────────────────────────────────────────────────
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
    || req.headers["x-real-ip"]
    || req.socket?.remoteAddress
    || "unknown";

  const rateCheck = checkRateLimit(ip);

  // Set rate limit headers so clients can see their status
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX);
  res.setHeader("X-RateLimit-Remaining", rateCheck.remaining);

  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: "Too many requests. Please wait before sending another message.",
      retryAfter: rateCheck.resetIn,
    });
  }

  const { messages, businessId } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const id = businessId || "barbershop";
  const systemPrompt = SYSTEM_PROMPTS[id] || SYSTEM_PROMPTS.barbershop;
  const lastUserMsg = messages[messages.length - 1]?.content || "";

  // ── CALENDAR INJECTION ────────────────────────────────────────────────────
  const bookingKeywords = ["book", "appointment", "schedule", "available", "come in", "slot", "time"];
  const hasBookingIntent = bookingKeywords.some(k => lastUserMsg.toLowerCase().includes(k));
  const detectedDay = getDayFromText(lastUserMsg);

  let calendarInjection = "";

  if (detectedDay && hasBookingIntent) {
    const slots = getAvailableSlots(id, detectedDay);
    if (slots) {
      const slotList = slots.map((s, i) => `${i + 1}. ${s}`).join(", ");
      calendarInjection = `\n\n[CALENDAR SYSTEM]: Available slots for ${detectedDay}: ${slotList}. Present these options to the customer as a numbered list and ask them to pick one.`;
    } else {
      calendarInjection = `\n\n[CALENDAR SYSTEM]: No availability on ${detectedDay}. Politely let the customer know and suggest an alternative day.`;
    }
  }

  const timePattern = /\b(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM|am|pm)\b/;
  const isConfirmingTime = timePattern.test(lastUserMsg) || /^[1-9]$/.test(lastUserMsg.trim());
  if (isConfirmingTime) {
    const code = generateConfirmationCode();
    calendarInjection += `\n\n[CALENDAR SYSTEM]: Customer has selected a time slot. Generate a booking confirmation using this code: ${code}. Include it in your confirmation message.`;
  }

  const augmentedSystem = systemPrompt + calendarInjection;

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
        system: augmentedSystem,
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