# Restaurant Onboarding Flow

This document details the lifecycle of a restaurant onboarding application, from initial draft to approval and subsequent updates.

## Important: Two-Phase Process

**Phase 1 and Phase 2 are BOTH required** to complete onboarding. Skipping Phase 2 means no Brand/Restaurant/RestaurantAuth entities are created in the database.

| Phase | Endpoint | What it does |
|-------|----------|--------------|
| Phase 1 | `POST /api/v1/restaurant-onboarding` | Validates form data, generates S3 presigned URLs, saves draft to Redis |
| Phase 2 | `POST /api/v1/restaurant-onboarding/onboard-complete` | Creates Brand, Restaurant, POC, BankDetail, RestaurantAuth entities in DB |

Calling only Phase 1 (without Phase 2) will result in the error: `"Onboarding not started. Please complete restaurant onboarding first."` when attempting to call brand endpoints.

---

## 1. Onboarding Lifecycle

### Phase 1: Data Collection (`POST /api/v1/restaurant-onboarding`)

**Authentication:** Required (`restro` role) — user must have completed OTP login

**Request Body:**
```json
{
  "personalInfo": { "fullName": "...", "mobile": "...", "email": "...", "designation": "..." },
  "restaurantInfo": { "restaurantName": "...", "hasCin": false, ... },
  "aboutRestaurant": { "dishImage": "...", "menuImages": [...], "cuisines": [6, 9], ... },
  "documents": { "fssaiDocument": "...", "accountNumber": "...", ... }
}
```

**Process:**
- Backend validates mandatory fields and business logic (e.g., CIN vs. Independent)
- **Email Verification Check**: Email must be verified via `POST /api/v1/auth/send-email-otp` + `verify-email-otp` before onboarding
- **S3 Presigned URLs**: Generated for `fssaiDocument`, `dishImage`, and `menuImages` — frontend uploads files directly to S3
- **Session Persistence**: The entire request is saved to Redis (`userId` as key) to allow the user to refresh or resume later

**Response:**
```json
{
  "fssaiDocument": "https://s3-presigned-url...",
  "dishImage": "https://s3-presigned-url...",
  "menuImages": ["https://s3-presigned-url...", "..."],
  "nextStep": "UPLOAD_FILES_THEN_CALL_ONBOARD_COMPLETE",
  "message": "Your onboarding data has been saved. Please upload the required documents/images using the presigned URLs, then call POST /api/v1/restaurant-onboarding/onboard-complete to finalize your registration."
}
```

**Important:** The `nextStep` and `message` fields indicate that Phase 2 must be called. Do not call brand APIs after Phase 1 — entities have NOT been created yet.

---

### Phase 2: Final Submission (`POST /api/v1/restaurant-onboarding/onboard-complete`)

**Authentication:** Required (`restro` role) — same JWT from Phase 1

**Prerequisites:**
1. Email must be verified (stored in Redis at `email:verified:{userId}:{email}`)
2. Phase 1 must have been called (draft saved in Redis)
3. File uploads to S3 should be completed (using presigned URLs from Phase 1 response)

**Process:**
- Retrieves the application draft from Redis
- **User Profile Update**: Saves `name`, `email`, `isEmailVerified=true`, `emailVerifiedAt` to `authentication` table
- **Entity Creation**: Creates `Brand`, `Restaurant`, `Poc`, and `BankDetail` in a single transaction
- **RestaurantAuth**: Links the user to the brand/restaurant with their designation as role
- **Onboarding Mapping**: Establishes a permanent link between the User and the Restaurant entities
- **Status**: Set to `APPROVAL_PENDING`
- **Lock**: `isEditLocked` is set to `true`
- **Redis Cleanup**: Draft data deleted from Redis; email verification key deleted
- **Welcome Email**: Sent asynchronously to the user's email

**Response:**
```json
{
  "accessToken": "<jwt-with-brandId>",
  "refreshToken": "<refresh-token>"
}
```

**The new JWT token from Phase 2 will contain `brandId` in the payload** — this token must be used for subsequent API calls to brand endpoints.

---

## 2. Status & Dashboard (`GET /api/v1/onboarding-status/status`)

> Note: The actual endpoint is `/api/v1/onboarding-status/status` (not `/restaurant-onboarding/status`)

The Dashboard uses this endpoint to determine the UI state:

- **Caching**: Results are cached in Redis (`onboarding:mapping:<userId>`) for 10 minutes.
- **Sync**: Status updates (Approve/Reject) are automatically synchronized across the Mapping, Brand, and Restaurant tables.

---

## 3. Post-Onboarding Updates (`PUT /api/v1/restaurant-onboarding`)

### Scenarios:

1. **Simple Update (No Files)**:
   - Changes applied directly to the database.
   - Profile re-locked for admin review.
2. **File Update (Images/Documents)**:
   - Backend detects file changes and returns new S3 Presigned URLs.
   - Application is cached in Redis until confirmation.
   - **Confirmation (`PUT /confirm-upload`)**:
     - Cleans up old files from S3.
     - Applies merged updates to DB.
     - Sets status to `APPROVAL_PENDING` and locks for review.

---

## 4. Admin Management (`PUT /api/v1/admin/onboarding-mappings/{mappingId}/status`)

> Note: The actual admin endpoint is `/api/v1/admin/onboarding-mappings/{mappingId}/status` (not `/restaurant-onboarding/status/{mappingId}`)

Admin actions (Approve, Reject, Request Changes) trigger:

1. **DB Sync**: Updates all associated entities.
2. **Cache Eviction**: Immediately clears the Redis status cache for the user.
3. **Audit**: Records which admin performed the action.

---

## 5. Security & Isolation

- **Role-Based**: Only users with the `restro` role can access onboarding APIs (enforced via `@RoleRequired`).
- **Owner-Scoped**: Users can only fetch and update their own onboarding records (mapped via `userId` in JWT).
- **Edit Locking**: Prevents users from modifying their data while an admin is actively reviewing it.
- **Idempotency**: Calling Phase 1 or Phase 2 multiple times is safe — duplicate attempts are rejected with appropriate error messages.

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `"Onboarding not started. Please complete restaurant onboarding first."` | Called brand/activate API without completing Phase 2 | Call `POST /api/v1/restaurant-onboarding/onboard-complete` first |
| `"Onboarding already completed for this account."` | Attempted to restart onboarding after completion | Use existing brand — no new onboarding needed |
| `"Onboarding session expired. Please start the onboarding process again."` | Phase 1 was called but Redis draft expired (>30 min) | Call Phase 1 again to create new draft |
| `"Restro user must be associated with a brand"` | JWT used doesn't have `brandId` and no `RestaurantAuth` found | Use JWT from Phase 2 response (it contains `brandId`) |
