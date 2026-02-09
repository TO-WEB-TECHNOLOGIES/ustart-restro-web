# Restaurant Onboarding Status API Documentation

This document describes the API endpoints and data structures for restaurant partners to check their onboarding and verification status.

## 1. Get Onboarding Status

Retrieves the current state of the restaurant's onboarding journey and verification status.

**Endpoint**: `GET /api/v1/onboarding-status/status`  
**Method**: `GET`  
**Authentication**: Required (Bearer Token)

### Request

The request requires a valid JWT token with the `RESTAURANT` role.

### Response Payload

```json
{
  "status": "APPROVAL_PENDING",
  "isEditLocked": true,
  "message": "Your application is currently under review. This usually takes 24-48 hours.",
  "reason": null,
  "supportInfo": {
    "email": "partners@ustart.in",
    "phone": "+91 7827234027",
    "supportId": "UST-8829-XJ"
  },
  "submittedAt": "2024-02-06T10:00:00Z",
  "updatedAt": "2024-02-06T10:30:00Z"
}
```

### Onboarding Statuses

| Status             | Meaning                                      | Edit Locked |
| :----------------- | :------------------------------------------- | :---------- |
| `APPROVAL_PENDING` | Application submitted and under review.      | Yes         |
| `ACTION_REQUIRED`  | Application needs user attention/correction. | No          |
| `APPROVED`         | Verification successful.                     | Yes         |
| `REJECTED`         | Application rejected.                        | No          |
| `ACTIVE`           | Account is active and live.                  | Yes         |
| `BLOCKED`          | Account has been blocked.                    | Yes         |
| `ON_HOLD`          | Application is on hold.                      | Yes         |

---

## 2. Authentication Metadata (Login/OTP Response)

When a restaurant user logs in or verifies OTP, the following metadata is provided alongside the token.

### Expected Payload

```json
{
  "user": {
    "id": "uuid-v7",
    "name": "John Doe",
    "mobile": "9876543210"
  },
  "isOnboardingComplete": true,
  "status": "APPROVED",
  "role": "restro"
}
```

### Field Descriptions

- **isOnboardingComplete**: Boolean indicating if the initial onboarding steps are finished.
- **status**: The current active status of the restaurant (e.g., `APPROVAL_PENDING`, `APPROVED`).
- **role**: The access level assigned to the user (will be `restro`).
- **supportId**: A unique identifier for the application to be used when contacting support.
