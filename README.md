# horaios

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Self, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Prisma** - TypeScript-first ORM
- **MongoDB** - Database engine
- **Authentication** - Better-Auth
- **Biome** - Linting and formatting
- **PWA** - Progressive Web App support
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses MongoDB with Prisma.

1. Make sure you have MongoDB set up.
2. Update your `apps/web/.env` file with your MongoDB connection URI.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the fullstack application.

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@horaios/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Git Hooks and Formatting

- Format and lint fix: `bun run check`

## Project Structure

```
horaios/
├── apps/
│   └── web/         # Fullstack application (Next.js)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Biome formatting and linting
- `cd apps/web && bun run generate-pwa-assets`: Generate PWA assets

 ╭────────────────────────────────────────────────────────────────────╮
 │                                                                    │
 │  Next steps                                                        │
 │  1. cd horaios                                                     │
 │  2. bun run dev                                                    │
 │  Your project will be available at:                                │
 │  • Frontend: http://localhost:3001                                 │
 │                                                                    │
 │  Database commands:                                                │
 │  • Generate Prisma Client: bun run db:generate                     │
 │  • Apply schema: bun run db:push                                   │
 │  • Database UI: bun run db:studio                                  │
 │                                                                    │
 │  Linting and formatting:                                           │
 │  • Format and lint fix: bun run check                              │
 │                                                                    │
 │  Special sponsors                                                  │
 │  • neondatabase   • Guillermo Rauch   • Clerk   • Novu   • Convex  │
 │                                                                    │
 │  Like Better-T-Stack? Please consider giving us a star             │
 │     on GitHub:                                                     │
 │  https://github.com/AmanVarshney01/create-better-t-stack           │
 │                                                                    │
 ╰────────────────────────────────────────────────────────────────────╯