# Restaurant Onboarding API Documentation

This document outlines the complete 2-step onboarding flow for the client, including payload structures and expected behaviors.

## Overview

The onboarding process is divided into two main steps:

1.  **Submission & File Upload Preparation**: The client submits the initial data. The server validates it, saves the text data temporarily (Redis), and returns Presigned URLs for file uploads.
2.  **Completion & Token Generation**: Once the client successfully uploads the files to the presigned URLs, it calls the completion endpoint to finalize the onboarding, create entities, and receive authentication tokens.

---

## Step 1: Submit Data & Get Presigned URLs

**Endpoint**: `POST /api/v1/restaurant-onboarding`

### Payload Structure

The payload structure varies slightly based on the `hasCin` flag (Brand vs. Indvidual Restaurant).

#### Case A: With CIN (Corporate/Brand)

Used for registered companies.

```json
{
  "personalInfo": {
    "fullName": "John Doe",
    "designation": "Owner",
    "email": "owner@example.com",
    "mobile": "9876543210",
    "whatsapp": "9876543210",
    "isSameAsMobile": true
  },
  "restaurantInfo": {
    "hasCin": true,
    "companyName": "Great Foods Pvt Ltd",
    "brandName": "The Spicy Grill",
    "hasMultipleBranches": false,
    "cinNumber": "U12345MH2023PTC123456",
    "panNumber": "ABCDE1234F",
    "gstNumber": "22AAAAA0000A1Z5", // Optional
    "registeredAddress": "Shop 1|Floor 2|Landmark|Gurugram|Haryana|122001" // Mandatory
  },
  "aboutRestaurant": {
    "foodTypes": {
      "isVegAvailable": true,
      "isNonVegAvailable": true,
      "isEggAvailable": false
    },
    "cuisines": [1, 5, 12], // Cuisine IDs
    "menuImages": ["menu1.jpg", "menu2.jpg"],
    "dishImage": "brand_logo.jpg" // Brand Logo
  },
  "documents": {
    "fssaiDocument": "fssai_cert.pdf", // Mandatory
    "accountNumber": "1234567890",
    "ifscCode": "HDFC0001234",
    "accountHolderName": "Great Foods Pvt Ltd",
    "bankName": "HDFC Bank",
    "branchName": "Cyber Hub, Gurugram"
  }
}
```

#### Case B: Without CIN (Individual Restaurant)

Used for independent restaurants.

```json
{
  "personalInfo": { ... },
  "restaurantInfo": {
    "hasCin": false,
    "restaurantName": "Local Delights",
    "panNumber": "ABCDE1234F",
    "gstNumber": null, // Optional
    "registeredAddress": "Home Address|...", // Mandatory
    "restaurantAddress": "Shop 10|Market|City|State|110001", // Used for City extraction
    "location": "28.4595:77.0266", // Latitude:Longitude
    "googleMapsLink": "https://maps.app.goo.gl/xyz" // Optional
  },
  "aboutRestaurant": {
     ...
     "dishImage": "primary_dish.jpg"
  },
  "documents": { ... }
}
```

### Response (Step 1)

Success (`200 OK`) returns a list of Presigned URLs for the files declared in the payload.

```json
{
  "fssaiDocument": "https://s3.amazonaws.com/bucket/onboarding/user-id/fssai_cert.pdf?signature=...",
  "dishImage": "https://s3.amazonaws.com/bucket/onboarding/user-id/image.jpg?signature=...",
  "menuImages": [
    "https://s3.amazonaws.com/bucket/onboarding/user-id/menu1.jpg?signature=...",
    "https://s3.amazonaws.com/bucket/onboarding/user-id/menu2.jpg?signature=..."
  ]
}
```

**Client Action**: Upload the respective files to these URLs using `PUT` requests.

---

## Step 2: Complete Onboarding & generating Tokens

**Endpoint**: `POST /api/v1/restaurant-onboarding/onboard-complete`

**Triggers**: Called AFTER the client has finished uploading all files to the Presigned URLs.

### Response (Step 2)

Success (`200 OK`) indicates that the restaurant has been created and data persisted. The response contains JWT tokens for the user to proceed.

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### JWT Payload Structure

The `accessToken` contains the following claims:

```json
{
  "user": {
    "id": "user-uuid",
    "name": "User Name",
    "mobile": "9876543210"
  },
  "restaurantName": "Brand Name",
  "isOnboardingComplete": true,
  "status": "APPROVAL_PENDING", // e.g. APPROVAL_PENDING
  "role": "restro",
  "exp": 1712345678
}
```

---

## Notes

- **GSTN**: Optional. If provided, it must match the standard GST regex.
- **Registered Address**: Mandatory for BOTH flows.
- **FSSAI Document**: Mandatory for all restaurants (Brand or Individual).
- **City Extraction**: In Non-CIN flow, the system extracts the City from the `restaurantAddress` (Logic: Checks 3rd last component of pipe-separated string).
