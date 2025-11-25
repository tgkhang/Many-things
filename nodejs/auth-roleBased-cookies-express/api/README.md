# Authentication API Template

A secure, role-based authentication API built with Express.js and MongoDB using HttpOnly cookies with advanced security features.

## Features

- JWT-based authentication with access/refresh tokens
- **Refresh Token Rotation** - New tokens issued on each refresh, old ones invalidated
- **Token Theft Detection** - Automatic session revocation on reuse detection
- HttpOnly secure cookies (XSS protection)
- **Three-Level RBAC** - Simple roles, permissions, and role inheritance
- Email verification flow
- **Password Reset Flow** - Secure email-based password recovery
- **Account Lockout** - Protection after failed login attempts
- **Audit Logging** - Track all authentication events
- **Session Management** - View and revoke active sessions
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
BUILD_MODE=dev

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

**Account Lockout:** After 5 failed attempts, account is locked for 15 minutes.

**Errors:**
- `401 Unauthorized` - Invalid email or password
- `401 Unauthorized` - Account not verified
- `429 Too Many Requests` - Account locked

---

#### Refresh Token

```http
GET /v1/users/refresh_token
```

**Cookies Required:** `refreshToken`

**Response:** `200 OK`

Returns new access AND refresh tokens (rotation).

```json
{
  "accessToken": "new-jwt...",
  "refreshToken": "new-jwt..."
}
```

**Security:** Old refresh token is invalidated. Reusing an old token revokes the entire token family.

**Errors:**
- `403 Forbidden` - Invalid refresh token

---

#### Logout

```http
DELETE /v1/users/logout
```

**Response:** `200 OK`

Clears `accessToken` and `refreshToken` cookies. Revokes refresh token in database.

```json
{
  "loggedOut": true
}
```

---

#### Logout All Devices

```http
DELETE /v1/users/logout_all
```

**Authentication:** Required

Revokes all refresh tokens for the user across all devices.

```json
{
  "loggedOutAll": true
}
```

---

### Password Reset

#### Forgot Password

```http
POST /v1/users/forgot_password
```

**Rate Limited:** 3 requests per hour

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

Always returns success to prevent email enumeration.

```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

---

#### Reset Password

```http
PUT /v1/users/reset_password
```

**Rate Limited:** 3 requests per hour

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password has been reset successfully. Please login with your new password."
}
```

**Security:** All existing sessions are revoked after password reset.

**Errors:**
- `400 Bad Request` - Invalid or expired token

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

#### Get Security Events (Audit Log)

```http
GET /v1/users/security_events
```

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "event": "LOGIN_SUCCESS",
    "success": true,
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": 1234567890
  },
  {
    "event": "PASSWORD_CHANGED",
    "success": true,
    "createdAt": 1234567800
  }
]
```

---

#### Get Active Sessions

```http
GET /v1/users/sessions
```

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "count": 2,
  "sessions": [
    {
      "createdAt": 1234567890,
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      "ipAddress": "192.168.1.1"
    },
    {
      "createdAt": 1234567800,
      "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)...",
      "ipAddress": "192.168.1.2"
    }
  ]
}
```

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
                    │   Refresh   │──▶ New tokens (rotation)
                    └─────────────┘
```

## Role-Based Authorization

This template includes **three levels** of RBAC (Role-Based Access Control) implementation, each with increasing complexity and flexibility.

### Quick Start - Using Basic RBAC

Use the `requireRole` middleware for simple role-based protection:

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
- `moderator` - Limited administrative access
- `client` - Standard user (default)

### Advanced RBAC - Three Levels

For more sophisticated access control, this template provides three RBAC implementations:

| Level | Description | Use Case |
|-------|-------------|----------|
| **LV1** | Simple role checking | Basic apps with 2-3 roles |
| **LV2** | Permission-based (roles have permissions) | Standard business apps |
| **LV3** | Role inheritance (roles inherit from other roles) | Enterprise apps with complex hierarchies |

**Example - Level 2 (Permission-based):**
```javascript
import { rbacMiddleware_LV2 } from '~/middlewares/rbacMiddleware-LV2'
import { PERMISSIONS } from '~/utils/constants'

Router.delete(
  '/messages/:id',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV2.isValidPermission([PERMISSIONS.DELETE_MESSAGE_A]),
  messageController.delete
)
```

**Example - Level 3 (Role Inheritance):**
```javascript
import { rbacMiddleware_LV3 } from '~/middlewares/rbacMiddleware-LV3'

