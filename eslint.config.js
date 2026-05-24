// ESLint flat config (ESLint 9+).
//
// The extension scripts (content.js, background.js, console-decorator.js) are
// classic scripts loaded directly by the manifest — they run with browser +
// webextension globals, and content.js additionally relies on the bundled
// jQuery `$`/`jQuery` globals (removed in Stage 3 of ROADMAP.md). Tooling and
// tests are ES modules running under Node.
import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "*.zip"],
  },
  js.configs.recommended,
  {
    // Standalone classic content scripts loaded directly by the manifest.
    files: ["background.js", "console-decorator.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: { ...globals.browser, ...globals.webextensions },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    // Content-script ES modules (bundled by esbuild into dist/content.js).
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.webextensions },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    // Unit tests run under vitest in a jsdom environment (browser + node).
    files: ["test/**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    // Build tooling / config.
    files: ["scripts/**/*.{js,mjs}", "*.config.{js,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
  },
  prettier,
];
