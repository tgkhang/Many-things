# Many-things

A personal collection of project templates, design pattern examples, utility helpers, and IDE configurations — accumulated as learning resources and reusable references.

---

## Repository Structure

```
Many-things/
├── pj-template/        Project boilerplates & full-stack examples
├── des pat/            design patterns (Java)
└── setting-helper/     Dev utilities, IDE configs, shell references
```

---

## `pj-template/` — Project Templates

### `auth0-sso-react-node/`

Auth0 Single Sign-On integration demo. (not completed)

---

### `nodejs/auth-roleBased-cookies-express/`

Full authentication system with Role-Based Access Control (RBAC), built with Express + MongoDB. Four sub-projects covering different frontend approaches and stack combinations.

#### `api/` — Express + MongoDB backend

- JWT authentication via **HttpOnly cookies**
- Refresh token rotation with **theft detection**
- Account **lockout** after 5 failed attempts (15 min)
- Email verification + password reset (Brevo email provider)
- **Audit logging** for all auth events
- Session management
- Three RBAC levels:
  - `rbacMiddleware-LV1` — simple role check (admin / moderator / client)
  - `rbacMiddleware-LV2` — permission-based (roles have permission lists)
  - `rbacMiddleware-LV3` — role inheritance (roles extend other roles)
- Stack: Express 5, MongoDB, JWT, bcryptjs, Helmet, Zod

#### `web-authcontext-hook/` — React frontend (Context API)

- State management via React Context + custom hooks (`useAuth`, `usePermission`)
- Route guards: `AuthGuard`, `GuestGuard`, `RoleGuard`, `PermissionGuard`
- Pages: Login, Register, Forgot/Reset Password, Email Verification, Dashboard, Settings (account, security, sessions, audit log)
- Stack: React 19, Vite, Material-UI, React Router, Axios

#### `web-redux-persist/` — React frontend (Redux)

- Same features as context version but state managed by Redux + redux-persist
- `userSlice.js` for user state, `RBACRoute` + `RBACRouteOutlet` components
- Stack: React 19, Vite, Material-UI, Redux Toolkit, React Router

#### `next + api/` — Next.js + Express (full-stack, TypeScript-ready)

- **`api/`** — Express backend with **Prisma ORM** instead of raw MongoDB drivers
  - Docker Compose setup, DB migrations, seed script
- **`web/`** — Next.js 13+ (App Router) with TypeScript
  - Route groups: `(auth)` for login/register/reset, `(protected)` for dashboard
  - shadcn/ui components, Auth context, RBAC config, Axios interceptors

---

### `nodejs/boilerplate express mongo setup/`

Minimal, clean Express + MongoDB starter template.

- Pre-configured folder structure: `controllers/`, `models/`, `services/`, `middlewares/`, `routes/`
- CORS, environment config, Babel, ESLint
- Good starting point for any new Node.js API project

---

### `nodejs/sample-eslint-config-nodejs/` & `nodejs/sample-eslint-config-react/`

Ready-to-copy ESLint configs.

| Folder | Format |
|---|---|
| `sample-eslint-config-nodejs/legacy/` | Legacy `.eslintrc.cjs` for Node.js |
| `sample-eslint-config-react/legacy-module/` | Legacy `.eslintrc.cjs` for React |
| `sample-eslint-config-react/modern-flat-config/` | Modern flat `eslint.config.js` (JS + TypeScript variants) |

---

### `nodejs/test/`

Unit testing practice projects.

#### `unit-test-nodejs-typescript/`

Backend testing with **Jest + TypeScript**.

- Covers: controller, service, repository, route, middleware, utils
- Patterns: mocking, Supertest for HTTP, coverage reporting
- Stack: Express 5, MongoDB, Jest, TypeScript

#### `unit-test-react-typescript/`

Frontend component testing with **Jest + React Testing Library + TypeScript**.

- Examples: Button, Counter, DebounceSearch, SignUpForm, TodoList
- Also tests custom hooks (`useCounter`) and utility functions
- Stack: React, Vite, Jest, TypeScript

---

### `nodejs/vite-absolute-relative-import/`

Config example showing how to set up absolute path imports in Vite (`jsconfig.json` + `vite.config.js`).

---

## `des pat/` — Design Patterns (Java)

Classic Gang of Four patterns implemented in Java, using a pizza/coffee/shopping cart domain.

| Pattern | What it demonstrates |
|---|---|
| `Decorator/` | Coffee shop — add condiments (Mocha, Whip) to beverages dynamically without subclassing |
| `Factory/SimpleFactory/` | Pizza store — a factory class creates different pizza types |
| `Factory/FactoryMethod/` | Pizza store chains — subclasses (NY, Chicago, MyTho) decide which pizza to make |
| `Factory/AbstractFactory/` | Pizza ingredient factories — regional factories (NY, MyTho) produce different ingredients |
| `Observer/` | Weather station — displays (CurrentConditions, Forecast, Statistics) update automatically |
| `Singleton/` | Three versions: basic synchronized, double-checked locking, eager initialization |
| `Strategy/` | Shopping cart — swap payment methods (Cash, CreditCard, PayPal) at runtime |

---

## `setting-helper/` — Developer Utilities & Configs

### `utils-helpers/`

Small reusable JavaScript snippets.

| File | What it does |
|---|---|
| `avatar.js` | `getInitials(name)` — "John Doe" → "JD" |
| `slug.js` | `slugify(val)` — converts Vietnamese/accented strings to URL-safe slugs |
| `copy.js` | Reference for shallow vs deep copy methods (spread, structuredClone, Lodash, etc.) |
| `index.js` | `mapOrder(array, orderArray, key)` — sorts an array by a given order array |
| `mongoHelper.js` | MongoDB utility helpers |
| `avoidSpamCLick.js` | Debounce/throttle pattern to prevent button spam clicks |

### `ide-setting/`

| File | What it does |
|---|---|
| `vscode.setting.json` | Personal VS Code `settings.json` — copy into `.vscode/settings.json` |
| `.prettierrc` | Prettier config for consistent code formatting |
| `.vimrc` | Vim editor configuration |

### `shell cheat sheet/`

| File | What it does |
|---|---|
| `sdk man.md` | SDKMAN cheat sheet — manage Java/Node/SDK versions from the terminal |

---

## Tech Stack Summary

**Backend:** Node.js, Express.js, MongoDB, Prisma, JWT, bcryptjs, Helmet, Zod, Vitest/Jest
**Frontend:** React, Next.js, Vite, TypeScript, Material-UI, shadcn/ui, Redux, React Router, Axios
**Testing:** Jest, Supertest, React Testing Library
**Other:** Java (design patterns), Auth0, ESLint, Babel, Docker
