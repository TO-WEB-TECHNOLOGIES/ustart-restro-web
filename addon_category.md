# Menu Add-On Category API Documentation

This document specifies the API for managing add-on categories (groupings of extra options/items) for brand menus.

## Overview

Add-on categories allow grouping related extras that customers can add to their order. Unlike regular customizations, add-ons usually represent additional, independent items (like extra dips, toppings, sides, or beverages).

Examples:
- **"Extra Toppings"**: Extra Mozzarella, Sweet Corn, Mushrooms, Pepperoni
- **"Add-On Dips"**: Garlic Dip, Cheese Dip, Spicy Salsa
- **"Beverages Add-On"**: Coke, Sprite, Water Bottle
- **"Sides Add-On"**: French Fries, Onion Rings, Garlic Bread

Each add-on category specifies rules such as minimum/maximum selection counts, whether selection is mandatory, and is mapped to one or more menu items in a many-to-many relationship.

---

## Role-Based Access Control

| Role                      | Create | Update | Delete | Read |
| :------------------------ | :----- | :----- | :----- | :--- |
| **Admin**                 | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Restro (Brand-level)**  | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Restro (Outlet-level)** | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Read Only |
| **Customer**              | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Read Only |

**Note**: Outlet-level restro users (who have `restroId` present in their JWT claims) cannot modify add-on categories, as doing so affects the brand's global menu structure. They have Read-Only permissions.

---

## Endpoints

All endpoints are prefixed with `/api/v1/menu/addons/categories`.

### 1. Create Add-On Category

Create a new add-on category for the brand.

```
POST /api/v1/menu/addons/categories
```

**Required Roles**: `admin`, `restro` (brand-level)

#### Query Parameters (Admins Only)

| Parameter      | Type   | Required | Description                                                             |
| :------------- | :----- | :------- | :---------------------------------------------------------------------- |
| `brandIdParam` | `UUID` | No*      | Required for admins. Brand users have this resolved automatically from JWT. |

#### Request Body

| Field                       | Type           | Required | Default | Description                                                        |
| :-------------------------- | :------------- | :------- | :------ | :----------------------------------------------------------------- |
| `categoryName`              | `String`       | **Yes**  | -       | Display name (e.g., "Add-On Dips"). Max 255 chars.                 |
| `minCustomizationSelection` | `Integer`      | No       | `1`     | Minimum number of options a user must select.                      |
| `maxCustomizationSelection` | `Integer`      | No       | `1`     | Maximum number of options a user can select.                       |
| `isMandatory`               | `Boolean`      | No       | `false` | If `true`, the user must select at least `minCustomizationSelection`. |
| `isActive`                  | `Boolean`      | No       | `true`  | Toggle visibility/availability status.                             |
| `menuItemIds`               | `List<Long>`   | No       | `[]`    | Pre-associate this category with these menu items.                 |

#### Validation Rules

- `minCustomizationSelection` must be ≥ 0.
- `maxCustomizationSelection` must be ≥ `minCustomizationSelection`.
- Category name must be unique within the brand.

#### Example Request

```bash
curl -X POST "https://api.ustart.com/api/v1/menu/addons/categories" \
     -H "Authorization: Bearer <RESTRO_BRAND_JWT>" \
     -H "Content-Type: application/json" \
     -d '{
       "categoryName": "Add-On Dips",
       "minCustomizationSelection": 0,
       "maxCustomizationSelection": 3,
       "isMandatory": false,
       "isActive": true,
       "menuItemIds": [42, 43]
     }'
```

#### Success Response (200 OK)

```json
{
  "addOnId": 1,
  "brandId": "e1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
  "categoryName": "Add-On Dips",
  "minCustomizationSelection": 0,
  "maxCustomizationSelection": 3,
  "isMandatory": false,
  "isActive": true,
  "menuItemIds": [42, 43]
}
```

---

### 2. Update Add-On Category

Update category details or modify its menu item mapping.

```
PATCH /api/v1/menu/addons/categories/{categoryId}
```

**Required Roles**: `admin`, `restro` (brand-level)

#### Path Parameters

| Parameter    | Type   | Required | Description                     |
| :----------- | :----- | :------- | :------------------------------ |
| `categoryId` | `Long` | **Yes**  | The ID of the category to update. |

#### Query Parameters (Admins Only)

| Parameter      | Type   | Required | Description                                                             |
| :------------- | :----- | :------- | :---------------------------------------------------------------------- |
| `brandIdParam` | `UUID` | No*      | Required for admins. Brand users have this resolved automatically from JWT. |

#### Request Body (All fields optional)

| Field                       | Type           | Description                                                        |
| :-------------------------- | :------------- | :----------------------------------------------------------------- |
| `categoryName`              | `String`       | New display name.                                                  |
| `minCustomizationSelection` | `Integer`      | New minimum selection threshold.                                   |
| `maxCustomizationSelection` | `Integer`      | New maximum selection threshold.                                   |
| `isMandatory`               | `Boolean`      | Update whether selection is mandatory.                             |
| `isActive`                  | `Boolean`      | Toggle category active status.                                     |
| `menuItemIds`               | `List<Long>`   | Overwrite current menu item mappings. Passing empty clears mapping. |

