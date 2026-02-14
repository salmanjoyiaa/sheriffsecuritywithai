"use client";

import { useCallback } from "react";
import { Mic, Shield, Headphones, MessageCircle } from "lucide-react";

export function TalkToUsSection() {
    const handleMicClick = useCallback(() => {
        // Dispatch custom event that HeroVoiceAgent listens for
        window.dispatchEvent(new CustomEvent("open-voice-agent"));
    }, []);

    return (
        <section className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.3'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20.5z'/%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
            </div>

            {/* Floating decorative shields */}
            <div className="hidden md:block absolute top-8 left-8 opacity-10 animate-float">
                <Shield className="w-16 h-16 text-indigo-400" />
            </div>
            <div className="hidden md:block absolute bottom-8 right-8 opacity-10 animate-float-delayed">
                <Shield className="w-20 h-20 text-purple-400" />
            </div>
            <div className="hidden lg:block absolute top-1/2 left-12 -translate-y-1/2 opacity-5">
                <Headphones className="w-24 h-24 text-indigo-300" />
            </div>
            <div className="hidden lg:block absolute top-1/2 right-12 -translate-y-1/2 opacity-5">
                <MessageCircle className="w-20 h-20 text-purple-300" />
            </div>

            <div className="container relative px-4">
                <div className="max-w-3xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 mb-4 sm:mb-6 bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/30 rounded-full px-4 py-2">
                        <Headphones className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs sm:text-sm font-semibold text-indigo-300 uppercase tracking-wider">
                            AI-Powered Security Consultant
                        </span>
                    </div>

                    {/* Heading */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                        Talk to Us{" "}
                        <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent animate-gradient">
                            Right Now
                        </span>
                    </h2>

                    {/* Subtitle */}
                    <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
                        Meet <span className="text-indigo-300 font-semibold">Aisha</span>, your AI security consultant.
                        Get instant quotes, explore our packages, and book services — all through voice.
                    </p>

                    {/* Mic Button — large, centered */}
                    <div className="relative inline-flex flex-col items-center">
                        {/* Outer pulse rings */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-indigo-500/20 animate-ping" />
                            <span className="absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-indigo-500/10 animate-pulse" />
                        </div>

                        <button
                            onClick={handleMicClick}
                            className="relative z-10 group w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center"
                            aria-label="Talk to Aisha - AI Security Consultant"
                        >
                            <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white group-hover:scale-110 transition-transform" />

                            {/* Rotating ring */}
                            <div className="absolute -inset-2 rounded-full border-2 border-dashed border-indigo-400/40 animate-spin-very-slow" />
                        </button>

                        {/* Label below mic */}
                        <p className="mt-6 text-white/60 text-sm sm:text-base font-medium flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Tap the mic to start talking
                        </p>
                    </div>

                    {/* Feature chips */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-8 sm:mt-10">
                        {[
                            "Instant Quotes",
                            "24/7 Available",
                            "Voice & Text",
                            "Book in 2 Minutes",
                        ].map((feature) => (
                            <span
                                key={feature}
                                className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs sm:text-sm text-white/70 backdrop-blur-sm"
                            >
                                <span className="w-1 h-1 rounded-full bg-indigo-400" />
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        </section>
    );
}
