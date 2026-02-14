"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useVoiceAgent } from "./use-voice-agent";
import { VoiceOrb } from "./voice-orb";
import { VoiceSubtitles } from "./voice-subtitles";
import {
    Mic,
    MicOff,
    X,
    Send,
    CheckCircle2,
    Shield,
    Clock,
    Users,
    MapPin,
    Mail,
    Phone,
    ChevronDown,
    Loader2,
} from "lucide-react";

export function HeroVoiceAgent() {
    const {
        state,
        transcript,
        response,
        error,
        startListening,
        stopListening,
        sendTextQuery,
        cancel,
        analyserNode,
        isSpeaking,
        audioDuration,
        packages,
        serviceRequest,
        conversationHistory,
    } = useVoiceAgent();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [textInput, setTextInput] = useState("");
    const [showHistory, setShowHistory] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Recording timer
    useEffect(() => {
        if (state === "listening") {
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev >= 15) {
                        stopListening();
                        return 15;
                    }
                    return prev + 0.1;
                });
            }, 100);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [state, stopListening]);

    const handleMicPress = useCallback(async () => {
        if (state === "listening") {
            stopListening();
        } else if (state === "idle") {
            setIsModalOpen(true);
            await startListening();
        }
    }, [state, startListening, stopListening]);

    const handleTextSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!textInput.trim() || state !== "idle") return;
            setIsModalOpen(true);
            const query = textInput;
            setTextInput("");
            await sendTextQuery(query);
        },
        [textInput, state, sendTextQuery]
    );

    const handleClose = useCallback(() => {
        cancel();
        setIsModalOpen(false);
        setShowHistory(false);
    }, [cancel]);

    // SVG progress ring calculations
    const circumference = 2 * Math.PI * 54;
    const progress = state === "listening" ? (recordingTime / 15) * circumference : 0;

    return (
        <>
            {/* Floating Voice Agent Button — always visible */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                {/* Quick text input */}
                {!isModalOpen && (
                    <form
                        onSubmit={handleTextSubmit}
                        className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 py-2 shadow-2xl"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Ask Officer Mike..."
                            className="bg-transparent text-white placeholder-white/50 outline-none text-sm w-48 md:w-64"
                        />
                        <button
                            type="submit"
                            disabled={!textInput.trim() || state !== "idle"}
                            className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                )}

                {/* Mic button */}
                <button
                    onClick={handleMicPress}
                    disabled={state === "thinking" || state === "speaking"}
                    className={`group relative p-5 rounded-full shadow-2xl transition-all duration-300 ${state === "listening"
                            ? "bg-red-500 scale-110 animate-pulse"
                            : state === "thinking"
                                ? "bg-amber-500 cursor-wait"
                                : state === "speaking"
                                    ? "bg-emerald-500"
                                    : "bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-110 hover:shadow-indigo-500/50"
                        }`}
                >
                    {state === "listening" ? (
                        <MicOff className="h-7 w-7 text-white" />
                    ) : state === "thinking" ? (
                        <Loader2 className="h-7 w-7 text-white animate-spin" />
                    ) : (
                        <Mic className="h-7 w-7 text-white" />
                    )}

                    {/* Pulse rings */}
                    {state === "idle" && (
                        <>
                            <span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping" />
                            <span className="absolute -inset-1 rounded-full bg-indigo-500/10 animate-pulse" />
                        </>
                    )}

                    {/* Recording progress ring */}
                    {state === "listening" && (
                        <svg
                            className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)]"
                            viewBox="0 0 120 120"
                        >
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth="3"
                            />
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference - progress}
                                transform="rotate(-90 60 60)"
                                className="transition-all duration-100"
                            />
                        </svg>
                    )}
                </button>
            </div>

            {/* Voice Agent Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal content */}
                    <div className="relative w-full max-w-lg bg-gradient-to-b from-gray-900 to-black rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <Shield className="h-6 w-6 text-indigo-400" />
                                <div>
                                    <h3 className="text-white font-semibold text-sm">
                                        Officer Mike
                                    </h3>
                                    <p className="text-white/50 text-xs">
                                        Sheriff Security AI Assistant
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${state === "idle"
                                            ? "bg-indigo-500/20 text-indigo-300"
                                            : state === "listening"
                                                ? "bg-red-500/20 text-red-300"
                                                : state === "thinking"
                                                    ? "bg-amber-500/20 text-amber-300"
                                                    : "bg-emerald-500/20 text-emerald-300"
                                        }`}
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${state === "idle"
                                                ? "bg-indigo-400"
                                                : state === "listening"
                                                    ? "bg-red-400 animate-pulse"
                                                    : state === "thinking"
                                                        ? "bg-amber-400 animate-pulse"
                                                        : "bg-emerald-400 animate-pulse"
                                            }`}
                                    />
                                    {state === "idle"
                                        ? "Ready"
                                        : state === "listening"
                                            ? `Recording ${Math.ceil(15 - recordingTime)}s`
                                            : state === "thinking"
                                                ? "Thinking..."
                                                : "Speaking..."}
                                </span>
                                <button
                                    onClick={handleClose}
                                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <X className="h-4 w-4 text-white/50" />
                                </button>
                            </div>
                        </div>

                        {/* Orb + Subtitles */}
                        <div className="flex flex-col items-center py-8">
                            <VoiceOrb analyserNode={analyserNode} state={state} size={180} />

                            {/* Transcript (what user said) */}
                            {transcript && state !== "idle" && (
                                <div className="mt-4 px-6 w-full">
                                    <p className="text-white/60 text-xs text-center mb-1">
                                        You said:
                                    </p>
                                    <p className="text-white/80 text-sm text-center italic">
                                        &quot;{transcript}&quot;
                                    </p>
                                </div>
                            )}

                            {/* AI response subtitles */}
                            {response?.message && (state === "speaking" || state === "idle") && (
                                <VoiceSubtitles
                                    text={response.message}
                                    isPlaying={isSpeaking}
                                    audioDuration={audioDuration}
                                />
                            )}

                            {/* Error message */}
                            {error && (
                                <p className="text-red-400 text-sm text-center mt-4 px-6">
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* Service Request Confirmation Card */}
                        {serviceRequest && (
                            <div className="mx-6 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                    <h4 className="text-emerald-300 font-semibold text-sm">
                                        Service Request Created!
                                    </h4>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-black/30 rounded-lg p-2">
                                        <p className="text-white/50">Request #</p>
                                        <p className="text-white font-mono font-bold">
                                            {serviceRequest.request_number}
                                        </p>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-2">
                                        <p className="text-white/50">Status</p>
                                        <p className="text-emerald-400 font-medium">Confirmed</p>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-2 col-span-2">
                                        <p className="text-white/50">
                                            <Mail className="h-3 w-3 inline mr-1" />
                                            Invoice sent to
                                        </p>
                                        <p className="text-white text-xs">
                                            {serviceRequest.customer_email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Service Package Cards */}
                        {packages.length > 0 && !serviceRequest && (
                            <div className="mx-6 mb-4">
                                <p className="text-white/50 text-xs mb-2">
                                    Available Packages:
                                </p>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {packages.map((pkg) => (
                                        <div
                                            key={pkg.id}
                                            className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-white font-medium text-sm">
                                                    {pkg.name}
                                                </h5>
                                                <span className="text-indigo-300 font-bold text-sm">
                                                    PKR {pkg.base_rate}/hr
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {pkg.includes?.slice(0, 3).map((item, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-white/40 text-xs bg-white/5 px-2 py-0.5 rounded"
                                                    >
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Conversation History Toggle */}
                        {conversationHistory.length > 0 && (
                            <div className="mx-6 mb-4">
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="flex items-center gap-1 text-white/40 text-xs hover:text-white/60 transition-colors"
                                >
                                    <ChevronDown
                                        className={`h-3 w-3 transition-transform ${showHistory ? "rotate-180" : ""}`}
                                    />
                                    Conversation ({conversationHistory.length} messages)
                                </button>
                                {showHistory && (
                                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                        {conversationHistory.map((msg, i) => (
                                            <div
                                                key={i}
                                                className={`text-xs px-3 py-2 rounded-lg ${msg.role === "user"
                                                        ? "bg-indigo-500/10 text-indigo-200 ml-8"
                                                        : "bg-white/5 text-white/70 mr-8"
                                                    }`}
                                            >
                                                <span className="font-medium text-white/40 text-xs block mb-0.5">
                                                    {msg.role === "user" ? "You" : "Officer Mike"}
                                                </span>
                                                {msg.content}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bottom controls */}
                        <div className="px-6 py-4 border-t border-white/10 flex items-center gap-3">
                            <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Type your message..."
                                    disabled={state !== "idle"}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={!textInput.trim() || state !== "idle"}
                                    className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors disabled:opacity-30"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>

                            <button
                                onClick={handleMicPress}
                                disabled={state === "thinking" || state === "speaking"}
                                className={`p-2.5 rounded-xl transition-all ${state === "listening"
                                        ? "bg-red-500 text-white"
                                        : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                                    } disabled:opacity-30`}
                            >
                                {state === "listening" ? (
                                    <MicOff className="h-5 w-5" />
                                ) : (
                                    <Mic className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
