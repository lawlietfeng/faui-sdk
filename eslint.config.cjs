const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const globals = require("globals");

const tsRecommendedRules = (tsPlugin.configs.recommended && tsPlugin.configs.recommended.rules) || {};

module.exports = [
  {
    ignores: ["dist/**", "node_modules/**", "scripts/**"]
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "examples/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      ...tsRecommendedRules,
      "no-console": "off",
      "no-redeclare": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ]
    }
  }
];
