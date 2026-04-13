"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSession } from "@/lib/storage";

export interface BreathingTechnique {
  id: string;
  name: string;
  description: string;
  phases: { label: string; duration: number }[];
  color: string;
}

export const TECHNIQUES: BreathingTechnique[] = [
  {
    id: "box",
    name: "Box Breathing",
    description: "Equal phases for calm focus",
    phases: [
      { label: "Inhale", duration: 4 },
      { label: "Hold", duration: 4 },
      { label: "Exhale", duration: 4 },
      { label: "Hold", duration: 4 },
    ],
    color: "blue",
  },
  {
    id: "478",
    name: "4-7-8 Relaxing",
    description: "Deep relaxation for sleep",
    phases: [
      { label: "Inhale", duration: 4 },
      { label: "Hold", duration: 7 },
      { label: "Exhale", duration: 8 },
    ],
    color: "purple",
  },
  {
    id: "coherent",
    name: "Coherent Breathing",
    description: "5.5 breaths per minute",
    phases: [
      { label: "Inhale", duration: 5 },
      { label: "Exhale", duration: 5 },
    ],
    color: "teal",
  },
  {
    id: "energize",
    name: "Energizing Breath",
    description: "Quick inhale, slow exhale",
    phases: [
      { label: "Inhale", duration: 2 },
      { label: "Exhale", duration: 6 },
    ],
    color: "orange",
  },
];

interface Props {
  technique: BreathingTechnique;
  onComplete?: () => void;
}

export default function BreathingGuide({ technique, onComplete }: Props) {
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const animRef = useRef<number | null>(null);
  const phaseStartRef = useRef(0);
  const startTimeRef = useRef(0);
  const totalCycles = 8;

  const currentPhaseDuration = technique.phases[currentPhase]?.duration ?? 4;
  const currentPhaseLabel = technique.phases[currentPhase]?.label ?? "";
  const isInhale = currentPhaseLabel === "Inhale";
  const isExhale = currentPhaseLabel === "Exhale";

  const circleScale = isActive
    ? isInhale
      ? 1 + 0.4 * phaseProgress
      : isExhale
        ? 1.4 - 0.4 * phaseProgress
        : 1 + 0.4 * (currentPhase > 0 ? 1 : 0)
    : 1;

  const tick = useCallback(() => {
    const now = Date.now();
    const elapsed = (now - phaseStartRef.current) / 1000;
    const progress = Math.min(elapsed / currentPhaseDuration, 1);

    setPhaseProgress(progress);

    if (progress >= 1) {
      const nextPhase = currentPhase + 1;
      if (nextPhase >= technique.phases.length) {
        const newCycleCount = cycleCount + 1;
        setCycleCount(newCycleCount);

        if (newCycleCount >= totalCycles) {
          setIsActive(false);
          setCurrentPhase(0);
          setPhaseProgress(0);

          const totalDuration = (now - startTimeRef.current) / 1000;
          addSession({
            type: "breathing",
            duration: Math.round(totalDuration),
            completedAt: new Date().toISOString(),
            technique: technique.name,
          });

          onComplete?.();
          return;
        }

        setCurrentPhase(0);
      } else {
        setCurrentPhase(nextPhase);
      }
      phaseStartRef.current = now;
    }

    animRef.current = requestAnimationFrame(tick);
  }, [currentPhase, currentPhaseDuration, cycleCount, technique, onComplete]);

  useEffect(() => {
    if (isActive) {
      phaseStartRef.current = Date.now();
      animRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isActive, tick]);

  const handleStart = () => {
    setIsActive(true);
    setCycleCount(0);
    setCurrentPhase(0);
    setPhaseProgress(0);
    startTimeRef.current = Date.now();
  };

  const handleStop = () => {
    setIsActive(false);
    setCurrentPhase(0);
    setPhaseProgress(0);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Breathing Circle */}
      <div className="relative flex h-64 w-64 items-center justify-center">
        {/* Outer glow */}
        <div
          className="absolute rounded-full bg-zen-200/30 transition-transform duration-700 ease-in-out"
          style={{
            width: "220px",
            height: "220px",
            transform: `scale(${circleScale})`,
          }}
        />
        {/* Inner circle */}
        <div
          className="absolute rounded-full bg-gradient-to-br from-zen-400 to-zen-600 transition-transform duration-700 ease-in-out"
          style={{
            width: "180px",
            height: "180px",
            transform: `scale(${circleScale})`,
          }}
        />
        {/* Text */}
        <div className="relative z-10 flex flex-col items-center gap-1 text-white">
          {isActive ? (
            <>
              <span className="text-2xl font-light">{currentPhaseLabel}</span>
              <span className="text-sm opacity-75">
                {Math.ceil(currentPhaseDuration - phaseProgress * currentPhaseDuration)}s
              </span>
            </>
          ) : (
            <span className="text-lg font-light">Ready</span>
          )}
        </div>
      </div>

      {/* Cycle counter */}
      {isActive && (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalCycles }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i < cycleCount ? "bg-zen-500" : "bg-sand-200"
              )}
            />
          ))}
        </div>
      )}

      {/* Controls */}
      {isActive ? (
        <button
          onClick={handleStop}
          className="flex items-center gap-2 rounded-2xl bg-sand-800 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-sand-700 active:scale-95"
        >
          <Square className="h-4 w-4" />
          Stop
        </button>
      ) : (
        <button
          onClick={handleStart}
          className="btn-primary flex items-center gap-2 px-8 py-4 text-base"
        >
          <Play className="h-5 w-5" />
          Begin
        </button>
      )}

      {/* Technique Info */}
      <div className="text-center text-sm text-sand-400">
        <p>
          {technique.phases.map((p) => `${p.label} ${p.duration}s`).join(" → ")}
        </p>
        <p className="mt-1">{totalCycles} cycles</p>
      </div>
    </div>
  );
}
