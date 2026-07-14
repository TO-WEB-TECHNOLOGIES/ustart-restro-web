# Menu Add-On (Variants) API Documentation

This document specifies the API for managing individual add-on items (variants of type `ADD_ON`) belonging to add-on categories.

## Overview

Add-on variants are the individual options within an add-on category. Examples:
- Under **"Add-On Dips"**: Garlic Dip (+₹25), Cheese Dip (+₹30), Spicy Salsa (+₹35)
- Under **"Beverages Add-On"**: Coke Can (+₹40), Sprite Can (+₹40), Mineral Water (+₹20)
- Under **"Sides Add-On"**: French Fries (+₹80), Onion Rings (+₹90)

Each add-on has its own price, packaging fee, tax percentage, and availability timings. These parameters are managed globally at the Brand level or overridden on a per-restaurant basis.

---

## Role-Based Access Control

| Role                      | Create | Update (Metadata) | Update (Price/Availability) | Delete | Read |
| :------------------------ | :----- | :---------------- | :-------------------------- | :----- | :--- |
| **Admin**                 | ✅ Full | ✅ Full           | ✅ Full                     | ✅ Full | ✅ Full |
| **Restro (Brand-level)**  | ✅ Full | ✅ Full           | ✅ Full                     | ✅ Full | ✅ Full |
| **Restro (Outlet-level)** | ❌ Denied| ❌ Denied         | ✅ Allowed*                 | ❌ Denied| ✅ Read Only |
| **Customer**              | ❌ Denied| ❌ Denied         | ❌ Denied                   | ❌ Denied| ✅ Read Only |

**Note**: Outlet-level restro users (who have `restroId` present in their JWT claims) can only update the price and availability fields for their specific restaurant. They cannot change metadata fields (`variantName`, `variantDescription`, `itemImage`, or active status).

---

## Endpoints

All endpoints are prefixed with `/api/v1/menu/addons`.

### 1. Create Add-On Variant

Create a new add-on variant under an add-on category.

```
POST /api/v1/menu/addons
```

**Required Roles**: `admin`, `restro` (brand-level)

#### Query Parameters (Admins Only)

| Parameter      | Type   | Required | Description                                                             |
| :------------- | :----- | :------- | :---------------------------------------------------------------------- |
| `brandIdParam` | `UUID` | No*      | Required for admins. Brand users have this resolved automatically from JWT. |

#### Request Body

| Field                 | Type      | Required | Default | Description                                                     |
| :-------------------- | :-------- | :------- | :------ | :-------------------------------------------------------------- |
| `addOnCategoryId`     | `Long`    | **Yes**  | -       | The parent add-on category ID.                                  |
| `menuItemId`          | `Long`    | No       | `null`  | Optional menu item ID if the variant represents a physical item.|
| `variantName`         | `String`  | **Yes**  | -       | Display name (e.g., "Cheese Dip"). Max 255 chars.               |
| `variantDescription`  | `String`  | No       | `null`  | Detailed description.                                           |
| `itemImage`           | `String`  | No       | `null`  | Key/URL for the variant image.                                  |
| `itemPrice`           | `Double`  | No       | `0.0`   | Base price of the add-on.                                       |
| `packagingCharges`    | `Double`  | No       | `0.0`   | Packaging charges specifically for this add-on.                 |
| `taxAmount`           | `Double`  | No       | `5.0`   | Tax percentage (e.g., 5.0, 18.0).                               |
| `isActive`            | `Boolean` | No       | `true`  | Brand-level active status.                                      |
| `isAvailable`         | `Boolean` | No       | `true`  | Initial availability status.                                    |
| `availability`        | `Object`  | No       | See below| Availability timing constraints.                                |
| `foodType`            | `String`  | **Yes**  | -       | Food category: `VEG`, `NON_VEG`, `EGG`                          |
| `serves`              | `Integer` | No       | `null`  | Number of people it serves.                                     |
| `portionSize`         | `String`  | No       | `null`  | Portion size description.                                       |
| `weight`              | `String`  | No       | `null`  | Item weight (e.g. "50g").                                       |
| `maxQuantity`         | `Integer` | No       | `null`  | Max quantity allowed per order.                                 |
| `isFrosting`          | `String`  | No       | `null`  | Frosting options: `FRESH`, `PRE_FROSTED`, `NO`                  |
| `spiceLevel`          | `Integer` | No       | `2`     | Spice heat level: `1` (Sweet), `2` (Moderate), `3` (Spicy)      |
| `itemType`            | `List`    | No       | `[]`    | Item consistencies: `SOLID`, `LIQUID`, `SEMI_SOLID`, `FROZEN`   |
| `tags`                | `List`    | No       | `[]`    | Specific classification tags (e.g. `HEALTHY`).                  |
| `allergens`           | `List`    | No       | `[]`    | Allergen warnings (e.g. `DAIRY`, `NUTS`).                       |
| `nutritionalInfo`     | `Object`  | No       | `null`  | Calories, protein, carbs, fats counts.                          |

