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

        // Stream TTS from Deepgram Aura-2 Helena (clear female voice)
        // Using linear16 PCM at 24kHz for low-latency chunked streaming
        const response = await fetch(
            "https://api.deepgram.com/v1/speak?model=aura-2-helena-en&encoding=linear16&sample_rate=24000",
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

        // Pipe Deepgram's response body directly — client receives audio chunks
        // as they are generated (streaming) instead of waiting for full download
        if (!response.body) {
            return NextResponse.json(
                { error: "No audio stream from TTS" },
                { status: 500 }
            );
        }

        return new NextResponse(response.body as ReadableStream, {
            status: 200,
            headers: {
                "Content-Type": "audio/pcm",
                "X-Sample-Rate": "24000",
                "X-Channels": "1",
                "X-Bit-Depth": "16",
                "Cache-Control": "no-cache",
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
