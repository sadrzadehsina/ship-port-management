import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";
import perfectionist from "eslint-plugin-perfectionist";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      perfectionist,
    },
    rules: {
      "perfectionist/sort-imports": [
        "error",
        {
          type: "line-length",
          order: "asc",
          internalPattern: ["^@/.*"],
          groups: [
            "react",
            "type",
            ["builtin", "external"],
            "internal-type",
            "internal",
            "app",
            ["parent-type", "sibling-type", "index-type"],
            ["parent", "sibling", "index"],
            "object",
            "unknown",
          ],
          customGroups: {
            value: {
              react: ["^react$", "^react-.+"],
              app: ["^@/views/*"],
            },
            type: {
              react: ["^react$", "^react-.+"],
              app: ["^@/views/*"],
            },
          },
        },
      ],
    },
  },
]);
