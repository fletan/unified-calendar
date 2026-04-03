# @unified-calendar/workspace

Simple-first monorepo scaffold for the Unified Calendar project.

## Layout

- apps/web: Next.js app (UI + initial API routes)
- packages/domain: provider-agnostic models and normalization contracts
- packages/providers-google: Google adapter
- packages/providers-microsoft: Microsoft adapter
- packages/ui: shared components
- packages/test-utils: shared test helpers
- packages/config-typescript: shared TypeScript config
- infra/docker: local infrastructure definitions
- infra/scripts: local automation

## Quick Start

1. corepack enable
2. pnpm install
3. pnpm dev
4. pnpm test
