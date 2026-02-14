"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ManagerAIResponse, ManagerAction, ReportResult } from "@/lib/ai/manager-prompts";

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
    reportData: ReportResult | null;
    startListening: () => Promise<void>;
    stopListening: () => void;
    sendTextQuery: (text: string) => Promise<void>;
    confirmAction: () => Promise<void>;
    cancelAction: () => void;
    cancel: () => void;
    clearReport: () => void;
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
    const [reportData, setReportData] = useState<ReportResult | null>(null);

    const conversationRef = useRef<ConversationMessage[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    const ttsAbortRef = useRef<AbortController | null>(null);
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
        if (ttsAbortRef.current) {
            ttsAbortRef.current.abort();
            ttsAbortRef.current = null;
        }
        currentSourcesRef.current.forEach((s) => {
            try { s.stop(); } catch {}
        });
        currentSourcesRef.current = [];
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

                const abortCtrl = new AbortController();
                ttsAbortRef.current = abortCtrl;

                const ttsRes = await fetch("/api/ai/tts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text }),
                    signal: abortCtrl.signal,
                });

                if (!ttsRes.ok) throw new Error("TTS failed");

                const sampleRate = parseInt(ttsRes.headers.get("X-Sample-Rate") || "24000", 10);
                const reader = ttsRes.body?.getReader();
                if (!reader) throw new Error("No TTS stream");

                const audioCtx = getAudioContext();
                if (audioCtx.state === "suspended") await audioCtx.resume();

                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                analyser.connect(audioCtx.destination);
                setAnalyserNode(analyser);

                let nextStartTime = audioCtx.currentTime;
                const sources: AudioBufferSourceNode[] = [];
                currentSourcesRef.current = sources;

                let leftover = new Uint8Array(0);
                let totalScheduled = 0;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (abortCtrl.signal.aborted) break;

                    // Merge leftover bytes
                    const merged = new Uint8Array(leftover.length + value.length);
                    merged.set(leftover, 0);
                    merged.set(value, leftover.length);

                    // PCM 16-bit LE: need even number of bytes
                    const usable = merged.length - (merged.length % 2);
                    leftover = merged.slice(usable);

                    if (usable === 0) continue;

                    const int16 = new Int16Array(merged.buffer, merged.byteOffset, usable / 2);
                    const float32 = new Float32Array(int16.length);
                    for (let i = 0; i < int16.length; i++) {
                        float32[i] = int16[i] / 32768;
                    }

                    const buf = audioCtx.createBuffer(1, float32.length, sampleRate);
                    buf.getChannelData(0).set(float32);

                    const source = audioCtx.createBufferSource();
                    source.buffer = buf;
                    source.connect(analyser);
                    source.start(nextStartTime);
                    sources.push(source);
                    totalScheduled += float32.length;
                    nextStartTime = audioCtx.currentTime + (totalScheduled / sampleRate);
                }

                // Wait for playback to finish
                const remaining = nextStartTime - audioCtx.currentTime;
                if (remaining > 0) {
                    setAudioDuration(remaining);
                    await new Promise((resolve) => setTimeout(resolve, remaining * 1000));
                }

                setState("idle");
                setIsSpeaking(false);
                setAnalyserNode(null);
                currentSourcesRef.current = [];
                ttsAbortRef.current = null;
            } catch (err: unknown) {
                if (err instanceof Error && err.name === "AbortError") return;
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

            const result = await res.json();

            // If this was a report action, store the report data for PDF download
            if (action.entity === "report" && result.report) {
                setReportData(result.report as ReportResult);
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

    const clearReport = useCallback(() => {
        setReportData(null);
    }, []);

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
        reportData,
        startListening,
        stopListening,
        sendTextQuery,
        confirmAction,
        cancelAction,
        cancel,
        clearReport,
        analyserNode,
        isSpeaking,
        audioDuration,
        conversationHistory: conversationRef.current,
    };
}