#### Example Request

```bash
curl -X PATCH "https://api.ustart.com/api/v1/menu/addons/categories/1" \
     -H "Authorization: Bearer <JWT>" \
     -H "Content-Type: application/json" \
     -d '{
       "categoryName": "Premium Dips",
       "maxCustomizationSelection": 5,
       "menuItemIds": [42]
     }'
```

#### Success Response (200 OK)

```json
{
  "addOnId": 1,
  "brandId": "e1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
  "categoryName": "Premium Dips",
  "minCustomizationSelection": 0,
  "maxCustomizationSelection": 5,
  "isMandatory": false,
  "isActive": true,
  "menuItemIds": [42]
}
```

---

### 3. Delete Add-On Category

Soft-delete an add-on category. Deleting a category will cascade-delete all child add-ons.

```
DELETE /api/v1/menu/addons/categories/{categoryId}
```

**Required Roles**: `admin`, `restro` (brand-level)

#### Example Request

```bash
curl -X DELETE "https://api.ustart.com/api/v1/menu/addons/categories/1" \
     -H "Authorization: Bearer <JWT>"
```

#### Success Response (200 OK)

```json
{
  "addOnId": 1,
  "brandId": "e1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
  "categoryName": "Premium Dips",
  "minCustomizationSelection": 0,
  "maxCustomizationSelection": 5,
  "isMandatory": false,
  "isActive": false,
  "menuItemIds": []
}
```

---

### 4. Get Add-On Category Detail

Retrieve the details of a single category.

```
GET /api/v1/menu/addons/categories/{categoryId}
```

**Required Roles**: `restro`, `admin`, `customer`

---

### 5. List Add-On Categories

Fetch all active categories for a brand.

```
GET /api/v1/menu/addons/categories
```

**Required Roles**: `restro`, `admin`, `customer`

#### Query Parameters

| Parameter | Type   | Required | Description                                                             |
| :-------- | :----- | :------- | :---------------------------------------------------------------------- |
| `brandId` | `UUID` | No*      | Required for admins/customers. Brand users have this resolved from JWT. |

#### Example Request

```bash
curl -X GET "https://api.ustart.com/api/v1/menu/addons/categories?brandId=e1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c" \
     -H "Authorization: Bearer <JWT>"
```

#### Success Response (200 OK)

```json
[
  {
    "addOnId": 1,
    "brandId": "e1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "categoryName": "Premium Dips",
    "minCustomizationSelection": 0,
    "maxCustomizationSelection": 5,
    "isMandatory": false,
    "isActive": true,
    "menuItemIds": [42]
  }
]
```

---

## Frontend Integration Scenarios

### Scenario 1: Creating a Category (Brand Dashboard)

```javascript
// React Form Submission Handler
const handleCreateCategory = async (formData) => {
  try {
    const response = await fetch('/api/v1/menu/addons/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categoryName: formData.name,
        minCustomizationSelection: formData.min,
        maxCustomizationSelection: formData.max,
        isMandatory: formData.isMandatory,
        isActive: true,
        menuItemIds: formData.linkedItems // Array of Long IDs
      })
    });

    const data = await response.json();
    if (response.ok) {
      showToast('Add-on category created successfully!');
      redirectToCategoryList();
    } else {
      showError(data.message || 'Failed to create category');
    }
  } catch (error) {
    console.error('Error creating category:', error);
  }
};
```

### Scenario 2: UI selection rules representation

Depending on parameters, render options differently to guide the user:

```typescript
interface AddOnCategory {
  categoryName: string;
  minCustomizationSelection: number;
  maxCustomizationSelection: number;
  isMandatory: boolean;
}

// Determines the UI configuration
const getUiHelper = (category: AddOnCategory) => {
  const { minCustomizationSelection: min, maxCustomizationSelection: max, isMandatory } = category;
  
  if (min === 1 && max === 1 && isMandatory) {
    return {
      type: 'RADIO_BUTTONS',
      hint: 'Required: Choose exactly one option'
    };
  }
  
  if (min === 0 && max === 1 && !isMandatory) {
    return {
      type: 'DROPDOWN_WITH_NONE',
      hint: 'Optional: Choose up to one option'
    };
  }

  return {
    type: 'CHECKBOXES',
    hint: isMandatory 
      ? `Required: Select between ${min} and ${max} options` 
      : `Optional: Select up to ${max} options`
  };
};
```

---

## Caching Behavior

- **Create/Update/Delete**: Invalidates the brand-level menu cache (`menuItemCacheService.invalidateMenuCache(brandId)`). The next menu fetch will hit the database to retrieve updated lists.
- **Read**: Pulls list directly from the database or leverages fast local caches where applicable.
