"use client";

import { useState, useRef, useCallback } from "react";
import { useDashboardVoice } from "./use-dashboard-voice";
import { VoiceOrb } from "./voice-orb";
import { VoiceSubtitles } from "./voice-subtitles";
import {
    Mic,
    MicOff,
    X,
    Send,
    Check,
    XCircle,
    Shield,
    Loader2,
    ChevronUp,
    ChevronDown,
    MessageSquare,
} from "lucide-react";

export function DashboardVoiceAgent() {
    const {
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
        conversationHistory,
    } = useDashboardVoice();

    const [isExpanded, setIsExpanded] = useState(false);
    const [textInput, setTextInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleMicPress = useCallback(async () => {
        if (state === "listening") {
            stopListening();
        } else if (state === "idle") {
            setIsExpanded(true);
            await startListening();
        }
    }, [state, startListening, stopListening]);

    const handleTextSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!textInput.trim() || state !== "idle") return;
            setIsExpanded(true);
            const query = textInput;
            setTextInput("");
            await sendTextQuery(query);
        },
        [textInput, state, sendTextQuery]
    );

    const handleClose = useCallback(() => {
        cancel();
        setIsExpanded(false);
    }, [cancel]);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Expanded Panel */}
            {isExpanded && (
                <div className="mb-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                    {/* Panel Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary-600 text-white">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span className="text-sm font-medium">Dashboard Assistant</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${state === "idle"
                                        ? "bg-white/20"
                                        : state === "listening"
                                            ? "bg-red-500/30"
                                            : state === "thinking"
                                                ? "bg-amber-500/30"
                                                : "bg-emerald-500/30"
                                    }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${state === "idle"
                                            ? "bg-white"
                                            : state === "listening"
                                                ? "bg-red-300 animate-pulse"
                                                : state === "thinking"
                                                    ? "bg-amber-300 animate-pulse"
                                                    : "bg-emerald-300 animate-pulse"
                                        }`}
                                />
                                {state === "idle"
                                    ? "Ready"
                                    : state === "listening"
                                        ? "Listening"
                                        : state === "thinking"
                                            ? "Thinking"
                                            : "Speaking"}
                            </span>
                            <button
                                onClick={handleClose}
                                className="p-1 rounded hover:bg-white/20 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Orb + Response */}
                    <div className="flex flex-col items-center py-4 px-4">
                        <VoiceOrb analyserNode={analyserNode} state={state} size={120} />

                        {/* Transcript */}
                        {transcript && state !== "idle" && (
                            <p className="text-gray-500 text-xs text-center mt-2 italic">
                                &quot;{transcript}&quot;
                            </p>
                        )}

                        {/* AI response */}
                        {response?.message && (state === "speaking" || state === "idle") && (
                            <div className="mt-3 w-full">
                                <VoiceSubtitles
                                    text={response.message}
                                    isPlaying={isSpeaking}
                                    audioDuration={audioDuration}
                                />
                                {/* Fallback text display when not speaking */}
                                {state === "idle" && (
                                    <p className="text-gray-700 text-sm text-center mt-1">
                                        {response.message}
                                    </p>
                                )}
                            </div>
                        )}

                        {error && (
                            <p className="text-red-500 text-xs text-center mt-2">{error}</p>
                        )}
                    </div>

                    {/* Pending Action Confirmation */}
                    {pendingAction && (
                        <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                            <p className="text-sm font-medium text-amber-800 mb-2">
                                Confirm Action
                            </p>
                            <p className="text-xs text-amber-700 mb-3">
                                {pendingAction.type.charAt(0).toUpperCase() +
                                    pendingAction.type.slice(1)}{" "}
                                {pendingAction.entity}?
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={confirmAction}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                                >
                                    <Check className="h-3 w-3" />
                                    Confirm
                                </button>
                                <button
                                    onClick={cancelAction}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors"
                                >
                                    <XCircle className="h-3 w-3" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Conversation history */}
                    {conversationHistory.length > 0 && (
                        <div className="mx-4 mb-3 max-h-32 overflow-y-auto space-y-1">
                            {conversationHistory.slice(-4).map((msg, i) => (
                                <div
                                    key={i}
                                    className={`text-xs px-2.5 py-1.5 rounded-lg ${msg.role === "user"
                                            ? "bg-primary/5 text-primary ml-6"
                                            : "bg-gray-50 text-gray-600 mr-6"
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Input controls */}
                    <div className="px-3 py-3 border-t flex items-center gap-2">
                        <form onSubmit={handleTextSubmit} className="flex-1 flex gap-1.5">
                            <input
                                ref={inputRef}
                                type="text"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Type a command..."
                                disabled={state !== "idle"}
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!textInput.trim() || state !== "idle"}
                                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30"
                            >
                                <Send className="h-3.5 w-3.5" />
                            </button>
                        </form>
                        <button
                            onClick={handleMicPress}
                            disabled={state === "thinking" || state === "speaking"}
                            className={`p-2 rounded-lg transition-all ${state === "listening"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                } disabled:opacity-30`}
                        >
                            {state === "listening" ? (
                                <MicOff className="h-4 w-4" />
                            ) : (
                                <Mic className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Mic Button */}
            {!isExpanded && (
                <button
                    onClick={handleMicPress}
                    className="group relative p-4 rounded-full bg-gradient-to-br from-primary to-primary-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                    <MessageSquare className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                </button>
            )}
        </div>
    );
}
