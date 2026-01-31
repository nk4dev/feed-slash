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

このプロジェクトではE2Eテストに **Playwright** を使用しています。

### テストの実行

```bash
# すべてのE2Eテストを実行
bun run test:e2e

# UIモードで実行（インタラクティブ）
bun run test:e2e:ui

# ブラウザを表示して実行
bun run test:e2e:headed

# デバッグモードで実行
bun run test:e2e:debug
```

### テスト構成

テストファイルは `tests/e2e/` ディレクトリに配置されています：

| ファイル | 内容 |
|---------|------|
| `home.spec.ts` | ホームページのテスト |
| `navigation.spec.ts` | ページ間のナビゲーションテスト |
| `add-feed.spec.ts` | フィード追加フォームのテスト |
| `static-pages.spec.ts` | 静的ページ（Privacy Policy, Precautions）のテスト |
| `mobile.spec.ts` | モバイル・レスポンシブデザインのテスト |

### 設定

Playwrightの設定は `playwright.config.ts` にあります：
- テストディレクトリ: `./tests/e2e`
- ベースURL: `http://localhost:3000`
- ブラウザ: Chromium
- 開発サーバー自動起動: 有効
