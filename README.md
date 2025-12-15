# OktaStream - Intelligent Split-Tunnel Sync

A beautiful, secure, and automated dashboard to synchronize Okta's public IP ranges directly into your Cloudflare Zero Trust WARP Split Tunnel configurations.

OktaStream bridges Okta's dynamic infrastructure with Cloudflare Zero Trust. It automates keeping Split Tunnel include/exclude lists synchronized with Okta's frequently updating public IP ranges via a minimalist, high-contrast dashboard. Features include sync health visualization, IP Explorer for browsing CIDR ranges, and secure Cloudflare API credential management.

[cloudflarebutton]

## Features

- **Mission Control Dashboard**: Real-time sync status, activity logs, and one-click sync/dry-run actions.
- **IP Explorer**: Searchable, filterable grid of Okta IP ranges by service and region.
- **Configuration Management**: Secure Cloudflare Account ID/Token and Split Tunnel Policy setup.
- **Proxy Fetching**: Cloudflare Workers proxy fetches Okta JSON (S3) to bypass CORS.
- **Diff Visualization**: Preview changes (+new/-removed ranges) before applying.
- **Persistent History**: Durable Object storage for sync logs across sessions.
- **Cyber-Minimalist UI**: Responsive, animated interface with Inter/JetBrains Mono typography.
- **Production-Ready**: Error handling, loading states, mobile-optimized, accessible.

## Tech Stack

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **shadcn/ui** + **Tailwind CSS** + **Framer Motion** (animations)
- **React Router** + **@tanstack/react-query** (data fetching)
- **Recharts** (visualizations) + **Lucide React** (icons)
- **Zod** (validation) + **Sonner** (toasts) + **Zustand** (state)

### Backend
- **Cloudflare Workers** + **Hono** (routing)
- **Durable Objects** (persistent storage: history, config)
- **Cloudflare Zero Trust API** integration

### Tools
- **Bun** (fast package manager/runtime)
- **Wrangler** (CLI deployment)

## Prerequisites

- [Bun](https://bun.sh/) installed (`curl -fsSL https://bun.sh/install | bash`)
- Cloudflare account with Workers enabled
- `wrangler` CLI: `bunx wrangler@latest login`
- Cloudflare Zero Trust setup (Account ID, API Token with Gateway:Edit permissions)
- Okta public IP ranges access (public JSON endpoint)

## Quick Start

1. Clone or download the repo.
2. Install dependencies:
   ```bash
   bun install
   ```
3. Run in development:
   ```bash
   bun dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

## Development

### Local Development
```bash
# Install deps
bun install

# Dev server (frontend + worker proxy)
bun dev

# Type generation (Cloudflare bindings)
bun cf-typegen

# Lint
bun lint
```

### Environment Variables
No env vars needed for dev. Production uses Cloudflare secrets:
```bash
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put SPLIT_TUNNEL_POLICY_ID  # Optional, set via UI
```

### Project Structure
```
├── src/              # React frontend
│   ├── pages/        # Views: HomePage.tsx (Mission Control), etc.
│   ├── components/ui/ # shadcn/ui primitives
│   └── hooks/        # Custom hooks
├── worker/           # Cloudflare Worker
│   ├── userRoutes.ts # Add API routes here
│   └── durableObject.ts # DO storage methods
├── shared/           # Shared types
└── tailwind.config.js # Custom theme (slate + electric blue)
```

### Key Files to Customize
- `src/pages/HomePage.tsx`: Mission Control (rewrite for dashboard)
- `worker/userRoutes.ts`: API endpoints (e.g., `/api/okta-ips`, `/api/sync`)
- `worker/durableObject.ts`: Add storage methods (e.g., `getConfig`, `logSync`)

## Usage

1. **Configure**: Navigate to **Configuration** → Enter Cloudflare Account ID, API Token, Policy ID.
2. **Explore**: **IP Explorer** → Browse/filter Okta CIDRs (fetched via proxy).
3. **Sync**:
   - **Mission Control** → Click "Scan & Sync".
   - Review diff summary.
   - Confirm → Updates Zero Trust Split Tunnel via Worker.
4. **History**: View past syncs, status, and logs.

**API Endpoints** (via Worker proxy):
- `GET /api/okta-ips`: Fetch/parse Okta JSON.
- `POST /api/sync`: Diff + apply to Cloudflare.
- `GET /api/history`: Sync logs from Durable Object.

## Deployment

Deploy to Cloudflare Workers (frontend + backend in one):

```bash
# Build & deploy
bun deploy

# Or manual
bun build
wrangler deploy
```

Custom domain (optional):
```bash
wrangler deploy --var ASSETS_URL=https://your-pages-domain.pages.dev
```

[cloudflarebutton]

### Production Config
- Set secrets via Wrangler CLI (above).
- Assets auto-uploaded to Cloudflare (SPA handling).
- Durable Object persists globally (single instance).

## Roadmap

- **Phase 1**: UI foundation + Okta fetch proxy (complete).
- **Phase 2**: Cloudflare API sync + diff logic.
- **Phase 3**: History, visualizations, mobile polish.

## Contributing

1. Fork → Branch → PR.
2. Follow TypeScript + ESLint rules.
3. Test locally: `bun dev`.
4. Update types in `shared/types.ts`.

## License

MIT. See [LICENSE](LICENSE) for details.

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Zero Trust API](https://developers.cloudflare.com/cloudflare-one/api/)
- Issues: GitHub repo.

Built with ❤️ for Cloudflare's edge platform.