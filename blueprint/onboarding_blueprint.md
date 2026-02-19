# UStart Restro: Detailed Onboarding Blueprint & Data Flow

## 1. Overview

The Onboarding module is a high-stakes, multi-step engine designed to transition complex restaurant and legal data from a user's intent to a verified operational identity. It minimizes redundant API traffic via a **Recursive Differencing Engine** and ensures data integrity through **Strict Zod Validation**.

---

## 2. Comprehensive Data Flow

### Step 1: Initial Authentication & Context Initialization

1. **User Login**: User authenticates via Mobile OTP (`authService.verifyOtp`).
2. **Onboarding Status Check**: Every route is guarded. The `ProtectedRoute` calls `onboardingService.getOnboardingStatus()`.
3. **Data Pre-fill**: If the user has a draft or partial submission, `onboardingService.getOnboardingData()` fetches the full payload and populates the Zustand `useOnboardingStore`.

### Step 2: Multi-Step Form Execution

The flow is split into 4 logical steps, each with isolated Zod schemas:

- **Step 1: Personal Info** (`PersonalInfo.tsx`) -> owner details + Email OTP verification.
- **Step 2: Restaurant Info** (`RestaurantInfo.tsx`) -> CIN vs. Non-CIN logic + Address details.
- **Step 3: About Restaurant** (`AboutRestaurant.tsx`) -> Cuisines (infinite scroll) + Food Types.
- **Step 4: Documents** (`AboutRestaurant.tsx` - Doc View) -> FSSAI, Bank Details, and S3 File selection.

### Step 3: Submission Engine (The Core Logic)

When "Submit" is triggered in Step 4, the following sequence occurs:

1. **Normalization**: All strings are trimmed, GST is upper-cased, and Addresses are joined using the `|` pipe delimiter.
2. **Differencing**:
   - If `isEditing` is true, the `getChangedFields` helper compares the current store state against the `initialData` fetched from the server.
   - It performs a shallow comparison for primitives and a recursive comparison for objects/arrays.
   - For files, it compares only the **filename** to avoid mismatches caused by full S3 URLs.
3. **Draft Handshake**: The cleaned payload (Full or Partial) is sent to `POST/PUT /api/v1/restaurant-onboarding`.
4. **Presigned URL Acquisition**: The backend validates the text data and returns a mapping of field names to **AWS S3 Presigned URLs**.
5. **Direct S3 Upload**: The frontend performs parallel, asynchronous `PUT` requests to S3. These are bare requests (no Auth/JWT headers) to comply with S3 security.
6. **Transaction Finalization**: Once uploads are 100% complete, a final `PUT /api/v1/restaurant-onboarding/confirm-upload` call is made. This "commits" the transaction on the backend.

---

## 3. API Specification & Payloads

### A. Initiate Onboarding (Draft/Full)

- **Endpoint**: `POST /api/v1/restaurant-onboarding`
- **Request (Partial Example)**:

```json
{
  "personalInfo": { "fullName": "Jane Doe", "email": "jane@example.com" },
  "restaurantInfo": { "brandName": "Noodle Star", "hasCin": false },
  "aboutRestaurant": {
    "cuisines": [10, 15],
    "foodTypes": { "isVegAvailable": true }
  }
}
```

- **Expected Response (Success)**:

```json
{
  "fssaiDocument": "https://ustart-docs.s3.region.amazonaws.com/temp/guid_fssai.pdf?...",
  "menuImages": ["https://.../m1.jpg?...", "https://.../m2.jpg?..."],
  "dishImage": "https://.../dish.jpg?..."
}
```

### B. Verification & Token Exchange

Once onboarding is "Finalized", the app polls the status API.

- **Endpoint**: `GET /api/v1/onboarding-status/status`
- **Case 1: Approved**
  - Response: `{ "status": "APPROVED", "accessToken": "jwt_...", "refreshToken": "jwt_..." }`
  - Action: Store tokens, clear onboarding state, redirect to Dashboard.
- **Case 2: Action Required**
  - Response: `{ "status": "REJECTED", "reason": "FSSAI certificate expired", "fieldErrors": ["fssaiDocument"] }`
  - Action: Unlock specific form steps and highlight errors.

---

## 4. Edge Cases & Safety Mechanisms

| Scenario                 | Logic / Handling                                                                                                                                                                                              |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Silent Token Refresh** | If the 401 interceptor triggers during a file upload, the `uploadFile` helper will NOT fail as it uses a raw `fetch` without interceptors. The main flow waits for completion before checking session health. |
| **Incomplete Uploads**   | If the user closes the tab mid-upload, the `confirm-upload` call never fires. The backend treats the submission as a "Lapsed Draft" and preserves metadata but does not trigger human verification.           |
| **Piloting Constraint**  | Non-CIN restaurants are currently restricted to "Haryana" state and "Gurugram" city via the `restaurantInfoSchema`. This prevents out-of-region onboarding.                                                   |
| **Address Rehydration**  | Stored address strings (e.g., `Line 1                                                                                                                                                                         | Line 2 | ...`) are parsed back into object structures in `RestaurantInfo.tsx` to allow granular editing of individual address fields. |

---

## 5. Directory Management (Standards)

- **`@/features/onboarding/api`**: Pure service layer. NO static data allowed.
- **`@/features/onboarding/schemas.ts`**: The source of truth for all data shape decisions. Derived TypeScript types are used globally.
- **`@/features/onboarding/store`**: Zustand store with `partialize` to protect the browser's storage from binary bloat.
