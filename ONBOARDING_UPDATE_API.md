# Restaurant Onboarding Update Integration Guide

This guide outlines the process for integrating the partial update functionality for the restaurant onboarding module.

## 1. Sequence Diagram

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend
    participant S3 as Amazon S3
    participant OTP as OTP Service

    FE->>BE: GET /api/v1/restaurant-onboarding
    BE-->>FE: Return current data (DLO)

    Note over FE: User edits profile

    OPTIONAL: Email Change Flow
        FE->>OTP: POST /api/v1/auth/email-otp/send
        OTP-->>FE: OTP Sent
        FE->>OTP: POST /api/v1/auth/email-otp/verify
        OTP-->>FE: Verified (Cached in Redis)
    END

    FE->>BE: PUT /api/v1/restaurant-onboarding (Partial Updates)

    alt If Files Changed
        BE-->>FE: Return Presigned URLs
        FE->>S3: PUT File to Presigned URL
        FE->>BE: PUT /api/v1/restaurant-onboarding/confirm-upload
        BE-->>FE: Success (Status -> APPROVAL_PENDING)
    else If No Files Changed
        BE-->>FE: Success (Status -> APPROVAL_PENDING)
    end
```

## 2. API Reference

### A. Fetch Current Data

**Endpoint:** `GET /api/v1/restaurant-onboarding`  
**Description:** Retrieves the existing onboarding application details for the authenticated user.  
**Use Case:** Use this to populate the edit form fields.

### B. Partial Update

**Endpoint:** `PUT /api/v1/restaurant-onboarding`  
**Description:** Sends changed fields to the server. If images are changed, it returns presigned URLs for S3 upload.  
**Body Example:**

```json
{
  "personalInfo": {
    "fullName": "New Name",
    "email": "newverifiedemail@example.com"
  },
  "restaurantInfo": {
    "restaurantName": "Updated Bistro",
    "cityId": 5
  },
  "aboutRestaurant": {
    "cuisines": [1, 2, 5],
    "dishImage": "delicious-dish.jpg"
  }
}
```

**Note:** `dishImage`, `menuImages`, and `fssaiDocument` in the request should contain the **original file name** if they are new.

### C. Confirm Upload

**Endpoint:** `PUT /api/v1/restaurant-onboarding/confirm-upload`  
**Description:** Tells the backend that files have been successfully uploaded to S3. This triggers the final status update and email notifications.

---

## 3. Implementation Steps

### Step 1: Initial Data Load

When the user navigates to the "Edit Profile" section, fetch the current state:

```typescript
const { data: currentData } = await axios.get("/api/v1/restaurant-onboarding");
// Populate form state with currentData
```

### Step 2: Handle Email Change

If the user inputs a new email, you **must** trigger the verification flow. The update API will reject an email change if the new email hasn't been verified via OTP within the last 10 days for that specific user.

### Step 3: Preparation of Payload

Only include the fields that the user has actually touched. All fields in the `PUT` request are optional.

### Step 4: Submission and File Handling

The response from the `PUT` request will indicate if you need to perform additional file uploads.

```typescript
const response = await axios.put(
  "/api/v1/restaurant-onboarding",
  updatePayload,
);

if (
  response.data.dishImage ||
  response.data.menuImages ||
  response.data.fssaiDocument
) {
  // 1. Upload files to S3 using the presigned URLs provided in the response
  await uploadToS3(response.data.dishImage, actualFile);

  // 2. IMPORTANT: Confirm the upload to the backend
  await axios.put("/api/v1/restaurant-onboarding/confirm-upload");
}
```

## 4. Error Codes

| Status  | Message / Reason                    | Action                                        |
| :------ | :---------------------------------- | :-------------------------------------------- |
| **400** | "Email address ... is not verified" | Trigger Email OTP flow.                       |
| **400** | "GST/PAN ... already exists"        | Ask user to check their documents.            |
| **403** | "Onboarding is locked"              | Inform user profile is under review/approved. |
| **401** | "Unauthorized"                      | Redirect to login.                            |

## 5. Summary of logic

1. If email is updated in `personalInfo`, the backend automatically updates the `Authentication` table email and sets it to verified.
2. If `dishImage` is updated, it automatically updates both `Brand.brandLogo` and `Brand.primaryImage`.
3. If `isEditLocked` is true, no updates are allowed.
