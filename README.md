# Professional Boilerplate: JWT Authentication, Email Verification & Password Reset

A Node.js, Express 5, TypeScript, TypeORM, and MySQL REST API boilerplate with **JWT authentication**, **email verification**, and **password reset** using Nodemailer. Emails are tested with Ethereal.

**Author:** Rex Hipolito

---

## Tech Stack

- **Runtime & Language:** Node.js, TypeScript
- **Web Framework:** Express 5
- **ORM & Database:** TypeORM, MySQL
- **Authentication & Security:** `jsonwebtoken`, `bcrypt`, `crypto`, `helmet`, `cors`, `express-rate-limit`
- **Email:** Nodemailer (Ethereal for testing)
- **Validation & Logging:** `joi`, custom logger and error handlers

---

## Features

- JWT login and protected routes
- Registration with email verification
- Login blocked until the email is verified
- Forgot password and reset password by email
- Secure random tokens with expiry (24 hours for verification, 1 hour for reset)
- One-time tokens that are cleared after use
- Joi validation on all endpoints

---

## Project Structure

```text
src/
├── config/
│   ├── data-source.ts            # TypeORM MySQL DataSource
│   └── env.ts                    # Joi env validation (JWT, SMTP, frontend URL)
├── controllers/
│   ├── authController.ts         # Login and /me handlers
│   ├── userController.ts         # User CRUD handlers
│   └── verificationController.ts # Register, verify, resend, forgot/reset password
├── dto/
│   ├── auth.dto.ts               # Login validation
│   ├── user.dto.ts               # User validation
│   └── verification.dto.ts       # Register, email, reset password validation
├── entities/
│   └── User.ts                   # User entity (with verification and reset fields)
├── middleware/                   # auth, errorHandler, requestLogger, validate
├── migrations/                   # Initial schema + AddEmailVerificationFields
├── routes/
│   ├── authRoutes.ts             # /login, /me, and mounts verification routes
│   ├── healthRoutes.ts
│   ├── userRoutes.ts             # Protected with authMiddleware
│   └── verificationRoutes.ts     # Register, verify-email, resend, forgot/reset
├── services/
│   ├── authService.ts            # Login (checks isVerified), JWT logic
│   ├── emailService.ts           # Nodemailer + HTML email templates
│   ├── userService.ts
│   └── verificationService.ts    # Verification and reset business logic
├── utils/                        # asyncHandler, errors, logger, response
└── index.ts
```

---

## Setup

1. `npm install`
2. Start MySQL and create the database: `CREATE DATABASE boilerplate_db;`
3. Copy `.env.example` to `.env` and fill in your values
4. `npm run migration:run`
5. `npm run dev`

### Environment Variables

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your-db-password
DB_DATABASE=boilerplate_db
FRONTEND_URL=http://localhost:4200
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=24h
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-username@ethereal.email
SMTP_PASS=your-ethereal-password
EMAIL_FROM=noreply@yourapp.com
```

---

## Authentication Flow

1. **Register**: the user is saved as unverified and a verification email is sent.
2. **Login before verifying**: rejected with `401`.
3. **Verify email**: the token from the email is sent to the API. The user becomes verified and the token is cleared.
4. **Login**: returns a JWT.
5. **Forgot password**: a reset email is sent (the response is always the same message).
6. **Reset password**: the token and new password are sent. The password changes and the token is cleared.
7. **Login with the new password**: returns a JWT.

---

## How to Test with Ethereal

1. Create a free test account with `nodemailer.createTestAccount()` and put the user and pass in `.env`.
2. Start the server and send a request that sends an email (register or forgot-password).
3. Find the `📧 Ethereal preview URL` line in the terminal and open it in the browser.
4. Copy the token from the link in the email (the part after `token=`).
5. Send the token to the API on port 3000 (not the frontend link on port 4200).

---

## API Endpoints

| Method | Endpoint | Body / Query | Auth | Description |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password, age? }` | No | Register and send verification email |
| GET | `/api/auth/verify-email?token=...` | query `token` | No | Verify email |
| POST | `/api/auth/resend-verification` | `{ email }` | No | Send a new verification email |
| POST | `/api/auth/login` | `{ email, password }` | No | Login (verified users only) |
| POST | `/api/auth/forgot-password` | `{ email }` | No | Send password reset email |
| POST | `/api/auth/reset-password` | `{ token, newPassword }` | No | Set a new password |
| GET | `/api/auth/me` | none | Bearer token | Get current user |
| GET | `/api/users` | none | Bearer token | List users (protected) |
| GET | `/health` | none | No | Health check |

