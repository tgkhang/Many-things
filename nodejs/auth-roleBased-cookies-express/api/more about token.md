Analysis: Storing Tokens in Database - Security Considerations
Looking at your implementation, I found two types of tokens being stored in the database:
1. Password Reset Tokens (userModel.js:23-24)
passwordResetToken: Joi.string().default(null),
passwordResetExpiry: Joi.date().timestamp('javascript').default(null),
2. Refresh Tokens (refreshTokenModel.js:6-15)
token: Joi.string().required(),
familyId: Joi.string().required(),
expiresAt: Joi.date().timestamp('javascript').required(),
The "Don't Store Tokens in DB" Debate
What People Mean by "Don't Store Tokens"
When security experts say "don't store tokens in the database," they typically refer to:
JWT Access Tokens - These should NOT be stored in DB (stateless by design)
Plaintext sensitive tokens - Should be hashed before storage
Permanent API keys - Should be hashed like passwords
Your Current Implementation - Security Analysis
✅ GOOD - Refresh Tokens (Currently OK but could be better)
What you're doing: Storing full JWT refresh tokens in DB (userService.js:224-230) Why it's acceptable:
Refresh tokens SHOULD be stateful (in DB) for revocation control
You implement proper security features:
Token rotation (userService.js:294)
Token family detection (refreshTokenModel.js:62-69)
Revocation mechanism (refreshTokenModel.js:51-58)
Reuse detection (userService.js:275-285)
Security improvement recommended:
// Instead of storing the full JWT
token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQ..."

// Store only a hash
tokenHash: "a8f3b2c1d4e5f6..." // SHA-256 hash of the token
⚠️ CRITICAL ISSUE - Password Reset Tokens (Needs Fixing)
What you're doing: Storing plaintext UUID reset tokens (userService.js:394-399)
const resetToken = uuidv4()
await userModel.update(existingUser._id, {
  passwordResetToken: resetToken,  // ❌ PLAINTEXT!
  passwordResetExpiry: resetExpiry,
})
Why this is a security risk:
If database is compromised, attacker can reset ANY user's password
No additional protection layer
How to fix:
// In forgotPassword function
const resetToken = uuidv4()
const resetTokenHash = crypto
  .createHash('sha256')
  .update(resetToken)
  .digest('hex')

await userModel.update(existingUser._id, {
  passwordResetToken: resetTokenHash,  // ✅ Store hash
  passwordResetExpiry: resetExpiry,
})

// Send only the original token via email
const resetLink = `${WEBSITE_DOMAIN}/account/reset-password?token=${resetToken}`

// In resetPassword function - hash the incoming token to compare
const tokenHash = crypto
  .createHash('sha256')
  .update(token)
  .digest('hex')

const existingUser = await userModel.findByPasswordResetToken(tokenHash)
Why Store Some Tokens in DB?
Tokens that SHOULD be in database:
Refresh Tokens - For revocation, session management, security breach response
Password Reset Tokens - For one-time use validation (but HASHED)
Email Verification Tokens - For account activation (but HASHED)
API Keys - For long-lived access (but HASHED)
Tokens that should NOT be in database:
JWT Access Tokens - Defeats the purpose of stateless authentication
Session IDs - Unless you're doing session-based auth (different architecture)
Audit Log Concerns
Your audit log (auditLogModel.js) correctly does NOT store actual tokens - it only logs events. This is perfect ✅
Recommendations
Priority 1: Hash Password Reset Tokens
// Use crypto module
import crypto from 'crypto'

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
Priority 2: Consider Hashing Refresh Tokens
While less critical (they expire and rotate), hashing adds defense-in-depth.
Priority 3: Add Database Encryption at Rest
Use MongoDB encryption or database-level encryption for additional protection.
Summary
Is your current method OK?
✅ Refresh token storage pattern is good
❌ Password reset tokens should be hashed
✅ Audit logs are properly implemented
✅ Token rotation and revocation are well-designed
Where should tokens be stored?
Database: Refresh tokens (hashed), reset tokens (hashed), verification tokens (hashed)
Client: Access tokens (cookies/memory, NEVER localStorage for sensitive apps)
Never stored: One-time codes after validation
The key principle: If it's in the database and could grant access, hash it. If you need to revoke it, store it (hashed).