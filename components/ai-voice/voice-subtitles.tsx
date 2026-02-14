"use client";

import { useEffect, useState, useRef } from "react";

interface VoiceSubtitlesProps {
    text: string;
    isPlaying: boolean;
    audioDuration?: number;
}

export function VoiceSubtitles({ text, isPlaying, audioDuration }: VoiceSubtitlesProps) {
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const words = text ? text.split(/\s+/).filter(Boolean) : [];

    useEffect(() => {
        if (!isPlaying || words.length === 0) {
            setHighlightIndex(-1);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Estimate time per word based on audio duration or default
        const totalDuration = audioDuration || (words.length * 0.3); // ~300ms per word
        const timePerWord = (totalDuration / words.length) * 1000;

        let currentIndex = 0;
        setHighlightIndex(0);

        intervalRef.current = setInterval(() => {
            currentIndex++;
            if (currentIndex >= words.length) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                return;
            }
            setHighlightIndex(currentIndex);
        }, timePerWord);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isPlaying, text, audioDuration, words.length]);

    if (!text || words.length === 0) return null;

    return (
        <div className="max-w-lg mx-auto text-center px-4 py-3">
            <p className="text-sm md:text-base leading-relaxed">
                {words.map((word, i) => (
                    <span
                        key={`${i}-${word}`}
                        className={`inline-block mr-1 transition-all duration-150 ${i === highlightIndex
                                ? "text-white font-semibold scale-105"
                                : i < highlightIndex
                                    ? "text-white/70"
                                    : "text-white/40"
                            }`}
                    >
                        {word}
                    </span>
                ))}
            </p>
        </div>
    );
}
