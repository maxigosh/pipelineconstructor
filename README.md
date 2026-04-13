# ZenFlow

A minimalist meditation and mindfulness app built with Next.js. Track your practice, follow guided breathing exercises, and build a daily meditation habit.

## Features

- **Meditation Timer** — Customizable timed sessions (3–30 min) with a visual progress ring
- **Breathing Exercises** — Four guided techniques: Box Breathing, 4-7-8 Relaxing, Coherent Breathing, Energizing Breath
- **Session Tracking** — All sessions are saved locally with date, duration, and technique
- **Streak Tracking** — Daily streak counter to keep you motivated
- **Statistics Dashboard** — Total time, session count, current & best streak
- **Mobile-First Design** — Responsive layout with bottom navigation on mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Storage | Browser localStorage |

## Getting Started

### Prerequisites

- Node.js 18+

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with navigation
│   ├── page.tsx            # Home / dashboard
│   ├── globals.css         # Global styles & Tailwind
│   ├── meditate/
│   │   └── page.tsx        # Meditation timer page
│   ├── breathe/
│   │   └── page.tsx        # Breathing exercises page
│   └── stats/
│       └── page.tsx        # Statistics & history page
├── components/
│   ├── Navigation.tsx      # Top/bottom nav bar
│   ├── MeditationTimer.tsx # Countdown timer with SVG ring
│   └── BreathingGuide.tsx  # Animated breathing circle
└── lib/
    ├── storage.ts          # localStorage persistence
    └── utils.ts            # Formatting helpers
```

## Breathing Techniques

| Technique | Pattern | Purpose |
|-----------|---------|---------|
| Box Breathing | 4s in → 4s hold → 4s out → 4s hold | Calm focus |
| 4-7-8 Relaxing | 4s in → 7s hold → 8s out | Deep relaxation / sleep |
| Coherent | 5s in → 5s out | Heart rate balance |
| Energizing | 2s in → 6s out | Gentle energy boost |

## License

MIT
