/// <reference types="vite/client" />

// Injected by vite.config.ts's `define` - the real installed versions of a curated set of
// frontend dependencies, resolved at build time from node_modules so they can't drift from
// what's actually bundled. See features/dashboard/queue/TechStackSection.tsx.
declare const __FRONTEND_TECH_STACK__: { name: string; version: string }[]
