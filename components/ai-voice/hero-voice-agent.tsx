"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useVoiceAgent } from "./use-voice-agent";
import type { PendingConfirmation } from "./use-voice-agent";
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
    Edit3,
    Check,
    XCircle,
    AlertCircle,
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
        pendingConfirmation,
        confirmRequest,
        editConfirmation,
        cancelConfirmation,
        emailStatus,
    } = useVoiceAgent();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [textInput, setTextInput] = useState("");
    const [showHistory, setShowHistory] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<PendingConfirmation | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

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
        setIsEditing(false);
        setEditData(null);
    }, [cancel]);

    // Auto-scroll when content changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [pendingConfirmation, serviceRequest, packages, response]);

    // Init edit data when pending confirmation comes in
    useEffect(() => {
        if (pendingConfirmation) {
            setEditData({ ...pendingConfirmation });
        }
    }, [pendingConfirmation]);

    // SVG progress ring calculations
    const circumference = 2 * Math.PI * 54;
    const progress = state === "listening" ? (recordingTime / 15) * circumference : 0;

    return (
        <>
            {/* Floating Voice Agent Button — always visible */}
            <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
                {/* Quick text input */}
                {!isModalOpen && (
                    <form
                        onSubmit={handleTextSubmit}
                        className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-3 py-2 sm:px-4 shadow-2xl"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Ask Aisha..."
                            className="bg-transparent text-white placeholder-white/50 outline-none text-sm w-40 sm:w-48 md:w-64"
                        />
                        <button
                            type="submit"
                            disabled={!textInput.trim() || state !== "idle"}
                            className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 min-w-[36px] min-h-[36px] flex items-center justify-center"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                )}

                {/* Mic button — min 48px touch target */}
                <button
                    onClick={handleMicPress}
                    disabled={state === "thinking" || state === "speaking"}
                    className={`group relative p-4 sm:p-5 rounded-full shadow-2xl transition-all duration-300 min-w-[56px] min-h-[56px] flex items-center justify-center ${state === "listening"
                            ? "bg-red-500 scale-110 animate-pulse"
                            : state === "thinking"
                                ? "bg-amber-500 cursor-wait"
                                : state === "speaking"
                                    ? "bg-emerald-500"
                                    : "bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-110 hover:shadow-indigo-500/50"
                        }`}
                >
                    {state === "listening" ? (
                        <MicOff className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    ) : state === "thinking" ? (
                        <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 text-white animate-spin" />
                    ) : (
                        <Mic className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
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
                            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                            <circle cx="60" cy="60" r="54" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - progress} transform="rotate(-90 60 60)" className="transition-all duration-100" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Voice Agent Modal — mobile-first responsive */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal content — full width on mobile, max-w-lg on desktop */}
                    <div className="relative w-full sm:mx-4 sm:max-w-lg bg-gradient-to-b from-gray-900 to-black rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh] sm:max-h-[85vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
                                <div>
                                    <h3 className="text-white font-semibold text-sm">
                                        Aisha
                                    </h3>
                                    <p className="text-white/50 text-xs">
                                        Sheriff Security AI
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
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                >
                                    <X className="h-5 w-5 text-white/50" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable content area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
                            {/* Orb + Subtitles */}
                            <div className="flex flex-col items-center py-4 sm:py-6">
                                <VoiceOrb analyserNode={analyserNode} state={state} size={typeof window !== "undefined" && window.innerWidth < 640 ? 120 : 180} />

                                {/* Transcript (what user said) */}
                                {transcript && state !== "idle" && (
                                    <div className="mt-3 sm:mt-4 px-4 sm:px-6 w-full">
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
                                    <p className="text-red-400 text-sm text-center mt-3 px-4 sm:px-6">
                                        {error}
                                    </p>
                                )}
                            </div>

                            {/* Pending Confirmation Card — editable */}
                            {pendingConfirmation && !serviceRequest && (
                                <div className="mx-4 sm:mx-6 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5 text-amber-400" />
                                            <h4 className="text-amber-300 font-semibold text-sm">
                                                Review &amp; Confirm
                                            </h4>
                                        </div>
                                        <button
                                            onClick={() => setIsEditing(!isEditing)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {isEditing && editData ? (
                                        <div className="space-y-2 mb-3">
                                            <input
                                                type="text"
                                                value={editData.customerInfo.name}
                                                onChange={(e) => setEditData({
                                                    ...editData,
                                                    customerInfo: { ...editData.customerInfo, name: e.target.value }
                                                })}
                                                placeholder="Full Name"
                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-500/50"
                                            />
                                            <input
                                                type="email"
                                                value={editData.customerInfo.email}
                                                onChange={(e) => setEditData({
                                                    ...editData,
                                                    customerInfo: { ...editData.customerInfo, email: e.target.value }
                                                })}
                                                placeholder="Email"
                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-500/50"
                                            />
                                            <input
                                                type="tel"
                                                value={editData.customerInfo.phone || ""}
                                                onChange={(e) => setEditData({
                                                    ...editData,
                                                    customerInfo: { ...editData.customerInfo, phone: e.target.value || null }
                                                })}
                                                placeholder="Phone"
                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-500/50"
                                            />
                                            <input
                                                type="text"
                                                value={editData.serviceDetails.location || ""}
                                                onChange={(e) => setEditData({
                                                    ...editData,
                                                    serviceDetails: { ...editData.serviceDetails, location: e.target.value }
                                                })}
                                                placeholder="Location"
                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-500/50"
                                            />
                                            <button
                                                onClick={() => {
                                                    if (editData) editConfirmation(editData);
                                                    setIsEditing(false);
                                                }}
                                                className="w-full py-2 bg-amber-500/20 text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition-colors min-h-[44px]"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                            <div className="bg-black/30 rounded-lg p-2">
                                                <p className="text-white/50">Name</p>
                                                <p className="text-white font-medium">{pendingConfirmation.customerInfo.name}</p>
                                            </div>
                                            <div className="bg-black/30 rounded-lg p-2">
                                                <p className="text-white/50">Email</p>
                                                <p className="text-white text-xs break-all">{pendingConfirmation.customerInfo.email}</p>
                                            </div>
                                            <div className="bg-black/30 rounded-lg p-2">
                                                <p className="text-white/50">Service</p>
                                                <p className="text-white font-medium capitalize">{pendingConfirmation.serviceDetails.serviceType || "Security"}</p>
                                            </div>
                                            <div className="bg-black/30 rounded-lg p-2">
                                                <p className="text-white/50">Total</p>
                                                <p className="text-emerald-400 font-bold">PKR {(pendingConfirmation.pricing.estimatedTotal || 0).toLocaleString()}</p>
                                            </div>
                                            {pendingConfirmation.serviceDetails.location && (
                                                <div className="bg-black/30 rounded-lg p-2 col-span-2">
                                                    <p className="text-white/50"><MapPin className="h-3 w-3 inline mr-1" />Location</p>
                                                    <p className="text-white text-xs">{pendingConfirmation.serviceDetails.location}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Confirm / Cancel buttons — 44px+ touch targets */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={confirmRequest}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors min-h-[48px]"
                                        >
                                            <Check className="h-4 w-4" />
                                            Confirm
                                        </button>
                                        <button
                                            onClick={cancelConfirmation}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 text-white/70 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors min-h-[48px]"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Cancel
                                        </button>
                                    </div>
                                    <p className="text-white/30 text-xs text-center mt-2">
                                        Or say &quot;confirm&quot; to proceed
                                    </p>
                                </div>
                            )}

                            {/* Service Request Confirmed Card */}
                            {serviceRequest && (
                                <div className="mx-4 sm:mx-6 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
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
                                            <p className="text-white/50">Email Status</p>
                                            <p className={`font-medium ${emailStatus === "sent" ? "text-emerald-400" : emailStatus === "sending" ? "text-amber-400" : emailStatus === "failed" ? "text-red-400" : "text-white/50"}`}>
                                                {emailStatus === "sent" ? "Sent ✓" : emailStatus === "sending" ? "Sending..." : emailStatus === "failed" ? "Failed" : "Pending"}
                                            </p>
                                        </div>
                                        <div className="bg-black/30 rounded-lg p-2 col-span-2">
                                            <p className="text-white/50">
                                                <Mail className="h-3 w-3 inline mr-1" />
                                                Confirmation sent to
                                            </p>
                                            <p className="text-white text-xs">
                                                {serviceRequest.customer_email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Service Package Cards */}
                            {packages.length > 0 && !serviceRequest && !pendingConfirmation && (
                                <div className="mx-4 sm:mx-6 mb-4">
                                    <p className="text-white/50 text-xs mb-2">
                                        Available Packages:
                                    </p>
                                    <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto pr-1">
                                        {packages.map((pkg) => (
                                            <div
                                                key={pkg.id}
                                                className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <h5 className="text-white font-medium text-sm">
                                                        {pkg.name}
                                                    </h5>
                                                    <span className="text-indigo-300 font-bold text-sm whitespace-nowrap ml-2">
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
                                <div className="mx-4 sm:mx-6 mb-4">
                                    <button
                                        onClick={() => setShowHistory(!showHistory)}
                                        className="flex items-center gap-1 text-white/40 text-xs hover:text-white/60 transition-colors py-1"
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
                                                        {msg.role === "user" ? "You" : "Aisha"}
                                                    </span>
                                                    {msg.content}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom controls — sticky */}
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 flex items-center gap-2 sm:gap-3 shrink-0">
                            <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder={pendingConfirmation ? "Say 'confirm' or 'cancel'..." : "Type your message..."}
                                    disabled={state !== "idle"}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-white text-sm placeholder-white/30 outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50 min-h-[44px]"
                                />
                                <button
                                    type="submit"
                                    disabled={!textInput.trim() || state !== "idle"}
                                    className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>

                            <button
                                onClick={handleMicPress}
                                disabled={state === "thinking" || state === "speaking"}
                                className={`p-2.5 rounded-xl transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${state === "listening"
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