**Availability Object:**

| Field       | Type      | Required | Default | Description                               |
| :---------- | :-------- | :------- | :------ | :---------------------------------------- |
| `allDay`    | `Boolean` | No       | `true`  | Whether available all day.                |
| `startTime` | `String`  | No       | `null`  | Start time in "HH:mm" format (24-hour).   |
| `endTime`   | `String`  | No       | `null`  | End time in "HH:mm" format (24-hour).     |

#### Validation Rules

- `itemPrice`, `packagingCharges`, and `taxAmount` must be ≥ 0.
- Variant name must be unique within the category.
- `foodType` must be one of: `VEG`, `NON_VEG`, or `EGG`.

#### Example Request

```bash
curl -X POST "https://api.ustart.com/api/v1/menu/addons" \
     -H "Authorization: Bearer <JWT>" \
     -H "Content-Type: application/json" \
     -d '{
       "addOnCategoryId": 1,
       "variantName": "Garlic Dip",
       "variantDescription": "Creamy garlic mayo dip",
       "itemPrice": 25.0,
       "packagingCharges": 0.0,
       "taxAmount": 5.0,
       "isActive": true,
       "isAvailable": true,
       "foodType": "VEG",
       "spiceLevel": 2,
       "allergens": ["DAIRY"],
       "availability": {
         "allDay": true
       }
     }'
```

#### Success Response (200 OK)

```json
{
  "variantId": 101,
  "menuItemId": null,
  "addOnCategoryId": 1,
  "variantName": "Garlic Dip",
  "variantDescription": "Creamy garlic mayo dip",
  "itemImage": null,
  "variantType": "ADD_ON",
  "price": 25.0,
  "discount": 0.0,
  "finalPrice": 25.0,
  "packagingFees": 0.0,
  "taxPercentage": 5.0,
  "isActive": true,
  "isAvailable": true,
  "isBlocked": false,
  "blockedReason": null,
  "startTime": null,
  "endTime": null,
  "allDay": true,
  "foodType": "VEG",
  "servCount": null,
  "spiceLevel": "MODERATE",
  "portionSize": null,
  "weight": null,
  "maxQuantityPerOrder": null,
  "frostingType": "NO",
  "isPromoted": false,
  "itemTypes": [],
  "tags": ["NONE_OF_THESE"],
  "allergyWarnings": ["DAIRY"],
  "calories": null,
  "protein": null,
  "carbs": null,
  "fats": null
}
```

---

### 2. Update Add-On Variant

Update variant properties globally, or override prices/availability for a specific outlet.

```
PATCH /api/v1/menu/addons/{variantId}
```

**Required Roles**: 
- `admin`, `restro` (brand-level): Full update
- `restro` (outlet-level): Update pricing and availability only

#### Path Parameters

| Parameter   | Type   | Required | Description              |
| :---------- | :----- | :------- | :----------------------- |
| `variantId` | `Long` | **Yes**  | ID of variant to update. |

#### Query Parameters

| Parameter      | Type   | Required | Description                                                             |
| :------------- | :----- | :------- | :---------------------------------------------------------------------- |
| `restaurantId` | `UUID` | No       | For outlet-specific overrides. *Auto-resolved from JWT for outlet users. |
| `brandIdParam` | `UUID` | No       | Required for admins doing brand-level updates.                          |

#### Request Body (All fields optional)

