/// <reference types="vite/client" />

// This declaration helps TypeScript understand plain CSS imports (e.g., import './index.css';)
// The vite/client types should ideally cover this, but being explicit doesn't hurt.
declare module '*.css';
