export interface MeditationSession {
  id: string;
  type: "meditation" | "breathing";
  duration: number; // seconds
  completedAt: string; // ISO date
  technique?: string;
}

export interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string | null;
}

const SESSIONS_KEY = "zenflow_sessions";
const STATS_KEY = "zenflow_stats";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getSessions(): MeditationSession[] {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function addSession(session: Omit<MeditationSession, "id">): MeditationSession {
  const sessions = getSessions();
  const newSession: MeditationSession = {
    ...session,
    id: crypto.randomUUID(),
  };
  sessions.unshift(newSession);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  updateStats(newSession);
  return newSession;
}

export function getStats(): UserStats {
  if (!isBrowser()) {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: null,
    };
  }
  const data = localStorage.getItem(STATS_KEY);
  if (data) return JSON.parse(data);
  return recalculateStats();
}

function updateStats(session: MeditationSession): void {
  const stats = getStats();
  stats.totalSessions += 1;
  stats.totalMinutes += Math.round(session.duration / 60);

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (stats.lastSessionDate === today) {
    // Already logged today, no streak change
  } else if (stats.lastSessionDate === yesterday) {
    stats.currentStreak += 1;
  } else {
    stats.currentStreak = 1;
  }

  if (stats.currentStreak > stats.longestStreak) {
    stats.longestStreak = stats.currentStreak;
  }

  stats.lastSessionDate = today;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function recalculateStats(): UserStats {
  const sessions = getSessions();
  const stats: UserStats = {
    totalSessions: sessions.length,
    totalMinutes: sessions.reduce((sum, s) => sum + Math.round(s.duration / 60), 0),
    currentStreak: 0,
    longestStreak: 0,
    lastSessionDate: null,
  };

  if (sessions.length > 0) {
    const dates = Array.from(new Set(sessions.map((s) => s.completedAt.split("T")[0]))).sort().reverse();
    stats.lastSessionDate = dates[0];

    let streak = 1;
    let maxStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime();
      if (diff <= 86400000) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 1;
      }
    }
    stats.currentStreak = streak;
    stats.longestStreak = maxStreak;
  }

  if (isBrowser()) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }
  return stats;
}

export function clearAllData(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(SESSIONS_KEY);
  localStorage.removeItem(STATS_KEY);
}