### Examples

**Register**
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "Password123",
  "age": 30
}
```
Response `201`: "Registration successful. Please check your email to verify your account."

**Login before verification**
```json
POST /api/auth/login
{ "email": "test2@example.com", "password": "Password123" }
```
Response `401`: "Please verify your email address before logging in. Check your inbox for the verification link."

**Verify email**
```
GET /api/auth/verify-email?token=YOUR_TOKEN
```
Response `200`: "Email verified successfully. You can now log in."

**Reset password**
```json
POST /api/auth/reset-password
{ "token": "YOUR_RESET_TOKEN", "newPassword": "NewPassword456" }
```
Response `200`: "Password reset successfully. You can now log in with your new password."

---

## Security Features

- Tokens generated with `crypto.randomBytes(32)`
- Verification tokens expire in 24 hours, reset tokens in 1 hour
- Tokens are one-time use and cleared after use
- Forgot password always returns the same message (no email enumeration)
- Passwords hashed with bcrypt
- Login blocked until the email is verified
- Token and password fields hidden from queries by default (`select: false`)
- Joi validation with custom error messages
- Secrets kept in `.env`, which is ignored by Git

---

## Test Results

| Test | Expected | Result |
|---|---|---|
| Register | 201, verification email sent | Pass |
| Login before verification | 401 | Pass |
| Verify email | 200 | Pass |
| Login after verification | 200 + JWT | Pass |
| Forgot password | 200, reset email sent | Pass |
| Reset password | 200 | Pass |
| Login with new password | 200 + JWT | Pass |
| Reuse used tokens | 400 | Pass |
| Duplicate email register | 409 | Pass |

---

## Reflection Answers

**1. Why is email verification important for security?**
It proves the person owns the email address. It stops people from signing up with someone else's email, creating fake accounts, and spamming. It also makes sure password reset emails go to the real owner.

**2. Explain the "always return success" pattern.**
The forgot-password endpoint returns the same message whether or not the email exists. An attacker can't use it to find out which emails are registered.

**3. Verification token vs. reset token?**
A verification token confirms a new account. A reset token lets someone change a password, which is more dangerous if stolen, so it lasts only 1 hour. The verification token lasts 24 hours because new users may not check their email right away.

**4. Why `crypto.randomBytes(32)` instead of `Math.random()` or `Date.now()`?**
`Math.random()` and `Date.now()` are predictable, so an attacker could guess the token. `crypto.randomBytes` uses secure randomness that can't be guessed.

**5. What if a user never verifies their email?**
They stay unverified and can't log in. The token expires after 24 hours, and they can request a new one with the resend-verification endpoint.

**6. Why are tokens cleared after use?**
So a token can't be used twice. If someone finds an old email or link, it no longer works. This prevents replay attacks.

**7. What is email enumeration, and how is it prevented?**
It is when an attacker tries many emails to learn which ones have accounts. My forgot-password and resend-verification endpoints always return the same message, so the attacker learns nothing.

**8. How would I add 2FA?**
After a correct password, I would ask for a second code, such as a TOTP from an authenticator app or a code sent by email. The user gets the JWT only after the code is verified. I would store a 2FA secret per user and offer backup codes.

**9. Ethereal vs. SendGrid?**
Ethereal is free, needs no signup, and never delivers real emails, so it's safe for testing. SendGrid delivers real emails with better reliability and analytics, but it needs an account, an API key, domain setup, and can cost money at scale.

**10. What if a user's email provider marks my emails as spam?**
I would set up SPF, DKIM, and DMARC on my domain, send from a verified domain, use a trusted email provider, keep the email content clean, and tell users to check their spam folder. I would also keep the resend option available.