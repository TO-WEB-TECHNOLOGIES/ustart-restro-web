# Menu Item Creation API Documentation

This document specifies the API payload and parameter requirements for creating a new menu item within the UStart Restro dashboard.

## API Payload (JSON)

```json
{
  "categoryId": 101,
  "originalProductId": 40,
  "name": "Garden Fresh Pizza",
  "itemPrice": 499,
  "packagingCharges": 30,
  "taxAmount": 5,
  "foodType": "veg",
  "serviceType": "Both",
  "itemType": ["Solid"],
  "isFrosting": "No",
  "spiceLevel": 1,
  "description": "A delicious mix of fresh vegetables and melted cheese.",
  "serves": 2,
  "portionSize": 1,
  "weight": "450g",
  "maxQuantity": 10,
  "tags": ["vegan", "gluten_free"],
  "allergens": ["wheat"],
  "availability": {
    "startTime": "10:00",
    "endTime": "23:00",
    "allDay": false
  },
  "nutritionalInfo": {
    "calories": "800 kcal",
    "protein": "15g",
    "carbs": "100g",
    "fats": "30g"
  },
  "isAvailable": true,
  "image": "menu-items/images/garden_fresh_pizza_7b2a9.jpg",
  "isAiGeneratedImage": false
}
```

## Parameter Definitions

### Mandatory Parameters

| Parameter          | Type       | Validation / Constraints         | Description                                       |
| :----------------- | :--------- | :------------------------------- | :------------------------------------------------ |
| `categoryId`       | `number`   | Required                         | The ID of the category this item belongs to.      |
| `name`             | `string`   | 1-100 characters                 | Display name of the item.                         |
| `itemPrice`        | `number`   | Min 0                            | Base price of the item.                           |
| `packagingCharges` | `number`   | Min 0                            | Charges for packaging.                            |
| `taxAmount`        | `number`   | 0-100                            | Tax percentage applicable.                        |
| `foodType`         | `string`   | `veg`, `non_veg`, `contains_egg` | Dietary classification.                           |
| `serviceType`      | `string`   | `Delivery`, `Dine-In`, `Both`    | Available service modes.                          |
| `itemType`         | `string[]` | Min 1 element                    | Types: `Solid`, `Liquid`, `Semi-Solid`, `Frozen`. |
| `isFrosting`       | `string`   | `FROSTED`, `PRE`, `NO`     | Frosting status.                                  |
| `spiceLevel`       | `number`   | 1 (Mild) to 3 (Hot)              | Heat level of the dish.                           |

### Optional Parameters

| Parameter            | Type       | Validation / Constraints             | Description                                                    |
| :------------------- | :--------- | :----------------------------------- | :------------------------------------------------------------- |
| `originalProductId`  | `number`   | Must belong to same brand            | If set, this item becomes a variant of the referenced product. |
| `description`        | `string`   | Max 100 characters                   | Short description of the item.                                 |
| `image`              | `string`   | S3 Key                               | The unique file name (key) in S3.                              |
| `serves`             | `number`   | Min 1                                | Number of people it serves.                                    |
| `portionSize`        | `number`   | Min 1                                | Size of a single portion.                                      |
| `weight`             | `string`   | -                                    | Weight of the item (e.g., "500g").                             |
| `maxQuantity`        | `number`   | Min 1                                | Maximum quantity per order.                                    |
| `tags`               | `string[]` | -                                    | e.g., `vegan`, `chefs_special`, `jain`.                        |
| `allergens`          | `string[]` | -                                    | e.g., `milk`, `eggs`, `wheat`.                                 |
| `availability`       | `object`   | `{ startTime, endTime, allDay }`     | Time-based availability.                                       |
| `nutritionalInfo`    | `object`   | `{ calories, protein, carbs, fats }` | Nutritional breakdown.                                         |
| `isAvailable`        | `boolean`  | Default `true`                       | Initial availability across all restaurants.                   |
| `isAiGeneratedImage` | `boolean`  | Required if `image` is present       | Flag for AI-generated images.                                  |

