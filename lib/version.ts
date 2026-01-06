// Centralized version export (replaces the old generated `lib/browser/version.js`).
// `resolveJsonModule` is enabled in tsconfig so this stays type-safe.
import pkg from '../package.json';

export const version: string = pkg.version;

