"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import MeditationTimer from "@/components/MeditationTimer";

export default function MeditatePage() {
  const [showComplete, setShowComplete] = useState(false);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-full p-2 text-sand-400 transition-colors hover:bg-sand-100 hover:text-sand-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-sand-900">Meditation</h1>
          <p className="text-sm text-sand-400">Find your calm</p>
        </div>
      </div>

      {/* Timer */}
      <div className="py-4">
        <MeditationTimer onComplete={() => setShowComplete(true)} />
      </div>

      {/* Completion message */}
      {showComplete && (
        <div className="card animate-slide-up flex items-center gap-3 border-zen-100 bg-zen-50/50">
          <Sparkles className="h-5 w-5 text-zen-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-zen-800">
              Session complete!
            </p>
            <p className="text-xs text-zen-600">
              Your progress has been saved.
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card space-y-3">
        <h2 className="text-sm font-medium text-sand-500 uppercase tracking-wider">
          Tips
        </h2>
        <ul className="space-y-2 text-sm text-sand-600">
          <li className="flex gap-2">
            <span className="text-zen-500">•</span>
            Find a comfortable seated position
          </li>
          <li className="flex gap-2">
            <span className="text-zen-500">•</span>
            Close your eyes or soften your gaze
          </li>
          <li className="flex gap-2">
            <span className="text-zen-500">•</span>
            Focus on your natural breathing rhythm
          </li>
          <li className="flex gap-2">
            <span className="text-zen-500">•</span>
            Gently return focus when your mind wanders
          </li>
        </ul>
      </div>
    </div>
  );
}
