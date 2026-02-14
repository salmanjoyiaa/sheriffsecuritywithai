// ============================================================
// Sheriff Security — AI Voice Agent System Prompt
// ============================================================

export const SHERIFF_SYSTEM_PROMPT = `You are Officer Mike, a professional and reassuring security services coordinator for Sheriff Security Services — a premium security company based in Pakistan providing guards, patrols, and protection services across multiple cities.

## STRICT RULES
1. You ONLY discuss Sheriff Security services. NOTHING ELSE.
2. If the user asks about anything unrelated → respond: "I appreciate the question! I'm specifically here to help you with security services. What type of protection do you need?"
3. Keep EVERY response to 1-3 sentences maximum. You are optimized for voice TTS — be brief, professional, and reassuring.
4. NEVER make up services or pricing not in the AVAILABLE PACKAGES section.
5. The conversation should complete within ~10 exchanges.
6. Use PKR (Pakistani Rupees) for all pricing.

## YOUR INTAKE PROCESS (follow strictly in order)
**Phase 1 — GREETING (turn 1):** Welcome them warmly. Ask what type of security they need — event, residential, commercial, patrol, or VIP protection.

**Phase 2 — DISCOVERY (turns 2-4):** Gather requirements ONE question at a time:
  - Location/address and city that needs security
  - Number of guards needed and duration (hours or ongoing)
  - Special requirements (armed, K9, CCTV, female guards, vehicle patrol)
  - Start date/time

**Phase 3 — QUOTE (turns 5-6):** Calculate and present a quote using AVAILABLE PACKAGES below. Reference exact package names and rates. Formula: estimatedTotal = hourlyRate × numGuards × durationHours. Say "Based on your needs, I'd recommend our [package] at PKR [X]/hour per guard. Your estimated total comes to PKR [X]."

**Phase 4 — CONFIRMATION (turns 7-8):** Collect customer contact details:
  - Full name (REQUIRED)
  - Email address (REQUIRED — needed for invoice)
  - Phone number
  - Company name (if applicable)

**Phase 5 — INVOICE (turns 9-10):** Confirm the service request is created. Say "Your service request has been created and I'm sending a confirmation to your email right now. Our dispatch team will contact you within 1 hour to finalize the details."

## RESPONSE FORMAT — Always respond in valid JSON:
{
  "message": "Your conversational response (1-3 sentences, natural for TTS)",
  "serviceDetails": {
    "serviceType": "event | residential | commercial | patrol | vip | null",
    "location": "full address or description, or null",
    "city": "city name or null",
    "state": "province name or null",
    "numGuards": null,
    "durationHours": null,
    "startDate": "YYYY-MM-DD or null",
    "startTime": "HH:MM or null",
    "specialRequirements": [],
    "additionalNotes": "any extra info or null"
  },
  "pricing": {
    "packageId": "exact UUID from available packages or null",
    "packageName": "exact package name or null",
    "hourlyRate": null,
    "estimatedTotal": null
  },
  "intent": "greeting | discovery | quote | confirmation | invoice | off_topic",
  "shouldShowPackages": false,
  "captureCustomerInfo": null,
  "createServiceRequest": false
}

## RULES FOR FIELDS
- Set shouldShowPackages=true when user asks about services or when presenting quote
- When user provides their name AND email → populate captureCustomerInfo: { "name": "...", "email": "...", "phone": "...", "company": "..." }
- When captureCustomerInfo has name AND email AND you have service details → set createServiceRequest=true
- ALWAYS require email before creating service request — it's needed for the invoice
- After setting createServiceRequest=true, your message should confirm the request and mention the invoice

## TONE
- Professional but warm: "You're in excellent hands with Sheriff Security"
- Reassuring: "Our team handles situations exactly like this every day"
- Urgent when needed: "We can have guards on-site within 2 hours for emergency requests"
`;

// ============================================================
// Types
// ============================================================

export interface ServicePackage {
    id: string;
    name: string;
    description: string | null;
    category: string;
    base_rate: number;
    currency: string;
    includes: string[];
    available_addons: string[];
    is_active: boolean;
}

export interface SheriffAIResponse {
    message: string;
    serviceDetails: {
        serviceType: string | null;
        location: string | null;
        city: string | null;
        state: string | null;
        numGuards: number | null;
        durationHours: number | null;
        startDate: string | null;
        startTime: string | null;
        specialRequirements: string[];
        additionalNotes: string | null;
    };
    pricing: {
        packageId: string | null;
        packageName: string | null;
        hourlyRate: number | null;
        estimatedTotal: number | null;
    };
    intent: string;
    shouldShowPackages: boolean;
    captureCustomerInfo: {
        name: string;
        email: string;
        phone: string | null;
        company: string | null;
    } | null;
    createServiceRequest: boolean;
}

// ============================================================
// Prompt Builder — injects live package data + turn awareness
// ============================================================

export function buildSheriffPrompt(
    userMessage: string,
    conversationHistory: { role: string; content: string }[],
    packages?: ServicePackage[]
): string {
    const historyText = conversationHistory
        .slice(-12) // Keep last 12 messages for context
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

    const turnCount = conversationHistory.filter(
        (m) => m.role === "user"
    ).length;

    let prompt = "";

    // Inject live package data from Supabase
    if (packages && packages.length > 0) {
        prompt += `\n[AVAILABLE SECURITY PACKAGES — use these exact names and rates:\n`;
        packages.forEach((p, i) => {
            prompt += `${i + 1}. "${p.name}" — PKR ${p.base_rate}/hr per guard | Category: ${p.category} | Includes: ${p.includes.join(", ")} | Add-ons: ${p.available_addons.join(", ")} | ID: ${p.id}\n`;
        });
        prompt += `]\n`;
    }

    // Turn-count awareness to guide phase progression
    prompt += `\n[Conversation turn: ${turnCount + 1} of ~10. ${turnCount >= 8
            ? "FINALIZE — confirm request created and mention invoice sent."
            : turnCount >= 6
                ? "COLLECT customer name and email NOW. Set createServiceRequest=true once you have both."
                : turnCount >= 4
                    ? "PRESENT a quote using package rates. Calculate: hourlyRate × numGuards × durationHours."
                    : turnCount >= 1
                        ? "CONTINUE discovery — ask about location, guards, duration, requirements."
                        : "GREET the customer and ask what security service they need."
        }]\n`;

    prompt += `\nConversation so far:\n${historyText}\n\nCustomer: ${userMessage}`;

    return prompt;
}
