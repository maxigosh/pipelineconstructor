"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Check } from "lucide-react";
import { formatTime, cn } from "@/lib/utils";
import { addSession } from "@/lib/storage";

const PRESET_DURATIONS = [
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "20 min", seconds: 1200 },
  { label: "30 min", seconds: 1800 },
];

interface Props {
  onComplete?: () => void;
}

export default function MeditationTimer({ onComplete }: Props) {
  const [selectedDuration, setSelectedDuration] = useState(300);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const progress = 1 - timeLeft / selectedDuration;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const complete = useCallback(() => {
    stop();
    setIsRunning(false);
    setIsComplete(true);
    setTimeLeft(0);

    const elapsed = selectedDuration;
    addSession({
      type: "meditation",
      duration: elapsed,
      completedAt: new Date().toISOString(),
      technique: "Silent meditation",
    });

    onComplete?.();
  }, [stop, selectedDuration, onComplete]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - (selectedDuration - timeLeft) * 1000;
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = Math.max(0, selectedDuration - elapsed);
        setTimeLeft(remaining);
        if (remaining === 0) {
          complete();
        }
      }, 100);
    }
    return stop;
  }, [isRunning, selectedDuration, complete, stop, timeLeft]);

  const handleStart = () => {
    if (isComplete) return;
    setIsRunning(true);
  };

  const handlePause = () => {
    stop();
    setIsRunning(false);
  };

  const handleReset = () => {
    stop();
    setIsRunning(false);
    setIsComplete(false);
    setTimeLeft(selectedDuration);
  };

  const handleSelectDuration = (seconds: number) => {
    if (isRunning) return;
    stop();
    setSelectedDuration(seconds);
    setTimeLeft(seconds);
    setIsComplete(false);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Duration Selector */}
      <div className="flex flex-wrap justify-center gap-2">
        {PRESET_DURATIONS.map(({ label, seconds }) => (
          <button
            key={seconds}
            onClick={() => handleSelectDuration(seconds)}
            disabled={isRunning}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              selectedDuration === seconds
                ? "bg-zen-600 text-white shadow-sm"
                : "bg-sand-100 text-sand-600 hover:bg-sand-200 disabled:opacity-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="relative flex items-center justify-center">
        <svg className="h-64 w-64 -rotate-90" viewBox="0 0 260 260">
          {/* Background ring */}
          <circle
            cx="130"
            cy="130"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-sand-100"
          />
          {/* Progress ring */}
          <circle
            cx="130"
            cy="130"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-zen-500 transition-all duration-300"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        <div className="absolute flex flex-col items-center gap-1">
          {isComplete ? (
            <div className="animate-fade-in flex flex-col items-center gap-2">
              <Check className="h-12 w-12 text-zen-500" />
              <span className="text-lg font-medium text-zen-700">Complete</span>
            </div>
          ) : (
            <>
              <span className="text-5xl font-light text-sand-800 tabular-nums">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs text-sand-400 uppercase tracking-wider">
                {isRunning ? "Focus on your breath" : "Ready"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleReset}
          className="rounded-full p-3 text-sand-400 transition-colors hover:bg-sand-100 hover:text-sand-600"
          aria-label="Reset"
        >
          <RotateCcw className="h-6 w-6" />
        </button>

        {isComplete ? (
          <button onClick={handleReset} className="btn-primary px-8 py-4 text-base">
            New Session
          </button>
        ) : isRunning ? (
          <button
            onClick={handlePause}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-sand-800 text-white shadow-lg transition-all hover:bg-sand-700 active:scale-95"
            aria-label="Pause"
          >
            <Pause className="h-7 w-7" />
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-zen-600 text-white shadow-lg transition-all hover:bg-zen-700 active:scale-95"
            aria-label="Start"
          >
            <Play className="h-7 w-7 ml-1" />
          </button>
        )}

        {/* Spacer for symmetry */}
        <div className="w-12" />
      </div>
    </div>
  );
}
