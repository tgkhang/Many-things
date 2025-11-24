import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import importPlugin from 'eslint-plugin-import'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      react.configs.flat.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.json', '.css'],
        },
      },
    },
    rules: {
      // React specific rules
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Disable prop-types validation
      'react/jsx-no-undef': 'error', // Error on undefined components

      // Code quality
      'no-console': 'warn',
      'no-lonely-if': 'warn',
      'no-unused-vars': 'warn',
      'no-trailing-spaces': 'warn',
      'no-multi-spaces': 'warn',
      'no-multiple-empty-lines': 'warn',
      'no-unexpected-multiline': 'warn',
      'no-extra-boolean-cast': 'off',

      // Import/Export rules
      // 'import/no-unresolved': ['error', {
      //   ignore: ['^vite$', '^@vitejs/', 'eslint/config'], // Ignore node modules that ESLint can't resolve
      // }],

      // 'import/named': 'error', // Ensure named imports exist
      // 'import/default': 'error', // Ensure default import exists
      // 'import/namespace': ['error', {
      //   allowComputed: true,
      // }],

      // Formatting
      'space-before-blocks': ['error', 'always'],
      'object-curly-spacing': ['warn', 'always'],
      'indent': ['warn', 2],
      'semi': ['warn', 'never'],
      'quotes': ['error', 'single'],
      'array-bracket-spacing': 'warn',
      'linebreak-style': 'off',
      'keyword-spacing': 'warn',
      //'comma-dangle': 'warn',
      'comma-spacing': 'warn',
      'arrow-spacing': 'warn',

      //MUI import restrictions
      'no-restricted-imports': [
        'error',
        {
          'patterns': [{ 'regex': '^@mui/[^/]+$' }]
        }
      ]
    },
  },
])