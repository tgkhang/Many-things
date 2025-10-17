# Legacy ESLint Configuration (CommonJS Module)

This configuration uses the legacy `.eslintrc.cjs` format for older React projects.

## Installation

```bash
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh
```

## Usage

Copy `.eslintrc.cjs` and `.eslintignore` to your project root and run:

```bash
npx eslint .
```

## Features

- CommonJS module format
- React 18.2+ support
- React Hooks rules
- React Refresh/Fast Refresh rules
- Code quality and formatting rules

## Note

This is a legacy configuration. For modern Vite-based React apps, use the flat config format in the `modern-flat-config` folder.
