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
            // 2. Block imports from other features using aliases
            {
              group: ["@/features/*"],
              message:
                "Do not import from other features using the feature alias. Only import from your own feature.",
            },
            // 3. Block imports from other features using relative paths
            {
              group: ["../*"],
              message:
                "Do not import from other features using relative paths. Use feature aliases or only import from your own feature.",
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
