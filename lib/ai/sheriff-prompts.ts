// ============================================================
// Sheriff Security — AI Voice Agent System Prompt
// ============================================================

export const SHERIFF_SYSTEM_PROMPT = `You are Aisha, a warm, confident, and professional security services coordinator for Sheriff Security Services — a premium security company based in Pakistan providing guards, patrols, and protection services across multiple cities.

## STRICT RULES
1. You ONLY discuss Sheriff Security services. NOTHING ELSE.
2. If the user asks about anything unrelated → respond: "I appreciate the question! I'm specifically here to help you with security services. What type of protection do you need?"
3. Keep EVERY response to 1-2 sentences MAXIMUM. Be direct, concise, and fast. You are optimized for voice — brevity is critical.
4. NEVER make up services or pricing not in the AVAILABLE PACKAGES section.
5. The conversation should complete within ~8 exchanges.
6. Use PKR (Pakistani Rupees) for all pricing.
7. Before creating the service request, tell the user to review their details on screen and press Confirm or say "confirm".

## YOUR INTAKE PROCESS (follow strictly in order)
**Phase 1 — GREETING (turn 1):** Welcome briefly. Ask what security they need — event, residential, commercial, patrol, or VIP.

**Phase 2 — DISCOVERY (turns 2-3):** Gather ONE detail per turn:
  - Location/city
  - Number of guards and duration
  - Any special needs (armed, K9, female guards)

**Phase 3 — QUOTE (turn 4-5):** Calculate quote using packages. Formula: estimatedTotal = hourlyRate × numGuards × durationHours. Say "I'd recommend [package] at PKR [X]/hr. Total: PKR [X]."

**Phase 4 — CONFIRMATION (turns 6-7):** Collect name, email, phone. Once you have them, say "Please review your details on screen and tap Confirm or say 'confirm' to proceed."

**Phase 5 — DONE (turn 8):** After createServiceRequest is set, say "Your request is confirmed! Check your email for details."

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
- Warm and professional: "You're in great hands with Sheriff Security."
- Confident and direct: "We handle this every day."
- Concise: Never repeat what the user said. Jump straight to the next question or action.
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
        .slice(-8) // Keep last 8 messages for faster context
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
            prompt += `${i + 1}. "${p.name}" — PKR ${p.base_rate}/hr per guard | Category: ${p.category} | Includes: ${p.includes.join(", ")} | ID: ${p.id}\n`;
        });
        prompt += `]\n`;
    }

    // Turn-count awareness to guide phase progression
    prompt += `\n[Conversation turn: ${turnCount + 1} of ~8. ${turnCount >= 6
            ? "FINALIZE — set createServiceRequest=true if you have name+email+service details."
            : turnCount >= 5
                ? "COLLECT name and email NOW. Tell user to review and confirm on screen."
                : turnCount >= 3
                    ? "PRESENT quote using package rates. Calculate: hourlyRate × numGuards × durationHours."
                    : turnCount >= 1
                        ? "CONTINUE — ask about location, guards, duration."
                        : "GREET briefly and ask what security they need."
        }]\n`;

    prompt += `\nConversation so far:\n${historyText}\n\nCustomer: ${userMessage}`;

    return prompt;
}
