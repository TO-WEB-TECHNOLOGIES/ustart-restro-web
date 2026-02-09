# Authentication Flow Architecture

## 1. Overview

The authentication module manages user sessions via Mobile OTP and handles supplementary verification (Email OTP) during the onboarding process. It uses JWT (JSON Web Tokens) for session persistence and state-based routing.

## 2. Data Flow

### A. Mobile Login Flow (Primary)

1. **Request OTP**:
   - **Frontend**: `LoginForm` collects a 10-digit mobile number.
   - **Action**: Calls `authService.sendOtp(mobile)`.
   - **API**: `POST /api/v1/auth/send-otp`
   - **Payload**: `{ "mobileNumber": "9818XXXXXX" }`
   - **Success Response**: `{ "message": "OTP sent successfully" }`

2. **Verify OTP**:
   - **Frontend**: User enters 4-digit OTP.
   - **Action**: Calls `authService.verifyOtp(mobile, otp)`.
   - **API**: `POST /api/v1/auth/verify-otp`
   - **Payload**: `{ "mobileNumber": "9818XXXXXX", "otp": "1234" }`
   - **Expected Response**:
     ```json
     {
       "accessToken": "JWT_STRING",
       "refreshToken": "JWT_STRING",
       "user": {
         "name": "User Name",
         "mobileNumber": "9818XXXXXX",
         "onboardingStatus": "NEW | APPROVAL_PENDING | ACTIVE | ACTION_REQUIRED",
         "restaurant": null
       }
     }
     ```
   - **Management**: Tokens are stored in `localStorage`. `AuthContext` is updated, triggering a re-render of `ProtectedRoute`.

### B. Email Verification Flow (Onboarding)

1. **Check Status**: `GET /api/v1/auth/is-email-verified?email=...`
2. **Send Email OTP**: `POST /api/v1/auth/send-email-otp` (Requires Auth Header).
3. **Verify Email OTP**: `POST /api/v1/auth/verify-email-otp` (Requires Auth Header).

## 3. Storage & Session Management

- **LocalStorage Keys**:
  - `token`: Access token for standard API calls.
  - `refreshToken`: Used for authenticated requests during onboarding or for token rotation.
  - `user`: Stringified user object metadata.
  - `status`: Current onboarding status (`ACTIVE`, `PENDING`, etc.).
- **Interceptors** (`src/api/axios.ts`):
  - **Request**: Automatically attaches `Authorization: Bearer <token>` if present.
  - **Response**: If a `401 Unauthorized` is received (and it's not a login attempt), it clears all storage and redirects to `/`.

## 4. Error Conditions & Handling

| API          | Condition     | Status Code | UI Action                        |
| :----------- | :------------ | :---------- | :------------------------------- |
| `send-otp`   | Rate Limited  | 429         | Show "Too many attempts" toast   |
| `verify-otp` | Invalid OTP   | 401         | Show "Invalid OTP" error message |
| `verify-otp` | OTP Expired   | 401         | Advise user to resend OTP        |
| Any          | Token Expired | 401         | Redirect to Landing Page         |

## 5. Routing Logic

Based on the decoded JWT `status`:

- `ACTIVE`: Redirect to `/dashboard`.
- `APPROVAL_PENDING` / `ACTION_REQUIRED`: Redirect to `/grow-with-ustart/verification`.
- `NEW` or Null: Redirect to `/grow-with-ustart/personal-info`.
