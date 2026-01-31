# Feed Slash

## Description
Web based Feed application using Nuxt3

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
### 設定

Playwright configuration is in `playwright.config.ts`:
- Test directory: `./tests/e2e`
- Base URL: `http://localhost:3000`
- Browser: Chromium
- Development server autostart: Enabled
