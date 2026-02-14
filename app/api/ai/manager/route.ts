import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/groq";
import { rateLimit } from "@/lib/rate-limit";
import {
    MANAGER_SYSTEM_PROMPT,
    buildManagerPrompt,
    type ManagerAIResponse,
} from "@/lib/ai/manager-prompts";

export async function POST(req: NextRequest) {
    try {
        // Rate limit
        const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            req.headers.get("x-real-ip") ||
            "unknown";

        if (!rateLimit(ip, 15, 60 * 1000)) {
            return NextResponse.json(
                { error: "Too many requests. Please wait a moment." },
                { status: 429 }
            );
        }

        // Authenticate — this endpoint requires a valid session
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user profile with branch info
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, branch_id, full_name, branch:branches(name)")
            .eq("id", user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const { message, history = [] } = await req.json();

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        // Build prompt with branch context
        const branchName =
            (profile as unknown as { branch: { name: string } | null }).branch?.name || "All Branches";
        const prompt = buildManagerPrompt(message, history, {
            branchId: profile.branch_id || "all",
            branchName,
            role: profile.role,
        });

        // Call Groq LLM
        const aiResponse = await generateJSON<ManagerAIResponse>(
            prompt,
            MANAGER_SYSTEM_PROMPT,
            { temperature: 0.4, maxTokens: 1024 }
        );

        return NextResponse.json(aiResponse);
    } catch (error) {
        console.error("Manager API error:", error);
        return NextResponse.json(
            {
                message:
                    "Sorry, I encountered an issue. Could you repeat that?",
                action: null,
                confirmed: false,
                intent: "error",
            },
            { status: 200 }
        );
    }
}