// Admin inherits all permissions from moderator and client
Router.put(
  '/complex-operation',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV3.isValidPermission([
    PERMISSIONS.READ_MESSAGE_A,
    PERMISSIONS.WRITE_MESSAGE_A,
    PERMISSIONS.DELETE_MESSAGE_A
  ]),
  controller.complexOperation
)
```

### RBAC Test Endpoints

Test all three RBAC levels using the `/v1/rbac/*` endpoints:

```bash
# Check your current permissions
GET /v1/rbac/me

# Test LV1 (simple role check)
GET /v1/rbac/lv1/admin-only
GET /v1/rbac/lv1/admin-moderator

# Test LV2 (permission-based)
GET /v1/rbac/lv2/read-message-a
POST /v1/rbac/lv2/write-message-a
DELETE /v1/rbac/lv2/delete-message-a

# Test LV3 (role inheritance)
GET /v1/rbac/lv3/read-message-a
POST /v1/rbac/lv3/write-message-a
DELETE /v1/rbac/lv3/delete-message-a
```

📚 **For detailed RBAC documentation**, see [RBAC_GUIDE.md](RBAC_GUIDE.md) which includes:
- Complete explanation of each level
- Permission matrices
- Role inheritance hierarchy diagrams
- Implementation examples
- When to use which level
- Migration guide

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| XSS Protection | HttpOnly cookies |
| Token Theft Detection | Refresh token rotation with family tracking |
| CSRF Protection | SameSite cookie attribute |
| Brute Force | Rate limiting + account lockout (5 attempts = 15 min lock) |
| Password Reset | Time-limited tokens (1 hour), session revocation |
| Audit Trail | All auth events logged with IP/User-Agent |
| Security Headers | Helmet middleware |
| Password Storage | bcryptjs (10 salt rounds) |
| Token Expiry | Access: 1h, Refresh: 14d |
| Request Size Limit | 10kb JSON body limit |
| User Enumeration | Generic error messages |
| Session Management | View/revoke active sessions |

---

## Audit Events

The following events are logged:

| Event | Description |
|-------|-------------|
| `LOGIN_SUCCESS` | Successful login |
| `LOGIN_FAILED` | Failed login attempt |
| `LOGOUT` | User logout |
| `LOGOUT_ALL_DEVICES` | Logout from all devices |
| `REGISTER` | New account registration |
| `EMAIL_VERIFIED` | Email verification completed |
| `TOKEN_REFRESH` | Token refreshed successfully |
| `TOKEN_REFRESH_FAILED` | Token refresh failed |
| `TOKEN_REUSE_DETECTED` | Potential token theft detected |
| `PASSWORD_CHANGED` | Password changed |
| `PASSWORD_RESET_REQUESTED` | Password reset email sent |
| `PASSWORD_RESET_SUCCESS` | Password reset completed |
| `PASSWORD_RESET_FAILED` | Password reset failed |
| `ACCOUNT_LOCKED` | Account locked due to failed attempts |
| `PROFILE_UPDATED` | User profile updated |

---

## Database Collections

### users
- User accounts with credentials and profile
- Lockout tracking fields

### refreshTokens
- Stored refresh tokens for rotation and revocation
- Token family tracking for theft detection

### auditLogs
- Security event audit trail
- IP and User-Agent tracking

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
| 403 | Forbidden - Insufficient permissions / Token revoked |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 410 | Gone - Token expired |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit / Account locked |

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
│   ├── authMiddleware.js         # JWT & role validation
│   ├── rbacMiddleware-LV1.js     # Simple role-based RBAC
│   ├── rbacMiddleware-LV2.js     # Permission-based RBAC
│   ├── rbacMiddleware-LV3.js     # Role inheritance RBAC
│   └── errorHandlingMiddleware.js
├── models/
│   ├── userModel.js           # User schema & queries
│   ├── refreshTokenModel.js   # Token storage & rotation
│   └── auditLogModel.js       # Audit logging
├── providers/
│   ├── BrevoEmailProvider.js
│   └── JwtProvider.js
├── routes/
│   └── v1/
│       ├── index.js
│       ├── userRoute.js
│       └── rbacRoute.js       # RBAC test routes
├── services/
│   └── userService.js   # Business logic
├── utils/
│   ├── ApiError.js
│   ├── constants.js     # Security config + RBAC data
│   ├── formatters.js
│   └── validators.js
├── validations/
│   └── userValidation.js
├── server.js            # App entry point
└── RBAC_GUIDE.md        # Complete RBAC documentation
```

---

## Security Configuration

Edit `src/utils/constants.js` to customize:

```javascript
export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,           // Lock after N failed attempts
  LOCKOUT_DURATION_MINUTES: 15,    // Lock duration
  PASSWORD_RESET_EXPIRY_MINUTES: 60, // Reset token validity
  REFRESH_TOKEN_EXPIRY_DAYS: 14,
  MAX_SESSIONS_PER_USER: 5,
}
```

---

## License

MIT