Same fields as `POST /api/v1/menu/addons`. 
- Outlet-level users can **only** pass `itemPrice`, `packagingCharges`, `taxAmount`, `isAvailable`, and `availability`.

#### Example Request (Outlet User Overriding Local Price)

```bash
curl -X PATCH "https://api.ustart.com/api/v1/menu/addons/101" \
     -H "Authorization: Bearer <RESTRO_OUTLET_JWT>" \
     -H "Content-Type: application/json" \
     -d '{
       "itemPrice": 30.0,
       "isAvailable": true
     }'
```

#### Success Response (200 OK)

```json
{
  "variantId": 101,
  "menuItemId": null,
  "addOnCategoryId": 1,
  "variantName": "Garlic Dip",
  "variantDescription": "Creamy garlic mayo dip",
  "itemImage": null,
  "variantType": "ADD_ON",
  "price": 30.0,
  "discount": 0.0,
  "finalPrice": 30.0,
  "packagingFees": 0.0,
  "taxPercentage": 5.0,
  "isActive": true,
  "isAvailable": true,
  "isBlocked": false,
  "blockedReason": null,
  "startTime": null,
  "endTime": null,
  "allDay": true
}
```

---

### 3. Delete Add-On Variant

Soft-delete an add-on variant.

```
DELETE /api/v1/menu/addons/{variantId}
```

**Required Roles**: `admin`, `restro` (brand-level)

---

### 4. Fetch Add-On Variant Detail

Fetch a single variant. Can fetch specific pricing contexts.

```
GET /api/v1/menu/addons/{variantId}
```

**Required Roles**: `restro`, `admin`, `customer`

#### Query Parameters

| Parameter      | Type   | Required | Description                                                             |
| :------------- | :----- | :------- | :---------------------------------------------------------------------- |
| `restaurantId` | `UUID` | No       | Fetches prices configured for this outlet. *Auto-resolved for restro JWT.|

---

### 5. Fetch Add-Ons By Category

List all active add-on variants under a specific category.

```
GET /api/v1/menu/addons/categories/{categoryId}/variants
```

**Required Roles**: `restro`, `admin`, `customer`

#### Query/Path Parameters

| Parameter      | Type   | Required | Description                                                             |
| :------------- | :----- | :------- | :---------------------------------------------------------------------- |
| `categoryId`   | `Long` | **Yes**  | ID of the parent category.                                              |
| `restaurantId` | `UUID` | No       | Fetches prices configured for this outlet. *Auto-resolved for restro JWT.|

#### Success Response (200 OK)

```json
[
  {
    "variantId": 101,
    "menuItemId": null,
    "addOnCategoryId": 1,
    "variantName": "Garlic Dip",
    "variantDescription": "Creamy garlic mayo dip",
    "itemImage": null,
    "variantType": "ADD_ON",
    "price": 25.0,
    "discount": 0.0,
    "finalPrice": 25.0,
    "packagingFees": 0.0,
    "taxPercentage": 5.0,
    "isActive": true,
    "isAvailable": true,
    "isBlocked": false,
    "blockedReason": null,
    "startTime": null,
    "endTime": null,
    "allDay": true
  }
]
```

---

## Process: Adding an Add-On with Image

To ensure performance and security, adding an image to an add-on variant is a decoupled process using the **Multimedia Service**:

### Step 1: Request Upload Authorization (Presigned URL)
The client requests a presigned S3 upload URL by calling the **Multimedia Controller**:

```
POST /api/v1/multimedia/presigned-urls
```

#### Request Payload:
```json
{
  "fileNames": ["garlic_dip.png"],
  "requirementType": "menu_item"
}
```

- **`requirementType`** must be exactly `"menu_item"` so the file is organized in the global `"menu-items/images/"` directory.
- For Restro-role users, the backend automatically extracts the active `brandId` from JWT claims to organize the S3 directory.

