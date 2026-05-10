import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // ── TypeScript ─────────────────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrors': 'none',
        'destructuredArrayIgnorePattern': '^_',
        'ignoreRestSiblings': true,
      }],

      // ── React Hooks (v7) ──────────────────────────────────────────────────
      // react-hooks/immutability: flags functions called in useEffect before
      // they're declared. Common hoisting pattern — turn off.
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'warn',

      // ── General JS ────────────────────────────────────────────────────────
      'no-useless-escape': 'warn',
      'no-use-before-define': 'off',

      // ── React Refresh ─────────────────────────────────────────────────────
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
