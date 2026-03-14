# AI Pipeline Constructor

Visual constructor for sequential AI pipelines with a Kanban interface. Build multi-step LLM processing chains with drag-and-drop, connect any provider, and run pipelines in one click.

## Features

- **Visual Kanban Builder** — Drag-and-drop pipeline steps as columns
- **Multi-Provider Support** — OpenAI, Anthropic, Google, Mistral, Groq, OpenRouter, or any OpenAI-compatible API
- **Step-by-Step Execution** — Sequential processing with artifact passing between steps
- **Real-time Monitoring** — Live streaming output via SSE with progress tracking
- **Template Gallery** — 5 pre-built pipeline templates (Content, Research, Code Review, Startup Validation, Translation)
- **Secure Key Storage** — AES-256-GCM encryption for all API keys
- **Dark/Light Theme** — System-aware theme switching
- **Mobile Responsive** — Full functionality on mobile devices

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| UI | Tailwind CSS + shadcn/ui |
| Drag & Drop | @dnd-kit/core |
| Backend | Next.js API Routes + Prisma |
| Database | PostgreSQL |
| Auth | Supabase Auth |
| Deployment | Vercel / Docker |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase project)

### Local Development

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd ai-pipeline-constructor
npm install
```

2. **Configure environment variables:**

```bash
cp .env.example .env
# Edit .env with your credentials
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `DIRECT_URL` — Direct database URL (for migrations)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `ENCRYPTION_KEY` — 32-byte hex string for AES-256-GCM
- `NEXTAUTH_SECRET` — Session secret
- `NEXTAUTH_URL` — App base URL (http://localhost:3000)

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. **Set up the database:**

```bash
npm run db:push
npm run db:seed
```

4. **Start development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker Deployment

```bash
# Set environment variables
cp .env.example .env
# Edit .env

# Start with Docker Compose
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma db push
docker-compose exec app npm run db:seed
```

### Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with sidebar
│   ├── page.tsx                # Dashboard
│   ├── pipelines/
│   │   ├── page.tsx            # Pipeline list
│   │   └── [id]/
│   │       ├── page.tsx        # Kanban view
│   │       └── runs/page.tsx   # Run history
│   ├── settings/page.tsx       # API key management
│   ├── templates/page.tsx      # Template gallery
│   └── api/
│       ├── pipelines/          # Pipeline CRUD
│       ├── steps/              # Step CRUD + reorder
│       ├── runs/               # Run management
│       ├── providers/          # API key CRUD + test
│       └── execute/            # SSE execution endpoint
├── components/
│   ├── pipeline/
│   │   ├── KanbanBoard.tsx     # Drag-and-drop board
│   │   ├── StepCard.tsx        # Step card component
│   │   ├── StepEditor.tsx      # Step editor modal
│   │   ├── PromptEditor.tsx    # Prompt with variable highlighting
│   │   └── RunMonitor.tsx      # Execution monitor
│   ├── settings/
│   │   └── ApiKeyManager.tsx   # API key management
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── prisma.ts               # Prisma client
│   ├── encryption.ts           # AES-256-GCM
│   ├── auth.ts                 # Authentication
│   ├── providers.ts            # Provider configurations
│   ├── pipeline-runner.ts      # Execution engine
│   └── ai-gateway/
│       ├── index.ts            # Gateway entry
│       ├── types.ts            # Unified types
│       └── adapters/           # Provider adapters
└── hooks/                      # React hooks
```

## Pipeline Concepts

| Concept | Description |
|---------|------------|
| **Pipeline** | Complete processing chain from input to output |
| **Step** | One processing stage: prompt + model + parameters |
| **Run** | Single execution of a pipeline with input data |
| **Artifact** | Output of a step, passed to the next via `{{variables}}` |

### Variable System

Use `{{input}}` to reference the initial user input, and `{{step_N_output}}` to reference output from step N.

Example:
- Step 1 prompt: `"Generate ideas about: {{input}}"`
- Step 2 prompt: `"Pick the best from: {{step_1_output}}"`
- Step 3 prompt: `"Write content based on: {{step_2_output}}"`

## License

MIT