#### Success Response (200 OK):
```json
[
  {
    "fileName": "menu-items/images/8f3a9b1c-d7e6-42a1-bf89-2c0b1a2d3e4f_4c5d6e7f-8a9b-0c1d-2e3f-4a5b6c7d8e9f.png",
    "presignedUrl": "https://ustart-media-bucket.s3.ap-south-1.amazonaws.com/menu-items/images/8f3a9b1c-d7e6-42a1-bf89-2c0b1a2d3e4f_4c5d6e7f-8a9b-0c1d-2e3f-4a5b6c7d8e9f.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
    "publicUrl": "https://ustart-media-bucket.s3.ap-south-1.amazonaws.com/menu-items/images/8f3a9b1c-d7e6-42a1-bf89-2c0b1a2d3e4f_4c5d6e7f-8a9b-0c1d-2e3f-4a5b6c7d8e9f.png"
  }
]
```

### Step 2: Extract S3 Key & Upload Binary File
1. Extract the relative **`fileName`** (e.g. `"menu-items/images/8f3a9b1c..._4c5d6...png"`) and **`presignedUrl`** from the response object.
2. Perform a direct binary **`PUT`** request to the **`presignedUrl`** with the raw image file.

```bash
curl -X PUT -T "/path/to/local/dip_image.png" "https://ustart-media-bucket.s3.ap-south-1.amazonaws.com/menu-items/images/..."
```

### Step 3: Finalize Add-On Creation
Once the binary S3 upload succeeds, send the relative **`fileName`** (S3 Key) in the `"itemImage"` parameter of the add-on creation or update payload:

```json
{
  "addOnCategoryId": 1,
  "variantName": "Garlic Dip",
  "itemImage": "menu-items/images/8f3a9b1c-d7e6-42a1-bf89-2c0b1a2d3e4f_4c5d6e7f-8a9b-0c1d-2e3f-4a5b6c7d8e9f.png",
  "itemPrice": 25.0,
  "foodType": "VEG"
}
```

> [vanilla_alert]
> [!IMPORTANT]
> The backend expects the relative **S3 Key** (`fileName` from the response), **NOT** the absolute `publicUrl` (S3 absolute domain).

---

## Frontend Integration Scenarios

### Scenario 1: Outlet Manager Toggling Stock (Available/Unavailable)

```javascript
// React toggle handler
const toggleAvailability = async (variantId, currentAvailableState) => {
  try {
    const response = await fetch(`/api/v1/menu/addons/${variantId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        isAvailable: !currentAvailableState
      })
    });

    if (response.ok) {
      showToast(currentAvailableState ? 'Dip marked out of stock' : 'Dip marked in stock');
      refreshList();
    }
  } catch (error) {
    console.error('Error toggling availability:', error);
  }
};
```

### Scenario 2: Frontend Cart Price Calculation

When checking out, compute totals factoring in chosen add-on extras:

```typescript
interface CartItem {
  basePrice: number;
  quantity: number;
  taxPercentage: number;
  packagingFees: number;
  selectedAddOns: Array<{
    finalPrice: number;
    packagingFees?: number;
  }>;
}

const calculateCartItemTotal = (item: CartItem) => {
  // Sum base price with all selected add-ons
  let singleItemPrice = item.basePrice;
  let singleItemPackaging = item.packagingFees || 0;

  item.selectedAddOns.forEach(addOn => {
    singleItemPrice += addOn.finalPrice;
    singleItemPackaging += addOn.packagingFees || 0;
  });

  const subtotal = singleItemPrice * item.quantity;
  const packagingTotal = singleItemPackaging * item.quantity;
  
  // Calculate GST/Tax
  const gstAmount = subtotal * (item.taxPercentage / 100);
  const total = subtotal + packagingTotal + gstAmount;

  return {
    subtotal,
    packaging: packagingTotal,
    tax: gstAmount,
    total
  };
};
```

### Scenario 3: Time-Based Restrictions Check

Add-ons can have specific hours (e.g., beverages breakfast/dinner restrict). Verify in the UI:

```javascript
const checkTimingRestriction = (addOn) => {
  if (addOn.allDay) return true;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = addOn.startTime.split(':').map(Number);
  const [endHour, endMin] = addOn.endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};
```

---

## Cache Behaviors

- **Create/Delete**: Triggers complete invalidation of the brand's menu cache.
- **Update (Brand User)**: Invalidates brand and item caches across all outlets.
- **Update (Outlet User)**: Surgically invalidates *only* the specific restaurant outlet's Redis cache block, leaving other outlets' fast memory cached structures untouched.