## Successful Response

```json
{
  "menuItemId": 42,
  "name": "Garden Fresh Pizza",
  "message": "Menu item created successfully"
}
```

### Response Fields

| Field        | Type     | Description                             |
| :----------- | :------- | :-------------------------------------- |
| `menuItemId` | `number` | The unique ID assigned to the new item. |
| `name`       | `string` | The name of the item as saved.          |
| `message`    | `string` | A success confirmation message.         |

## Process: Adding an Item with Image

To ensure performance and security, the creation of a menu item with an image is a decoupled process using the **Multimedia Service**:

### Step 1: Request Upload Authorization (Presigned URL)
The client requests a presigned S3 upload URL by calling the **Multimedia Controller**:

```
POST /api/v1/multimedia/presigned-urls
```

#### Request Payload:
```json
{
  "fileNames": ["garden_fresh_pizza.jpg"],
  "requirementType": "menu_item"
}
```

- **`requirementType`** must be exactly `"menu_item"` so the file is organized in the `"menu-items/images/"` directory.
- For Restro-role users, the backend automatically extracts the active `brandId` from JWT claims to partition the S3 directory.

#### Success Response (200 OK):
```json
[
  {
    "fileName": "menu-items/images/8f3a9b1c-d7e6-42a1-bf89-2c0b1a2d3e4f_9c7b2a9d-3e4f-5a6b-7c8d-9e0f1a2b3c4d.jpg",
    "presignedUrl": "https://ustart-media-bucket.s3.ap-south-1.amazonaws.com/menu-items/images/8f3a9b1c-d7e6-42a1-bf89-2c0b1a2d3e4f_9c7b2a9d-3e4f-5a6b-7c8d-9e0f1a2b3c4d.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
    "publicUrl": "https://ustart-media-bucket.s3.ap-south-1.amazonaws.com/menu-items/images/8f3a9b1c-d7e6-42a1-bf89-2c0b1a2d3e4f_9c7b2a9d-3e4f-5a6b-7c8d-9e0f1a2b3c4d.jpg"
  }
]
```

### Step 2: Extract S3 Key & Upload Binary File
1. Extract the relative **`fileName`** (e.g. `"menu-items/images/8f3a9b1c..._9c7b2...jpg"`) and **`presignedUrl`** from the response object.
2. Perform a direct binary **`PUT`** request to the **`presignedUrl`** with the raw image file (headers should include proper Content-Type).

```bash
curl -X PUT -T "/path/to/local/image.jpg" "https://ustart-media-bucket.s3.ap-south-1.amazonaws.com/menu-items/images/..."
```

### Step 3: Finalize Menu Item Creation
Once the binary S3 upload succeeds, send the relative **`fileName`** (S3 Key) in the `"image"` parameter of the menu item payload:

```json
{
  "categoryId": 101,
  "name": "Garden Fresh Pizza",
  "image": "menu-items/images/8f3a9b1c-d7e6-42a1-bf89-2c0b1a2d3e4f_9c7b2a9d-3e4f-5a6b-7c8d-9e0f1a2b3c4d.jpg",
  "isAiGeneratedImage": false,
  "itemPrice": 499,
  "foodType": "veg"
  ...
}
```

> [!IMPORTANT]
> The backend expects the relative **S3 Key** (`fileName` from the response), **NOT** the absolute `publicUrl` (S3 absolute domain).

This workflow prevents the backend from handling heavy binary data and ensures that images are properly associated with the brand/context via the `fileName` directory organization.

---

_Generated based on [menuApi.ts](file:///Users/professor/Desktop/ustart-restro/src/features/dashboard/api/menuApi.ts) and [menuSchemas.ts](file:///Users/professor/Desktop/ustart-restro/src/features/dashboard/validations/menuSchemas.ts)._
