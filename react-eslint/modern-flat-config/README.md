# React ESLint Configuration

This directory contains ESLint configurations for React projects.

## Modern Configuration (Recommended)

**File:** `eslint.config.js`

This is the modern flat config format for ESLint 9+ and Vite-based React applications.

### Installation

```bash
npm install -D eslint @eslint/js globals eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-plugin-react typescript-eslint
```

### Usage

Copy `eslint.config.js` to your project root and run:

```bash
npx eslint .
```

### Features

- ESLint 9+ flat config format
- TypeScript support with typescript-eslint
- React 18.3+ support
- React Hooks rules
- React Refresh/Fast Refresh rules
- Code quality and formatting rules
- Ignores dist and node_modules

---

## Legacy Configuration (Deprecated)

**Files:** `.eslintrc.cjs.OLD` and `.eslintignore.OLD`

These files use the legacy CommonJS module format for older React projects. They are kept for reference but should not be used for new projects.

### Migration

If you're migrating from the legacy config to the modern config:

1. Remove `.eslintrc.cjs` and `.eslintignore` from your project
2. Install the dependencies listed above
3. Copy `eslint.config.js` to your project root
4. Update your package.json scripts if needed
5. Test with `npx eslint .`

---

## Configuration Details

### Rules Overview

- **React Refresh**: Warns about components that should be export-only
- **React Hooks**: Enforces rules of hooks and dependency arrays
- **TypeScript**: Warns about unused variables and explicit any types
- **Code Quality**: Catches common issues like unused vars, console logs, etc.
- **Formatting**: Enforces consistent spacing, quotes, semicolons, etc.

### Customization

Adjust the rules in `eslint.config.js` to match your team's preferences. The current configuration uses:

- Single quotes
- No semicolons
- 2-space indentation
- Space before blocks
- Object curly spacing

---

## Troubleshooting

### ESLint Version

Make sure you're using ESLint 9 or later:

```bash
npx eslint --version
```

### Plugin Compatibility

If you encounter issues, ensure all plugins are compatible with ESLint 9+ flat config format.
