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
      // Allow any types (common in rapid development)
      '@typescript-eslint/no-explicit-any': 'off',

      // Unused vars: ignore args/vars prefixed with _, and ALL catch-block errors
      '@typescript-eslint/no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrors': 'none',  // never flag unused catch(err) variables
      }],

      // Functions declared after useEffect that call them — common JS hoisting pattern,
      // safe with async functions but ESLint flags it. Downgrade to warn.
      'react-hooks/immutability': 'warn',

      // setState in useEffect — already off, keep off
      'react-hooks/set-state-in-effect': 'off',

      // Missing useEffect deps — warn only, not error
      'react-hooks/exhaustive-deps': 'warn',

      // Empty interfaces are fine as extension points
      '@typescript-eslint/no-empty-object-type': 'off',

      // Useless escapes in regex — warn only
      'no-useless-escape': 'warn',

      // ThemeContext exports a constant alongside components — common pattern, warn only
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
