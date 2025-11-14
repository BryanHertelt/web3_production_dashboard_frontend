import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintPluginJest from "eslint-plugin-jest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Next.js + TypeScript defaults
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...compat.config({
    extends: ["next", "prettier"],
  }),
  // 1. Jest plugin integration
  {
    plugins: {
      jest: eslintPluginJest,
    },
    languageOptions: {
      globals: {
        ...eslintPluginJest.globals,
      },
    },
    rules: {
      ...eslintPluginJest.configs.recommended.rules,
    },
  },

  // Ignore build/output files
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["**/jest.config.*", "**/next.config.*"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["src/features/**/*.ts", "src/features/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            // Block imports from other features (one level deep - the feature name)
            // This prevents: features/select-time-range importing from features/data-table
            // But allows: features/data-table/lib importing from features/data-table/model
            {
              group: ["@/features/*", "!@/features/*/*"],
              message:
                "Do not import from other features. You can only import from subfolders within your own feature (e.g., lib, model, ui within the same feature).",
            },
          ],
        },
      ],
    },
    settings: {
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
    },
  },
];

export default eslintConfig;
