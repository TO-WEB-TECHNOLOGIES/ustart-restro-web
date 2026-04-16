# Menu Item Creation API Documentation

This document specifies the API payload and parameter requirements for creating a new menu item within the UStart Restro dashboard.

## API Payload (JSON)

```json
{
  "categoryId": 101,
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
  }
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

| Parameter            | Type       | Validation / Constraints             | Description                             |
| :------------------- | :--------- | :----------------------------------- | :-------------------------------------- |
| `description`        | `string`   | Max 100 characters                   | Short description of the item.          |
| `image`              | `string`   | URL / Base64                         | Image representation of the item.       |
| `serves`             | `number`   | Min 1                                | Number of people it serves.             |
| `portionSize`        | `number`   | Min 1                                | Size of a single portion.               |
| `weight`             | `string`   | -                                    | Weight of the item (e.g., "500g").      |
| `maxQuantity`        | `number`   | Min 1                                | Maximum quantity per order.             |
| `tags`               | `string[]` | -                                    | e.g., `vegan`, `chefs_special`, `jain`. |
| `allergens`          | `string[]` | -                                    | e.g., `milk`, `eggs`, `wheat`.          |
| `availability`       | `object`   | `{ startTime, endTime, allDay }`     | Time-based availability.                |
| `nutritionalInfo`    | `object`   | `{ calories, protein, carbs, fats }` | Nutritional breakdown.                  |
| `isAiGeneratedImage` | `boolean`  | Required if `image` is present       | Flag for AI-generated images.           |

---

_Generated based on [menuApi.ts](file:///Users/professor/Desktop/ustart-restro/src/features/dashboard/api/menuApi.ts) and [menuSchemas.ts](file:///Users/professor/Desktop/ustart-restro/src/features/dashboard/validations/menuSchemas.ts)._
