"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import BreathingGuide, { TECHNIQUES, type BreathingTechnique } from "@/components/BreathingGuide";
import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
  teal: "bg-teal-50 border-teal-200 text-teal-700",
  orange: "bg-orange-50 border-orange-200 text-orange-700",
};

const activeColorMap: Record<string, string> = {
  blue: "bg-blue-100 border-blue-400 ring-2 ring-blue-200",
  purple: "bg-purple-100 border-purple-400 ring-2 ring-purple-200",
  teal: "bg-teal-100 border-teal-400 ring-2 ring-teal-200",
  orange: "bg-orange-100 border-orange-400 ring-2 ring-orange-200",
};

export default function BreathePage() {
  const [selected, setSelected] = useState<BreathingTechnique>(TECHNIQUES[0]);
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
          <h1 className="text-xl font-semibold text-sand-900">Breathing</h1>
          <p className="text-sm text-sand-400">Guided exercises</p>
        </div>
      </div>

      {/* Technique Selector */}
      <div className="grid grid-cols-2 gap-3">
        {TECHNIQUES.map((tech) => (
          <button
            key={tech.id}
            onClick={() => {
              setSelected(tech);
              setShowComplete(false);
            }}
            className={cn(
              "rounded-2xl border p-3 text-left transition-all",
              selected.id === tech.id
                ? activeColorMap[tech.color]
                : cn(colorMap[tech.color], "hover:shadow-sm")
            )}
          >
            <p className="text-sm font-medium">{tech.name}</p>
            <p className="text-xs opacity-70 mt-0.5">{tech.description}</p>
          </button>
        ))}
      </div>

      {/* Breathing Guide */}
      <div className="py-4">
        <BreathingGuide
          key={selected.id}
          technique={selected}
          onComplete={() => setShowComplete(true)}
        />
      </div>

      {/* Completion */}
      {showComplete && (
        <div className="card animate-slide-up flex items-center gap-3 border-zen-100 bg-zen-50/50">
          <Sparkles className="h-5 w-5 text-zen-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-zen-800">
              Breathing exercise complete!
            </p>
            <p className="text-xs text-zen-600">
              Great work — session saved to your history.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
