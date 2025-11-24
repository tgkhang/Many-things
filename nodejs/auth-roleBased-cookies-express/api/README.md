# Authentication API Template

A secure, role-based authentication API built with Express.js and MongoDB using HttpOnly cookies.

## Features

- JWT-based authentication with access/refresh tokens
- HttpOnly secure cookies (XSS protection)
- Role-based authorization (admin, client)
- Email verification flow
- Rate limiting on auth routes
- Security headers with Helmet
- Password hashing with bcryptjs

## Tech Stack

- **Express.js 5** - Web framework
- **MongoDB** - Database
- **JWT** - Token-based authentication
- **Bcryptjs** - Password hashing
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **Joi** - Validation
- **Brevo** - Email service

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build && npm run production
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
MONGODB_URI=mongodb+srv://...
DATABASE_NAME=your-db-name
LOCAL_DEV_APP_HOST=localhost
LOCAL_DEV_APP_PORT=8010

# JWT Configuration
ACCESS_JWT_SECRET_KEY=your-access-secret
ACCESS_JWT_EXPIRES_IN=1h
REFRESH_JWT_SECRET_KEY=your-refresh-secret
REFRESH_JWT_EXPIRES_IN=14d

# Frontend URLs
WEBSITE_DOMAIN_DEVELOPMENT=http://localhost:5173
WEBSITE_DOMAIN_PRODUCTION=https://your-domain.com

# Email (Brevo)
BREVO_API_KEY=your-brevo-api-key
ADMIN_EMAIL_ADDRESS=noreply@your-domain.com
ADMIN_EMAIL_NAME=Your App Name
```

---

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/status` | API health check |

---

### Authentication

#### Register

```http
POST /v1/users/register
```

**Rate Limited:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

**Response:** `201 Created`
```json
{
  "_id": "...",
  "email": "user@example.com",
  "username": "user",
  "displayName": "user",
  "role": "client",
  "isActive": false,
  "createdAt": 1234567890
}
```

**Errors:**
- `409 Conflict` - Email already in use
- `422 Unprocessable Entity` - Validation error

---

#### Verify Email

```http
PUT /v1/users/verify_account
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "uuid-verification-token"
}
```

**Response:** `200 OK`
```json
{
  "_id": "...",
  "email": "user@example.com",
  "isActive": true
}
```

**Errors:**
- `404 Not Found` - Account not found
- `409 Conflict` - Already verified
- `410 Gone` - Token expired (valid for 24 hours)
- `401 Unauthorized` - Invalid token

---

#### Login

```http
POST /v1/users/login
```

**Rate Limited:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response:** `200 OK`

Sets HttpOnly cookies:
- `accessToken` - Short-lived access token
- `refreshToken` - Long-lived refresh token

```json
{
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "_id": "...",
  "email": "user@example.com",
  "username": "user",
  "displayName": "user",
  "role": "client",
  "isActive": true
}
```

**Errors:**
- `401 Unauthorized` - Invalid email or password
- `401 Unauthorized` - Account not verified

---

#### Refresh Token

```http
GET /v1/users/refresh_token
```

**Cookies Required:** `refreshToken`

**Response:** `200 OK`

Sets new `accessToken` cookie.

```json
{
  "accessToken": "new-jwt..."
}
```

**Errors:**
- `403 Forbidden` - Invalid refresh token

---

#### Logout

```http
DELETE /v1/users/logout
```

**Response:** `200 OK`

Clears `accessToken` and `refreshToken` cookies.

```json
{
  "loggedOut": true
}
```

---

### Protected Routes

All protected routes require the `accessToken` cookie.

#### Update Profile

```http
PUT /v1/users/update
```

**Authentication:** Required

**Request Body (Update Display Name):**
```json
{
  "displayName": "New Name"
}
```

**Request Body (Change Password):**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

**Response:** `200 OK`
```json
{
  "_id": "...",
  "email": "user@example.com",
  "displayName": "New Name"
}
```

**Errors:**
- `401 Unauthorized` - Not authenticated
- `401 Unauthorized` - Current password incorrect
- `410 Gone` - Access token expired (refresh required)

---

## Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Register  │────▶│ Send Email  │────▶│   Verify    │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Logout    │◀────│  Use API    │◀────│    Login    │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼ (Token Expired)
                    ┌─────────────┐
                    │   Refresh   │
                    └─────────────┘
```

## Role-Based Authorization

Use the `requireRole` middleware for protected routes:

```javascript
import { authMiddleware } from '~/middlewares/authMiddleware'

// Admin only route
Router.route('/admin')
  .get(
    authMiddleware.isAuthorized,
    authMiddleware.requireRole('admin'),
    adminController.dashboard
  )

// Multiple roles
Router.route('/dashboard')
  .get(
    authMiddleware.isAuthorized,
    authMiddleware.requireRole('admin', 'moderator'),
    dashboardController.get
  )
```

**Available Roles:**
- `admin` - Full access
- `client` - Standard user (default)

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| XSS Protection | HttpOnly cookies |
| CSRF Protection | SameSite cookie attribute |
| Brute Force | Rate limiting (5 attempts/15min) |
| Security Headers | Helmet middleware |
| Password Storage | bcryptjs (10 salt rounds) |
| Token Expiry | Access: 1h, Refresh: 14d |
| Request Size Limit | 10kb JSON body limit |
| User Enumeration | Generic error messages |

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 401,
  "message": "Error description",
  "stack": "..." // Only in development
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 401 | Unauthorized - Invalid credentials or token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 410 | Gone - Token expired |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |

---

## Project Structure

```
src/
├── config/
│   ├── cors.js          # CORS configuration
│   ├── environment.js   # Environment variables
│   └── mongodb.js       # Database connection
├── controllers/
│   └── userController.js
├── middlewares/
│   ├── authMiddleware.js      # JWT & role validation
│   └── errorHandlingMiddleware.js
├── models/
│   └── userModel.js     # User schema & queries
├── providers/
│   ├── BrevoEmailProvider.js
│   └── JwtProvider.js
├── routes/
│   └── v1/
│       ├── index.js
│       └── userRoute.js
├── services/
│   └── userService.js   # Business logic
├── utils/
│   ├── ApiError.js
│   ├── constants.js
│   ├── formatters.js
│   └── validators.js
├── validations/
│   └── userValidation.js
└── server.js            # App entry point
```

---

## License

MIT
