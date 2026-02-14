"use client";

import { useRef, useEffect, useCallback } from "react";

interface VoiceOrbProps {
    analyserNode: AnalyserNode | null;
    state: "idle" | "listening" | "thinking" | "speaking";
    size?: number;
}

const STATE_COLORS: Record<string, string> = {
    idle: "#6366f1",      // Indigo
    listening: "#ef4444",  // Red
    thinking: "#f59e0b",   // Amber
    speaking: "#10b981",   // Emerald
};

const STATE_GLOW_COLORS: Record<string, string> = {
    idle: "rgba(99, 102, 241, 0.3)",
    listening: "rgba(239, 68, 68, 0.4)",
    thinking: "rgba(245, 158, 11, 0.3)",
    speaking: "rgba(16, 185, 129, 0.4)",
};

export function VoiceOrb({ analyserNode, state, size = 200 }: VoiceOrbProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const timeRef = useRef<number>(0);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.25;

        ctx.clearRect(0, 0, width, height);
        timeRef.current += 0.02;

        // Get frequency data from analyser if available
        let avgFrequency = 0;
        if (analyserNode) {
            const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
            analyserNode.getByteFrequencyData(dataArray);
            avgFrequency =
                dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255;
        }

        // Auto-animation for thinking state
        let amplitude = avgFrequency;
        if (state === "thinking") {
            amplitude = 0.3 + Math.sin(timeRef.current * 3) * 0.15;
        } else if (state === "idle") {
            amplitude = 0.05 + Math.sin(timeRef.current * 1.5) * 0.03;
        }

        const color = STATE_COLORS[state] || STATE_COLORS.idle;
        const glowColor = STATE_GLOW_COLORS[state] || STATE_GLOW_COLORS.idle;

        // Draw 5 layers of sine waves
        for (let layer = 0; layer < 5; layer++) {
            const layerOffset = layer * 0.4;
            const layerAmplitude = amplitude * (1 - layer * 0.15);
            const layerAlpha = 0.6 - layer * 0.1;

            ctx.beginPath();

            for (let angle = 0; angle <= Math.PI * 2; angle += 0.02) {
                const wave1 = Math.sin(angle * 3 + timeRef.current * 2 + layerOffset) * layerAmplitude;
                const wave2 = Math.sin(angle * 5 - timeRef.current * 1.5 + layerOffset) * layerAmplitude * 0.5;
                const wave3 = Math.sin(angle * 7 + timeRef.current * 3 + layerOffset) * layerAmplitude * 0.25;

                const radius = baseRadius + (wave1 + wave2 + wave3) * baseRadius * 0.8;

                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;

                if (angle === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.closePath();

            // Gradient fill
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, baseRadius * 1.5
            );
            gradient.addColorStop(0, `${color}${Math.floor(layerAlpha * 255).toString(16).padStart(2, "0")}`);
            gradient.addColorStop(1, `${color}00`);

            ctx.fillStyle = gradient;
            ctx.fill();

            // Stroke
            ctx.strokeStyle = `${color}${Math.floor(layerAlpha * 0.5 * 255).toString(16).padStart(2, "0")}`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Center glow
        const glowGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, baseRadius * 0.8
        );
        glowGradient.addColorStop(0, `${color}cc`);
        glowGradient.addColorStop(0.5, `${color}44`);
        glowGradient.addColorStop(1, `${color}00`);

        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Outer glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `${color}88`;
        ctx.fill();
        ctx.shadowBlur = 0;

        animationFrameRef.current = requestAnimationFrame(draw);
    }, [analyserNode, state]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas resolution
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.scale(dpr, dpr);
        }

        animationFrameRef.current = requestAnimationFrame(draw);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [draw, size]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: size, height: size }}
            className="pointer-events-none"
        />
    );
}
