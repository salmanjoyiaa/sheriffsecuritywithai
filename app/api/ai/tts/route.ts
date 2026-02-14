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

        const { text } = await req.json();

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Text is required" },
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

        // Forward text to Deepgram Aura-2 TTS (Andromeda — warm female voice)
        const response = await fetch(
            "https://api.deepgram.com/v1/speak?model=aura-2-andromeda-en",
            {
                method: "POST",
                headers: {
                    Authorization: `Token ${deepgramKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Deepgram TTS error:", errorText);
            return NextResponse.json(
                { error: "Text-to-speech failed" },
                { status: 500 }
            );
        }

        // Stream the audio response back
        const audioBuffer = await response.arrayBuffer();

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": audioBuffer.byteLength.toString(),
            },
        });
    } catch (error) {
        console.error("TTS API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
