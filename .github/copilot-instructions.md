# GitHub Copilot Instructions for Feed Slash

## Project Overview
Feed Slash is a Nuxt 3 application for displaying RSS feeds with a clean, responsive layout.

## Technical Stack

### Framework & Runtime
- **Framework**: Nuxt 3
- **Runtime**: Bun.sh (MUST NOT use npm or yarn)
- **Authentication**: Clerk
- **Deployment**: Cloudflare Workers

### Libraries
- Axios for HTTP requests
- Tailwind CSS for styling

### Database
- Drizzle ORM

## Development Guidelines

### Package Management
**IMPORTANT**: Always use Bun for package management
- ✅ Use: `bun install`, `bun add`, `bun remove`
- ❌ Never use: `npm install`, `yarn add`, `pnpm install`

### Commands
- Dev server: `bun run dev`
- Build: `bun run build`
- Preview: `bun run preview`

### Code Style
- Use TypeScript for type safety
- Follow Vue 3 Composition API patterns
- Use Nuxt 3 auto-imports for composables
- Utilize server routes in `server/api/` directory

### Project Structure
```
app/
├── pages/          # Nuxt pages with file-based routing
├── assets/         # Global styles (Tailwind)
└── app.vue         # Root component

server/
└── api/           # API endpoints
    └── feeds/     # Feed-related endpoints

lib/
├── db.ts          # Database connection
├── schema.ts      # Drizzle schema
└── devlog.ts      # Development utilities
```

### API Endpoints
- Production URL: https://rss.varius.technology
- API URL: https://api.varius.technology

### Authentication
- Use Clerk for authentication
- Implement auth checks in server middleware when needed

### Styling
- Use Tailwind CSS utility classes
- Global styles in `app/assets/global.css`
- Mobile-first responsive design

### Database Operations
- Use Drizzle ORM for database queries
- Schema defined in `lib/schema.ts`
- Migrations in `drizzle/` directory

## When Generating Code

1. **Always use Bun** for any package installation suggestions
2. **Use TypeScript** with proper type annotations
3. **Follow Nuxt 3 conventions**: Auto-imports, server routes, composables
4. **Implement Clerk auth** where user authentication is required
5. **Use Tailwind CSS** for styling instead of custom CSS
6. **Consider Cloudflare Workers** deployment constraints
7. **Use Axios** for external API calls
8. **Follow Vue 3 Composition API** patterns with `<script setup>`

## Common Patterns

### API Route Example
```typescript
export default defineEventHandler(async (event) => {
  // Your logic here
  return { data: 'response' }
})
```

### Page Component Example
```vue
<script setup lang="ts">
// Auto-imported composables
const route = useRoute()
const router = useRouter()
</script>

<template>
  <div class="container mx-auto p-4">
    <!-- Tailwind classes -->
  </div>
</template>
```

### Database Query Example
```typescript
import { db } from '~/lib/db'
import { feeds } from '~/lib/schema'

const results = await db.select().from(feeds)
```
