# Feed Slash

## Description

Web based Feed application using Nuxt3

### recommend

Bun.sh as runtime for best performance and development experience. You can also use Node.js if you prefer.

## Author

[@nk4dev](https://nknighta.me)

## Tech Stack

- **Framework**: Nuxt 3
- **Runtime**: Bun.sh
- **UI**: Tailwind CSS
- **Authentication**: Clerk
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Cloudflare Workers
- **E2E Testing**: Playwright

## Setup

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

Make sure to install dependencies:

```bash
# bun (recommend)
bun install

# npm
npm install
# pnpm
pnpm install
# yarn
yarn install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# bun
bun run dev

# npm
npm run dev
# pnpm
pnpm dev
# yarn
yarn dev

```

## Production

Build the application for production:

```bash
# bun
bun run build

# npm
npm run build
# pnpm
pnpm build
# yarn
yarn build


```

Locally preview production build:

```bash
# bun
bun run preview

# npm
npm run preview
# pnpm
pnpm preview
# yarn
yarn preview

```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## E2E Testing

this project uses **Playwright** for end-to-end (E2E) testing.

### executing tests

```bash
# execute all E2E tests
bun run test:e2e

# UI mode (interactive)
bun run test:e2e:ui

# execute tests in headed mode
bun run test:e2e:headed

# execute tests in debug mode
bun run test:e2e:debug
```

### test structure

The test files are located in the `tests/e2e/` directory:

| File | Description |
| `home.spec.ts` | Home page tests |
| `navigation.spec.ts` | Page navigation tests |
| `add-feed.spec.ts` | Add feed form tests |
| `static-pages.spec.ts` | Static pages (Privacy Policy, Precautions) tests |
| `mobile.spec.ts` | Mobile/responsive design tests |

### Configuration

Playwright configuration is in `playwright.config.ts`:

- Test directory: `./tests/e2e`
- Base URL: `http://localhost:3000`
- Browser: Chromium
- Auto-start dev server: Enabled
  | `home.spec.ts` | Home page tests |
  | `navigation.spec.ts` | Page navigation tests |
  | `add-feed.spec.ts` | Add feed form tests |
  | `static-pages.spec.ts` | Static pages (Privacy Policy, Precautions) tests |
  | `mobile.spec.ts` | Mobile/responsive design tests |

### Configuration

Playwright configuration is in `playwright.config.ts`:

- Test directory: `./tests/e2e`
- Base URL: `http://localhost:3000`
- Browser: Chromium
- Development server autostart: Enabled

## Cloudflare Workers Deployment

This project deploys to **Cloudflare Workers** (not Pages).

### Required worker config

- `main = ".output/server/index.mjs"`
- static assets directory: `.output/public`
- `compatibility_flags = ["nodejs_compat"]`

### Environment variable parity (Dashboard ⇄ Local)

1. Copy `.dev.vars.example` to `.dev.vars`
2. In Cloudflare Dashboard, open your Worker settings and copy variables/secrets
3. Put the same keys into `.dev.vars` for local parity

Example keys used in this project:

- `FEED_DATABASE_URL`
- `AUTH_DATABASE_URL` (if your remote env still uses this name)
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

### Deploy

```bash
bun run deploy
```

This runs `nuxt build` and then `wrangler deploy`, deploying Nitro output directly to Workers.
