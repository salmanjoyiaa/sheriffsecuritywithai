import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    try {
        // Rate limit by IP
        const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            req.headers.get("x-real-ip") ||
            "unknown";
        if (!rateLimit(ip, 20, 60 * 1000)) {
            return NextResponse.json(
                { error: "Too many requests. Please wait a moment." },
                { status: 429 }
            );
        }

        const audioBuffer = await req.arrayBuffer();

        if (!audioBuffer || audioBuffer.byteLength === 0) {
            return NextResponse.json(
                { error: "No audio data provided" },
                { status: 400 }
            );
        }

        const deepgramKey = process.env.DEEPGRAM_API_KEY;
        if (!deepgramKey) {
            return NextResponse.json(
                { error: "Deepgram API key not configured" },
                { status: 500 }
            );
        }

        // Forward audio to Deepgram Nova-2 STT
        const response = await fetch(
            "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en",
            {
                method: "POST",
                headers: {
                    Authorization: `Token ${deepgramKey}`,
                    "Content-Type": req.headers.get("content-type") || "audio/webm",
                },
                body: audioBuffer,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Deepgram STT error:", errorText);
            return NextResponse.json(
                { error: "Speech-to-text failed" },
                { status: 500 }
            );
        }

        const data = await response.json();
        const transcript =
            data.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

        return NextResponse.json({ transcript });
    } catch (error) {
        console.error("Speech API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
