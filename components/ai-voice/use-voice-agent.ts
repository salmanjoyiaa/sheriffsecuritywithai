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

export interface PendingConfirmation {
    customerInfo: {
        name: string;
        email: string;
        phone: string | null;
        company: string | null;
    };
    serviceDetails: SheriffAIResponse["serviceDetails"];
    pricing: SheriffAIResponse["pricing"];
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
    pendingConfirmation: PendingConfirmation | null;
    confirmRequest: () => Promise<void>;
    editConfirmation: (updated: PendingConfirmation) => void;
    cancelConfirmation: () => void;
    emailStatus: "none" | "sending" | "sent" | "failed";
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
    const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
    const [emailStatus, setEmailStatus] = useState<"none" | "sending" | "sent" | "failed">("none");

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

                // Instead of auto-creating, show confirmation card for user approval
                if (data.createServiceRequest && data.captureCustomerInfo) {
                    setPendingConfirmation({
                        customerInfo: {
                            name: data.captureCustomerInfo.name,
                            email: data.captureCustomerInfo.email,
                            phone: data.captureCustomerInfo.phone,
                            company: data.captureCustomerInfo.company,
                        },
                        serviceDetails: data.serviceDetails,
                        pricing: data.pricing,
                    });
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
        [playTTS]
    );

    // Submit confirmed service request + send emails via PUBLIC route
    const submitServiceRequest = useCallback(
        async (confirmation: PendingConfirmation) => {
            try {
                const srRes = await fetch("/api/service-requests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        customer_name: confirmation.customerInfo.name,
                        customer_email: confirmation.customerInfo.email,
                        customer_phone: confirmation.customerInfo.phone,
                        company_name: confirmation.customerInfo.company,
                        service_type: confirmation.serviceDetails.serviceType,
                        location_address: confirmation.serviceDetails.location,
                        location_city: confirmation.serviceDetails.city,
                        location_state: confirmation.serviceDetails.state,
                        num_guards: confirmation.serviceDetails.numGuards,
                        duration_hours: confirmation.serviceDetails.durationHours,
                        start_date: confirmation.serviceDetails.startDate,
                        start_time: confirmation.serviceDetails.startTime,
                        special_requirements: confirmation.serviceDetails.specialRequirements,
                        additional_notes: confirmation.serviceDetails.additionalNotes,
                        package_id: confirmation.pricing.packageId,
                        hourly_rate: confirmation.pricing.hourlyRate,
                        estimated_total: confirmation.pricing.estimatedTotal,
                        ai_transcript: conversationRef.current
                            .map((m) => `${m.role}: ${m.content}`)
                            .join("\n"),
                    }),
                });

                const sr = await srRes.json();

                if (sr.success) {
                    setServiceRequest(sr);

                    // Send emails via public route (no auth needed)
                    setEmailStatus("sending");
                    // Track sending status in DB
                    fetch("/api/service-requests", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: sr.id, email_status: "sending" }),
                    }).catch(() => {});

                    try {
                        const emailRes = await fetch("/api/public/send-confirmation", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                requestNumber: sr.request_number,
                                customerName: confirmation.customerInfo.name,
                                customerEmail: confirmation.customerInfo.email,
                                customerPhone: confirmation.customerInfo.phone,
                                companyName: confirmation.customerInfo.company,
                                serviceType: confirmation.serviceDetails.serviceType || "security",
                                location: confirmation.serviceDetails.location || "To be confirmed",
                                numGuards: confirmation.serviceDetails.numGuards || 1,
                                durationHours: confirmation.serviceDetails.durationHours || 0,
                                hourlyRate: confirmation.pricing.hourlyRate || 0,
                                estimatedTotal: confirmation.pricing.estimatedTotal || 0,
                                currency: "PKR",
                                startDate: confirmation.serviceDetails.startDate,
                                startTime: confirmation.serviceDetails.startTime,
                                specialRequirements: confirmation.serviceDetails.specialRequirements,
                            }),
                        });
                        const finalStatus = emailRes.ok ? "sent" : "failed";
                        setEmailStatus(finalStatus);
                        // Track final status in DB
                        fetch("/api/service-requests", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: sr.id, email_status: finalStatus }),
                        }).catch(() => {});
                    } catch {
                        setEmailStatus("failed");
                        fetch("/api/service-requests", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: sr.id, email_status: "failed" }),
                        }).catch(() => {});
                    }

                    await playTTS("Your service request has been confirmed! A confirmation email is on its way. Our team will contact you within one hour.");
                }
            } catch (err) {
                console.error("Error creating service request:", err);
                setError("Failed to create service request.");
            }
        },
        [playTTS]
    );

    // User confirms pending request (button or voice "confirm")
    const confirmRequest = useCallback(async () => {
        if (!pendingConfirmation) return;
        const conf = pendingConfirmation;
        setPendingConfirmation(null);
        await submitServiceRequest(conf);
    }, [pendingConfirmation, submitServiceRequest]);

    // User edits pending confirmation
    const editConfirmation = useCallback((updated: PendingConfirmation) => {
        setPendingConfirmation(updated);
    }, []);

    // User cancels
    const cancelConfirmation = useCallback(() => {
        setPendingConfirmation(null);
        // Don't call playTTS in cancelConfirmation to avoid circular dependency
    }, []);

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

            // Handle confirm/cancel for pending confirmation via text
            if (pendingConfirmation) {
                const lower = text.toLowerCase().trim();
                if (lower === "confirm" || lower === "yes" || lower === "go ahead" || lower === "confirmed") {
                    await confirmRequest();
                    return;
                }
                if (lower === "cancel" || lower === "no" || lower === "nevermind") {
                    cancelConfirmation();
                    return;
                }
            }

            await processQuery(text);
        },
        [processQuery, pendingConfirmation, confirmRequest, cancelConfirmation]
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
        pendingConfirmation,
        confirmRequest,
        editConfirmation,
        cancelConfirmation,
        emailStatus,
    };
}
