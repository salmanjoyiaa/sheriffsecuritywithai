"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ManagerAIResponse, ManagerAction } from "@/lib/ai/manager-prompts";

export type DashboardVoiceState = "idle" | "listening" | "thinking" | "speaking";

interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
}

interface UseDashboardVoiceReturn {
    state: DashboardVoiceState;
    transcript: string;
    response: ManagerAIResponse | null;
    error: string | null;
    pendingAction: ManagerAction | null;
    startListening: () => Promise<void>;
    stopListening: () => void;
    sendTextQuery: (text: string) => Promise<void>;
    confirmAction: () => Promise<void>;
    cancelAction: () => void;
    cancel: () => void;
    analyserNode: AnalyserNode | null;
    isSpeaking: boolean;
    audioDuration: number;
    conversationHistory: ConversationMessage[];
}

export function useDashboardVoice(): UseDashboardVoiceReturn {
    const [state, setState] = useState<DashboardVoiceState>("idle");
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState<ManagerAIResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioDuration, setAudioDuration] = useState(0);
    const [pendingAction, setPendingAction] = useState<ManagerAction | null>(null);

    const conversationRef = useRef<ConversationMessage[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setState("idle");
        setIsSpeaking(false);
        setAnalyserNode(null);
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

                if (!ttsRes.ok) throw new Error("TTS failed");

                const audioBlob = await ttsRes.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                currentAudioRef.current = audio;

                const audioCtx = getAudioContext();
                if (audioCtx.state === "suspended") await audioCtx.resume();
                const source = audioCtx.createMediaElementSource(audio);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                analyser.connect(audioCtx.destination);
                setAnalyserNode(analyser);

                audio.addEventListener("loadedmetadata", () => setAudioDuration(audio.duration));
                audio.addEventListener("ended", () => {
                    setState("idle");
                    setIsSpeaking(false);
                    setAnalyserNode(null);
                    currentAudioRef.current = null;
                    URL.revokeObjectURL(audioUrl);
                });

                await audio.play();
            } catch {
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
                conversationRef.current.push({ role: "user", content: userMessage });

                const res = await fetch("/api/ai/manager", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: userMessage,
                        history: conversationRef.current,
                    }),
                });

                if (!res.ok) throw new Error("Manager AI request failed");

                const data: ManagerAIResponse = await res.json();
                setResponse(data);

                conversationRef.current.push({ role: "assistant", content: data.message });

                // If there's an action that requires confirmation, store it
                if (data.action && data.action.requiresConfirmation && !data.confirmed) {
                    setPendingAction(data.action);
                }

                // If confirmed, execute the action
                if (data.confirmed && data.action) {
                    await executeAction(data.action);
                }

                if (data.message) {
                    await playTTS(data.message);
                } else {
                    setState("idle");
                }
            } catch (err) {
                console.error("Dashboard voice error:", err);
                setError("Something went wrong. Please try again.");
                setState("idle");
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [playTTS]
    );

    const executeAction = useCallback(async (action: ManagerAction) => {
        try {
            // Build FormData to call existing server actions pattern
            const formData = new FormData();

            if (action.data) {
                Object.entries(action.data).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        formData.append(key, String(value));
                    }
                });
            }

            // Call the appropriate API endpoint based on entity and type
            const res = await fetch("/api/ai/manager/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    actionType: action.type,
                    entity: action.entity,
                    data: action.data,
                }),
            });

            if (!res.ok) {
                const errBody = await res.json();
                throw new Error(errBody.error || "Action failed");
            }

            setPendingAction(null);
        } catch (err) {
            console.error("Execute action error:", err);
            setError(`Failed to ${action.type} ${action.entity}. ${err}`);
        }
    }, []);

    const confirmAction = useCallback(async () => {
        if (!pendingAction) return;
        // Send "yes" to the AI to trigger confirmed=true
        await processQuery("Yes, confirm");
        setPendingAction(null);
    }, [pendingAction, processQuery]);

    const cancelAction = useCallback(() => {
        setPendingAction(null);
        processQuery("No, cancel that");
    }, [processQuery]);

    const startListening = useCallback(async () => {
        try {
            setError(null);
            audioChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
            });

            streamRef.current = stream;
            setState("listening");

            const audioCtx = getAudioContext();
            if (audioCtx.state === "suspended") await audioCtx.resume();
            const micSource = audioCtx.createMediaStreamSource(stream);
            const micAnalyser = audioCtx.createAnalyser();
            micAnalyser.fftSize = 256;
            micSource.connect(micAnalyser);
            setAnalyserNode(micAnalyser);

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                    ? "audio/webm;codecs=opus"
                    : "audio/webm",
            });

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop());
                streamRef.current = null;

                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                if (audioBlob.size < 100) {
                    setError("No audio detected.");
                    setState("idle");
                    return;
                }

                setState("thinking");

                try {
                    const sttRes = await fetch("/api/ai/speech", {
                        method: "POST",
                        headers: { "Content-Type": "audio/webm" },
                        body: audioBlob,
                    });

                    if (!sttRes.ok) throw new Error("STT failed");

                    const { transcript: sttTranscript } = await sttRes.json();
                    if (!sttTranscript?.trim()) {
                        setError("Could not understand. Please try again.");
                        setState("idle");
                        return;
                    }

                    setTranscript(sttTranscript);
                    await processQuery(sttTranscript);
                } catch {
                    setError("Speech processing failed.");
                    setState("idle");
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(250);

            timerRef.current = setTimeout(() => {
                if (mediaRecorderRef.current?.state === "recording") {
                    mediaRecorderRef.current.stop();
                }
            }, 15000);
        } catch {
            setError("Microphone access denied.");
            setState("idle");
        }
    }, [getAudioContext, processQuery]);

    const stopListening = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (mediaRecorderRef.current?.state === "recording") {
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
        pendingAction,
        startListening,
        stopListening,
        sendTextQuery,
        confirmAction,
        cancelAction,
        cancel,
        analyserNode,
        isSpeaking,
        audioDuration,
        conversationHistory: conversationRef.current,
    };
}
