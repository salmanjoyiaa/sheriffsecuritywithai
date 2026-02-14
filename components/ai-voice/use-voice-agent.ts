"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { SheriffAIResponse, ServicePackage } from "@/lib/ai/sheriff-prompts";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
}

interface ServiceRequestResult {
    id: string;
    request_number: string;
    customer_name: string;
    customer_email: string;
    service_type: string;
    estimated_total: number | null;
    branch_id: string | null;
}

interface UseVoiceAgentReturn {
    state: VoiceState;
    transcript: string;
    response: SheriffAIResponse | null;
    error: string | null;
    startListening: () => Promise<void>;
    stopListening: () => void;
    sendTextQuery: (text: string) => Promise<void>;
    cancel: () => void;
    analyserNode: AnalyserNode | null;
    micAnalyser: AnalyserNode | null;
    isSpeaking: boolean;
    audioDuration: number;
    packages: ServicePackage[];
    serviceRequest: ServiceRequestResult | null;
    conversationHistory: ConversationMessage[];
}

export function useVoiceAgent(): UseVoiceAgentReturn {
    const [state, setState] = useState<VoiceState>("idle");
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState<SheriffAIResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
    const [micAnalyser, setMicAnalyser] = useState<AnalyserNode | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioDuration, setAudioDuration] = useState(0);
    const [packages, setPackages] = useState<ServicePackage[]>([]);
    const [serviceRequest, setServiceRequest] = useState<ServiceRequestResult | null>(null);

    const conversationRef = useRef<ConversationMessage[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current || audioContextRef.current.state === "closed") {
            audioContextRef.current = new AudioContext();
        }
        return audioContextRef.current;
    }, []);

    const cancel = useCallback(() => {
        // Stop recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        // Stop mic stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        // Stop audio playback
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
        // Clear timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        setState("idle");
        setIsSpeaking(false);
        setAnalyserNode(null);
        setMicAnalyser(null);
    }, []);

    const processQuery = useCallback(
        async (userMessage: string) => {
            setState("thinking");
            setError(null);

            try {
                // Add user message to history
                conversationRef.current.push({ role: "user", content: userMessage });

                // Call the AI receptionist
                const res = await fetch("/api/ai/receptionist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: userMessage,
                        history: conversationRef.current,
                    }),
                });

                if (!res.ok) {
                    throw new Error("AI receptionist request failed");
                }

                const data: SheriffAIResponse & { packages?: ServicePackage[] } =
                    await res.json();

                setResponse(data);

                // Update packages if included
                if (data.packages && data.packages.length > 0) {
                    setPackages(data.packages);
                }

                // Add AI response to history
                conversationRef.current.push({
                    role: "assistant",
                    content: data.message,
                });

                // Handle service request creation
                if (data.createServiceRequest && data.captureCustomerInfo) {
                    try {
                        // 1. Create service request in database
                        const srRes = await fetch("/api/service-requests", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                customer_name: data.captureCustomerInfo.name,
                                customer_email: data.captureCustomerInfo.email,
                                customer_phone: data.captureCustomerInfo.phone,
                                company_name: data.captureCustomerInfo.company,
                                service_type: data.serviceDetails.serviceType,
                                location_address: data.serviceDetails.location,
                                location_city: data.serviceDetails.city,
                                location_state: data.serviceDetails.state,
                                num_guards: data.serviceDetails.numGuards,
                                duration_hours: data.serviceDetails.durationHours,
                                start_date: data.serviceDetails.startDate,
                                start_time: data.serviceDetails.startTime,
                                special_requirements: data.serviceDetails.specialRequirements,
                                additional_notes: data.serviceDetails.additionalNotes,
                                package_id: data.pricing.packageId,
                                hourly_rate: data.pricing.hourlyRate,
                                estimated_total: data.pricing.estimatedTotal,
                                ai_transcript: conversationRef.current
                                    .map((m) => `${m.role}: ${m.content}`)
                                    .join("\n"),
                            }),
                        });

                        const sr = await srRes.json();

                        if (sr.success) {
                            setServiceRequest(sr);

                            // 2. Send confirmation emails
                            await fetch("/api/send-invoice", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    requestNumber: sr.request_number,
                                    customerName: data.captureCustomerInfo.name,
                                    customerEmail: data.captureCustomerInfo.email,
                                    customerPhone: data.captureCustomerInfo.phone,
                                    companyName: data.captureCustomerInfo.company,
                                    serviceType: data.serviceDetails.serviceType || "security",
                                    location: data.serviceDetails.location || "To be confirmed",
                                    numGuards: data.serviceDetails.numGuards || 1,
                                    durationHours: data.serviceDetails.durationHours || 0,
                                    hourlyRate: data.pricing.hourlyRate || 0,
                                    estimatedTotal: data.pricing.estimatedTotal || 0,
                                    currency: "PKR",
                                    startDate: data.serviceDetails.startDate,
                                    startTime: data.serviceDetails.startTime,
                                    specialRequirements: data.serviceDetails.specialRequirements,
                                }),
                            });
                        }
                    } catch (err) {
                        console.error("Error creating service request:", err);
                    }
                }

                // Play TTS audio
                if (data.message) {
                    await playTTS(data.message);
                } else {
                    setState("idle");
                }
            } catch (err) {
                console.error("Process query error:", err);
                setError("Something went wrong. Please try again.");
                setState("idle");
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const playTTS = useCallback(
        async (text: string) => {
            try {
                setState("speaking");
                setIsSpeaking(true);

                const ttsRes = await fetch("/api/ai/tts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text }),
                });

                if (!ttsRes.ok) {
                    throw new Error("TTS request failed");
                }

                const audioBlob = await ttsRes.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                currentAudioRef.current = audio;

                // Set up audio analyser for orb visualization
                const audioCtx = getAudioContext();
                if (audioCtx.state === "suspended") {
                    await audioCtx.resume();
                }
                const source = audioCtx.createMediaElementSource(audio);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                analyser.connect(audioCtx.destination);
                setAnalyserNode(analyser);

                // Get duration for subtitles
                audio.addEventListener("loadedmetadata", () => {
                    setAudioDuration(audio.duration);
                });

                audio.addEventListener("ended", () => {
                    setState("idle");
                    setIsSpeaking(false);
                    setAnalyserNode(null);
                    currentAudioRef.current = null;
                    URL.revokeObjectURL(audioUrl);
                });

                audio.addEventListener("error", () => {
                    setState("idle");
                    setIsSpeaking(false);
                    setAnalyserNode(null);
                    currentAudioRef.current = null;
                    URL.revokeObjectURL(audioUrl);
                });

                await audio.play();
            } catch (err) {
                console.error("TTS playback error:", err);
                setState("idle");
                setIsSpeaking(false);
            }
        },
        [getAudioContext]
    );

    const startListening = useCallback(async () => {
        try {
            setError(null);
            audioChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                },
            });

            streamRef.current = stream;
            setState("listening");

            // Set up mic analyser for orb visualization during recording
            const audioCtx = getAudioContext();
            if (audioCtx.state === "suspended") {
                await audioCtx.resume();
            }
            const micSource = audioCtx.createMediaStreamSource(stream);
            const micAnalyserNode = audioCtx.createAnalyser();
            micAnalyserNode.fftSize = 256;
            micSource.connect(micAnalyserNode);
            setMicAnalyser(micAnalyserNode);
            setAnalyserNode(micAnalyserNode);

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                    ? "audio/webm;codecs=opus"
                    : "audio/webm",
            });

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Stop mic stream
                stream.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
                setMicAnalyser(null);

                const audioBlob = new Blob(audioChunksRef.current, {
                    type: "audio/webm",
                });

                if (audioBlob.size < 100) {
                    setError("No audio detected. Please try again.");
                    setState("idle");
                    return;
                }

                // Send to STT
                setState("thinking");

                try {
                    const sttRes = await fetch("/api/ai/speech", {
                        method: "POST",
                        headers: { "Content-Type": "audio/webm" },
                        body: audioBlob,
                    });

                    if (!sttRes.ok) {
                        throw new Error("STT request failed");
                    }

                    const { transcript: sttTranscript } = await sttRes.json();

                    if (!sttTranscript || sttTranscript.trim() === "") {
                        setError("Could not understand the audio. Please try again.");
                        setState("idle");
                        return;
                    }

                    setTranscript(sttTranscript);
                    await processQuery(sttTranscript);
                } catch (err) {
                    console.error("STT error:", err);
                    setError("Failed to process speech. Please try again.");
                    setState("idle");
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(250); // Collect data every 250ms

            // Auto-stop after 15 seconds
            timerRef.current = setTimeout(() => {
                if (
                    mediaRecorderRef.current &&
                    mediaRecorderRef.current.state === "recording"
                ) {
                    mediaRecorderRef.current.stop();
                }
            }, 15000);
        } catch (err) {
            console.error("Start listening error:", err);
            setError(
                "Microphone access denied. Please allow microphone access and try again."
            );
            setState("idle");
        }
    }, [getAudioContext, processQuery]);

    const stopListening = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
        ) {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const sendTextQuery = useCallback(
        async (text: string) => {
            if (!text.trim()) return;
            setTranscript(text);
            await processQuery(text);
        },
        [processQuery]
    );

    return {
        state,
        transcript,
        response,
        error,
        startListening,
        stopListening,
        sendTextQuery,
        cancel,
        analyserNode,
        micAnalyser,
        isSpeaking,
        audioDuration,
        packages,
        serviceRequest,
        conversationHistory: conversationRef.current,
    };
}
