"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Timer, Wind, Flame, TrendingUp, Clock } from "lucide-react";
import { getStats, getSessions, type UserStats, type MeditationSession } from "@/lib/storage";
import { formatMinutes } from "@/lib/utils";

export default function HomePage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<MeditationSession[]>([]);

  useEffect(() => {
    setStats(getStats());
    setRecentSessions(getSessions().slice(0, 3));
  }, []);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-3xl font-semibold text-sand-900">
          Welcome to ZenFlow
        </h1>
        <p className="text-sand-500">
          Take a moment. Breathe. Be present.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/meditate"
          className="card group flex flex-col items-center gap-3 py-8 transition-all hover:shadow-md hover:border-zen-200"
        >
          <div className="rounded-2xl bg-zen-50 p-4 transition-colors group-hover:bg-zen-100">
            <Timer className="h-8 w-8 text-zen-600" />
          </div>
          <div className="text-center">
            <p className="font-medium text-sand-800">Meditate</p>
            <p className="text-xs text-sand-400 mt-1">Timed session</p>
          </div>
        </Link>

        <Link
          href="/breathe"
          className="card group flex flex-col items-center gap-3 py-8 transition-all hover:shadow-md hover:border-zen-200"
        >
          <div className="rounded-2xl bg-blue-50 p-4 transition-colors group-hover:bg-blue-100">
            <Wind className="h-8 w-8 text-blue-500" />
          </div>
          <div className="text-center">
            <p className="font-medium text-sand-800">Breathe</p>
            <p className="text-xs text-sand-400 mt-1">Guided breathing</p>
          </div>
        </Link>
      </div>

      {/* Stats Overview */}
      {stats && stats.totalSessions > 0 && (
        <div className="card space-y-4">
          <h2 className="text-sm font-medium text-sand-500 uppercase tracking-wider">
            Your Journey
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-2xl font-semibold text-sand-800">
                <Clock className="h-5 w-5 text-zen-500" />
                {formatMinutes(stats.totalMinutes)}
              </div>
              <p className="text-xs text-sand-400 mt-1">Total time</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-2xl font-semibold text-sand-800">
                <TrendingUp className="h-5 w-5 text-zen-500" />
                {stats.totalSessions}
              </div>
              <p className="text-xs text-sand-400 mt-1">Sessions</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-2xl font-semibold text-sand-800">
                <Flame className="h-5 w-5 text-orange-400" />
                {stats.currentStreak}
              </div>
              <p className="text-xs text-sand-400 mt-1">Day streak</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-sand-500 uppercase tracking-wider">
              Recent
            </h2>
            <Link href="/stats" className="text-xs text-zen-600 hover:text-zen-700">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="card flex items-center justify-between py-3 px-4"
              >
                <div className="flex items-center gap-3">
                  {session.type === "meditation" ? (
                    <Timer className="h-4 w-4 text-zen-500" />
                  ) : (
                    <Wind className="h-4 w-4 text-blue-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-sand-800 capitalize">
                      {session.technique || session.type}
                    </p>
                    <p className="text-xs text-sand-400">
                      {new Date(session.completedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-sand-500 tabular-nums">
                  {Math.round(session.duration / 60)}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!stats || stats.totalSessions === 0) && (
        <div className="card text-center py-12 space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-zen-50 flex items-center justify-center">
            <Wind className="h-8 w-8 text-zen-400" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sand-700">Start your mindfulness journey</p>
            <p className="text-sm text-sand-400">
              Choose a meditation or breathing exercise above to begin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
