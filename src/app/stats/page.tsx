"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Timer, Wind, Flame, TrendingUp, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import { getStats, getSessions, clearAllData, type UserStats, type MeditationSession } from "@/lib/storage";
import { formatMinutes } from "@/lib/utils";

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    setStats(getStats());
    setSessions(getSessions());
  }, []);

  const handleClear = () => {
    clearAllData();
    setStats(getStats());
    setSessions([]);
    setShowConfirmClear(false);
  };

  const groupedByDate = sessions.reduce<Record<string, MeditationSession[]>>(
    (groups, session) => {
      const date = new Date(session.completedAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(session);
      return groups;
    },
    {}
  );

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
          <h1 className="text-xl font-semibold text-sand-900">Statistics</h1>
          <p className="text-sm text-sand-400">Your mindfulness journey</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card flex items-center gap-3">
            <div className="rounded-xl bg-zen-50 p-2.5">
              <Clock className="h-5 w-5 text-zen-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-sand-800">
                {formatMinutes(stats.totalMinutes)}
              </p>
              <p className="text-xs text-sand-400">Total time</p>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-sand-800">
                {stats.totalSessions}
              </p>
              <p className="text-xs text-sand-400">Sessions</p>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-2.5">
              <Flame className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-sand-800">
                {stats.currentStreak}
              </p>
              <p className="text-xs text-sand-400">Current streak</p>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-2.5">
              <Flame className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-sand-800">
                {stats.longestStreak}
              </p>
              <p className="text-xs text-sand-400">Best streak</p>
            </div>
          </div>
        </div>
      )}

      {/* Session History */}
      {sessions.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-sand-500 uppercase tracking-wider">
            History
          </h2>

          {Object.entries(groupedByDate).map(([date, dateSessions]) => (
            <div key={date} className="space-y-2">
              <h3 className="text-xs font-medium text-sand-400">{date}</h3>
              {dateSessions.map((session) => (
                <div
                  key={session.id}
                  className="card flex items-center justify-between py-3 px-4"
                >
                  <div className="flex items-center gap-3">
                    {session.type === "meditation" ? (
                      <div className="rounded-lg bg-zen-50 p-2">
                        <Timer className="h-4 w-4 text-zen-600" />
                      </div>
                    ) : (
                      <div className="rounded-lg bg-blue-50 p-2">
                        <Wind className="h-4 w-4 text-blue-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-sand-800">
                        {session.technique || (session.type === "meditation" ? "Meditation" : "Breathing")}
                      </p>
                      <p className="text-xs text-sand-400">
                        {new Date(session.completedAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-sand-500 tabular-nums">
                    {Math.round(session.duration / 60)}m
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12 space-y-2">
          <p className="text-sand-500">No sessions yet</p>
          <p className="text-sm text-sand-400">
            Complete a meditation or breathing exercise to see your stats.
          </p>
        </div>
      )}

      {/* Clear Data */}
      {sessions.length > 0 && (
        <div className="pt-4">
          {showConfirmClear ? (
            <div className="card border-red-100 bg-red-50/50 flex items-center justify-between">
              <p className="text-sm text-red-700">Clear all data?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-sand-600 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClear}
                  className="rounded-xl bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                >
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sand-200 py-3 text-sm text-sand-400 transition-colors hover:border-red-200 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Clear all data
            </button>
          )}
        </div>
      )}
    </div>
  );
}
