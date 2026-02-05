const js = require('@eslint/js')
const tseslint = require('typescript-eslint')
const importPlugin = require('eslint-plugin-import')
// Import config that turns off ESLint rules that conflict with Prettier
const prettier = require('eslint-config-prettier')

/** @type {import('eslint').FlatConfig.ConfigArray} */
// Export array of ESLint configurations (applied in order)
module.exports = [
  // Ignore: Files that ESLint should NOT check
  { ignores: ['eslint.config.*', 'dist/**'] },

  // Use recommended JavaScript rules (catches common JS errors)
  js.configs.recommended,

  // Use recommended TypeScript rules (catches common TS errors)
  ...tseslint.configs.recommended,

  // Use import plugin's recommended rules (organizes imports)
  importPlugin.flatConfigs.recommended,

  // Turn off formatting rules that Prettier handles (prevents conflicts)
  // ESLint: Turns off its own spacing/formatting rules
  // Prettier: Handles ALL formatting
  // Result: They COOPERATE! ✅
  prettier,

  // Custom rules specifically for TypeScript files
  {
    // Files: Apply these rules only to .ts files
    files: ['**/*.ts'],
    languageOptions: {
      //How ESLint should parse the code
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },

    rules: {
      // Allow using 'any' type (sometimes necessary in real projects)
      '@typescript-eslint/no-explicit-any': 'off',

      // Warn about unused variables, but ignore ones starting with _ (like _req, _unused)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // Enforce import ordering: alphabetical with blank lines between groups
      'import/order': [
        'error', // Show as error if not followed
        {
          'newlines-between': 'always', // Blank line between import groups
          alphabetize: { order: 'asc' }, // Sort imports A-Z
        },
      ],

      // Turn off import resolution checking (TypeScript handles this better)
      'import/no-unresolved': 'off',

      // Turn off named import checking (TypeScript handles this)
      'import/named': 'off',

      // Turn off file extension checking (TypeScript handles this)
      'import/extensions': 'off',
    },
  },
]
