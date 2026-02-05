# Restaurant Onboarding API Documentation

This document outlines the final payload structure sent by the client during the restaurant onboarding process and the expected behavior upon success.

## 1. API Endpoint

- **POST** `[ONBOARDING_CREATION_ENDPOINT]` (Submit onboarding data to create a new restaurant entry)

---

## 2. Expected Payload for Creation

Every creation request contains four main sections. The structure of `restaurantInfo` varies depending on the `hasCin` flag.

### Case A: With CIN (Corporate Identification Number)

Used for registered companies and brands.

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
    "gstNumber": "22AAAAA0000A1Z5", // Optional (see below)
    "registeredAddress": "Shop 1|Floor 2|Landmark|Gurugram|Haryana|122001" // Pipe-separated string
  },
  "aboutRestaurant": {
    "foodTypes": {
      "isVegAvailable": true,
      "isNonVegAvailable": true,
      "isEggAvailable": false
    },
    "cuisines": [1, 5, 12], // Cuisine IDs
    "menuImages": ["menu1.jpg", "menu2.jpg"],
    "dishImage": "brand_logo.jpg" // Renamed to Brand Logo in UI for CIN users
  },
  "documents": {
    "fssaiDocument": "fssai_cert.pdf",
    "accountNumber": "1234567890",
    "ifscCode": "HDFC0001234",
    "accountHolderName": "Great Foods Pvt Ltd",
    "bankName": "HDFC Bank",
    "branchName": "Cyber Hub, Gurugram"
  }
}
```

### Case B: Without CIN

Used for independent restaurants.

```json
{
  "personalInfo": { ... },
  "restaurantInfo": {
    "hasCin": false,
    "restaurantName": "Local Delights",
    "panNumber": "ABCDE1234F",
    "gstNumber": "22AAAAA0000A1Z5", // Optional
    "registeredAddress": "...",
    "restaurantAddress": "Plot 10|Industrial Area||Gurugram|Haryana|122001", // Pipe-separated
    "location": "28.4595:77.0266", // Latitude:Longitude
    "googleMapsLink": "https://maps.app.goo.gl/xyz" // Optional
  },
  "aboutRestaurant": {
    "foodTypes": { ... },
    "cuisines": [ ... ],
    "menuImages": [ ... ],
    "dishImage": "special_dish.jpg"
  },
  "documents": { ... }
}
```

---

## 3. Parameter Definitions & Optionality

| Parameter                          | Type   | Required  | Description                                                      |
| :--------------------------------- | :----- | :-------- | :--------------------------------------------------------------- | ----- | -------- | -------- | ----- | --------- |
| `personalInfo`                     | Object | **YES**   | User/POC details.                                                |
| `restaurantInfo.gstNumber`         | String | NO        | Validated against GST regex if provided. Mark as **Optional**.   |
| `restaurantInfo.googleMapsLink`    | String | NO        | Full URL to the restaurant on Google Maps. Mark as **Optional**. |
| `restaurantInfo.registeredAddress` | String | **YES**   | Format: `line1                                                   | line2 | landmark | locality | state | pincode`. |
| `restaurantInfo.location`          | String | **YES\*** | Required for non-CIN. Format: `lat:lng`.                         |
| `aboutRestaurant.dishImage`        | String | **YES**   | Acts as 'Brand Logo' for CIN users.                              |
| `documents.fssaiDocument`          | String | NO        | Filename of the uploaded FSSAI cert.                             |

---

## 4. Success Expectations

After a successful `200 OK` response, the following happens:

1. **Authentication**: The client receives a new JWT and Refresh Token.
   - The **JWT Payload** is expected to contain the following structure:
   ```json
   {
     "user": {
       "id": "user-string-uuid",
       "name": "Owner Name",
       "mobile": "9876543210",
       "designation": "Owner"
     },
     "isOnboardingComplete": true,
     "status": "APPROVAL_PENDING",
     "exp": 1700000000 // Expiration timestamp
   }
   ```
2. **Navigation**: User is redirected to the `/grow-with-ustart/verification` (Under Verification) page based on the `isOnboardingComplete` and `status` flags.
3. **Data Persistency**: The local `OnboardingStore` (Zustand) is cleared to prepare for future sessions.
4. **Backend State**: The restaurant record is created in a 'Pending' state for administrative review.
