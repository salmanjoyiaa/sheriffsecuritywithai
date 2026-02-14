import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateJSON } from "@/lib/ai/groq";
import { rateLimit } from "@/lib/rate-limit";
import type { Database } from "@/lib/supabase/types";
import {
    SHERIFF_SYSTEM_PROMPT,
    buildSheriffPrompt,
    type SheriffAIResponse,
    type ServicePackage,
} from "@/lib/ai/sheriff-prompts";

// Use service role client for unauthenticated context (public AI agent)
const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        // Rate limit check
        const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            req.headers.get("x-real-ip") ||
            "unknown";

        if (!rateLimit(ip, 10, 60 * 1000)) {
            return NextResponse.json(
                { error: "Too many requests. Please wait a moment." },
                { status: 429 }
            );
        }

        const { message, history = [], context } = await req.json();

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        // Fetch active service packages from Supabase
        const { data: packages } = await supabase
            .from("service_packages")
            .select("id, name, description, category, base_rate, currency, includes, available_addons, is_active")
            .eq("is_active", true)
            .limit(10);

        // Build the prompt with live package data
        const prompt = buildSheriffPrompt(
            message,
            history,
            (packages as ServicePackage[]) || []
        );

        // Call Groq LLM in JSON mode
        const aiResponse = await generateJSON<SheriffAIResponse>(
            prompt,
            SHERIFF_SYSTEM_PROMPT,
            { temperature: 0.4, maxTokens: 1024 }
        );

        // If AI wants to show packages, enrich the response with full package data
        let enrichedPackages: ServicePackage[] = [];
        if (aiResponse.shouldShowPackages && packages) {
            enrichedPackages = packages as ServicePackage[];
        }

        return NextResponse.json({
            ...aiResponse,
            packages: enrichedPackages,
        });
    } catch (error) {
        console.error("Receptionist API error:", error);
        return NextResponse.json(
            {
                message:
                    "I apologize, I'm having a brief technical issue. Could you please try again in a moment?",
                intent: "error",
                serviceDetails: {
                    serviceType: null,
                    location: null,
                    city: null,
                    state: null,
                    numGuards: null,
                    durationHours: null,
                    startDate: null,
                    startTime: null,
                    specialRequirements: [],
                    additionalNotes: null,
                },
                pricing: {
                    packageId: null,
                    packageName: null,
                    hourlyRate: null,
                    estimatedTotal: null,
                },
                shouldShowPackages: false,
                captureCustomerInfo: null,
                createServiceRequest: false,
                packages: [],
            },
            { status: 200 } // Return 200 so the UI can display the error message
        );
    }
}
