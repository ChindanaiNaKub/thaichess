import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const typescriptUnusedVars = ['error', {
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_',
}];

export default [
  // Base recommended config
  js.configs.recommended,

  // Client-side TypeScript/React files
  {
    files: ['client/**/*.{ts,tsx}', 'shared/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        // Disable type-aware linting to avoid path resolution issues
        // Can be re-enabled later with proper tsconfig path configuration
      },
      globals: {
        ...globals.browser,
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks
    },
    rules: {
      // TypeScript already checks undefined identifiers; no-undef false-positives
      // on DOM/Node/Vite types (React, process, RequestInfo, ImportMetaEnv, …).
      'no-undef': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': typescriptUnusedVars,
    }
  },

  // Server-side TypeScript files
  {
    files: ['server/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': typescriptUnusedVars,
    }
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'client/dist/**',
      'client/public/engines/fairy-stockfish.js',
      'client/public/engines/manifest.json',
      'client/public/engines/stockfish.js',
      'client/public/engines/stockfish.worker.js',
      'server/dist/**',
      'client/coverage/**',
      'coverage/**',
      '**/*.config.js',
      '**/*.config.ts',
      'client/playwright.config.ts',
    ]
  }
];
