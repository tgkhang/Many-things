# Authentication Frontend

A React frontend for the role-based authentication API, built with Vite and Material-UI.

## Features

- User registration with email verification
- Login with JWT authentication (HttpOnly cookies)
- Password reset flow (forgot/reset password)
- Protected dashboard
- Profile settings (display name update)
- Password change
- Security events audit log
- Active sessions management
- Logout from all devices
- Dark/Light mode toggle
- Responsive design

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Material-UI (MUI)** - Component library
- **Redux Toolkit** - State management
- **Redux Persist** - Persist auth state
- **React Router DOM** - Routing
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **React Toastify** - Toast notifications

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Environment Variables

The API root is configured in `src/utils/constants.js`:

- **Development**: `http://localhost:8010`
- **Production**: Update `apiRoot` for production API URL

## Project Structure

```
src/
├── apis/                    # API service functions
│   └── index.js            # All API calls
├── assets/                  # Static assets
├── components/              # Reusable components
│   ├── AppBar/             # Navigation bar
│   │   └── Menus/          # Profile menu
│   ├── Form/               # Form utilities
│   ├── Loading/            # Loading spinner
│   └── ModeSelect/         # Theme toggle
├── pages/                   # Page components
│   ├── Auth/               # Authentication pages
│   │   ├── Auth.jsx        # Auth container
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   ├── ForgotPasswordForm.jsx
│   │   ├── ResetPasswordForm.jsx
│   │   └── AccountVerification.jsx
│   ├── Dashboard/          # Main dashboard
│   ├── Settings/           # User settings
│   │   ├── AccountTab.jsx
│   │   ├── SecurityTab.jsx
│   │   ├── SecurityEventsTab.jsx
│   │   └── SessionsTab.jsx
│   └── 404/                # Not found page
├── redux/                   # State management
│   ├── store.js
│   └── user/
│       └── userSlice.js
├── utils/                   # Utilities
│   ├── authorizeAxios.js   # Axios with interceptors
│   ├── constants.js
│   ├── formatters.js
│   └── validators.js
├── App.jsx                  # Main routing
├── main.jsx                 # Entry point
└── theme.js                 # MUI theme
```

## Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/login` | Public | Login page |
| `/register` | Public | Registration page |
| `/forgot-password` | Public | Request password reset |
| `/reset-password` | Public | Reset password (with token) |
| `/account/verification` | Public | Email verification |
| `/dashboard` | Protected | User dashboard |
| `/settings/account` | Protected | Profile settings |
| `/settings/security` | Protected | Password & security |

## API Integration

This frontend is designed to work with the companion Express.js authentication API. The API should be running on `http://localhost:8010` for development.

### Endpoints Used

- `POST /v1/users/register` - Register new user
- `PUT /v1/users/verify_account` - Verify email
- `POST /v1/users/login` - Login
- `GET /v1/users/refresh_token` - Refresh JWT
- `DELETE /v1/users/logout` - Logout
- `DELETE /v1/users/logout_all` - Logout all devices
- `POST /v1/users/forgot_password` - Request password reset
- `PUT /v1/users/reset_password` - Reset password
- `PUT /v1/users/update` - Update profile/password
- `GET /v1/users/security_events` - Get audit log
- `GET /v1/users/sessions` - Get active sessions

## Authentication Flow

```
Register → Verify Email → Login → Dashboard
                            ↓
                    Access Protected Routes
                            ↓
                Token Expired? → Auto Refresh
                            ↓
                        Logout
```

## License

MIT
