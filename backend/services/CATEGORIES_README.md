# Dynamic Categories System for Pictograms

This document describes the dynamic categories system for managing pictogram categories in the AAC application.

## Overview

The system allows for:
- **Predefined categories**: Initialized automatically with pictograms matching keywords/tags
- **Dynamic categories**: Created by users using AI to find relevant pictograms
- **Efficient queries**: O(1) lookup using a JSON mapping file
- **Persistent storage**: Categories survive app restarts

## Architecture

### File Structure

```
backend/
├── data/
│   ├── arasaac_en.json              # Master pictogram database (13k+ entries)
│   ├── predefinedCategories.json    # Predefined categories mapping (read-only, pre-generated)
│   └── categories.json              # User-created custom categories only
└── services/
    └── categoryService.ts            # Category management service
```

### Data Format

**predefinedCategories.json** structure (pre-generated, contains all 8 predefined categories):
```json
{
  "Food": [2248, 2251, 2252, ...],
  "Games": [16743, 16744, 16745, ...],
  "School": [32446, 32447, 32448, ...],
  "Family": [6632, 6625, 6626, ...],
  "Sports": [16743, 16754, 16755, ...],
  "Music": [16765, 16766, 16767, ...],
  "Animals": [16776, 16777, 16778, ...],
  "Transport": [16747, 16787, 16788, ...]
}
```

**categories.json** structure (user-created categories only, starts empty):
```json
{
  "Emotions": [1234, 5678, 9012, ...],
  "CustomCategory": [3456, 7890, 1234, ...]
}
```

**arasaac_en.json** structure (master database):
```json
[
  {
    "id": 2248,
    "keywords": ["water"],
    "tags": ["food", "beverage", "feeding"]
  },
  ...
]
```

## Predefined Categories

The following categories are predefined and initialized automatically:

- **Food**: Food, beverages, meals, eating
- **Games**: Toys, games, play, entertainment
- **School**: Education, learning, school supplies
- **Family**: Family members, relatives, home
- **Sports**: Sports, exercise, physical activities
- **Music**: Music, instruments, sound
- **Animals**: Animals, pets, wildlife
- **Transport**: Vehicles, transportation, travel

## API Endpoints

### GET `/api/categories`

Get all categories with their pictogram IDs.

**Response:**
```json
{
  "categories": {
    "Food": [2248, 2251, 2252],
    "Games": [16743, 16744],
    "CustomCategory": [1234, 5678]
  }
}
```

### GET `/api/categories/:categoryName`

Get pictogram IDs for a specific category.

**Example:** `GET /api/categories/Food`

**Response:**
```json
{
  "category": "Food",
  "pictogramIds": [2248, 2251, 2252, ...],
  "count": 150,
  "isPredefined": true
}
```

### POST `/api/categories`

Create a new custom category using AI to find relevant pictograms.

**Request Body:**
```json
{
  "categoryName": "Emotions",
  "maxResults": 50
}
```

**Response:**
```json
{
  "category": "Emotions",
  "pictogramIds": [1234, 5678, 9012, ...],
  "count": 45,
  "message": "Categoría \"Emotions\" creada exitosamente con 45 pictogramas"
}
```

**Error Responses:**
- `400`: Category name is invalid or is a predefined category
- `409`: Category already exists
- `500`: Error creating category (e.g., Azure OpenAI not configured)

### DELETE `/api/categories/:categoryName`

Delete a custom category (cannot delete predefined categories).

**Example:** `DELETE /api/categories/CustomCategory`

**Response:**
```json
{
  "message": "Categoría \"CustomCategory\" eliminada exitosamente"
}
```

**Error Responses:**
- `400`: Trying to delete a predefined category
- `404`: Category does not exist
- `500`: Error deleting category

### POST `/api/categories/initialize`

Initialize predefined categories (useful for first-time setup or reset).

**Response:**
```json
{
  "message": "Categorías predefinidas inicializadas exitosamente",
  "categories": {
    "Food": [2248, ...],
    "Games": [16743, ...],
    ...
  },
  "predefinedCategories": ["Food", "Games", "School", ...]
}
```

## How It Works

### Initialization

1. **Predefined Categories**: The file `predefinedCategories.json` is pre-generated with all 8 predefined categories and their pictogram mappings. This file is read-only and contains:
   - Food: ~1,279 pictograms
   - Games: ~286 pictograms
   - School: ~729 pictograms
   - Family: ~928 pictograms
   - Sports: ~1,091 pictograms
   - Music: ~227 pictograms
   - Animals: ~615 pictograms
   - Transport: ~556 pictograms

2. **Custom Categories**: The file `categories.json` starts empty and only stores user-created categories. It is separate from predefined categories to maintain clean separation.

3. When the system loads categories, it merges both files:
   - Predefined categories from `predefinedCategories.json`
   - Custom categories from `categories.json`

### Creating Dynamic Categories

1. User requests a new category via `POST /api/categories`
2. System performs a **hybrid search**:
   - **Local search**: Finds pictograms matching the category name in keywords/tags
   - **AI search**: Uses Azure OpenAI to identify relevant keywords/tags, then searches locally
   - **Combines results**: Merges both searches and removes duplicates
3. Saves the new category to `categories.json` (NOT to predefinedCategories.json)

### Querying

- Predefined categories are loaded from `predefinedCategories.json` (read-only)
- Custom categories are loaded from `categories.json` (read-write)
- Both are merged in memory for queries
- Lookup is O(1) - instant access by category name
- Master pictogram database (`arasaac_en.json`) is never modified
- Predefined categories file is never modified by the application

## AI Integration

### Azure OpenAI Configuration

The system uses Azure OpenAI to find relevant pictograms for new categories. Required environment variables:

```env
AZURE_OPENAI_PHRASE_URL=https://your-resource.openai.azure.com
AZURE_OPENAI_PHRASE_KEY=your_api_key
AZURE_OPENAI_PHRASE_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_PHRASE_API_VERSION=2023-03-15-preview
```

### AI Prompt Strategy

Instead of asking AI to return specific pictogram IDs (which it might invent), the system:

1. Asks AI to identify relevant **keywords** and **tags** for the category
2. Searches the master database locally using those terms
3. Validates all results against the actual database

This ensures:
- ✅ All returned IDs exist in the database
- ✅ Results are semantically correct
- ✅ No hallucinated IDs

## Usage Examples

### Initialize Categories (First Time)

**Note**: Predefined categories are already generated in `predefinedCategories.json`. This endpoint will reload them if needed.

```bash
curl -X POST http://localhost:3000/api/categories/initialize
```

### Get All Categories

```bash
curl http://localhost:3000/api/categories
```

### Create Custom Category

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"categoryName": "Emotions", "maxResults": 30}'
```

### Get Category Pictograms

```bash
curl http://localhost:3000/api/categories/Food
```

### Delete Custom Category

```bash
curl -X DELETE http://localhost:3000/api/categories/Emotions
```

## Service Functions

### `categoryService.ts` Exports

```typescript
// Load predefined categories from JSON file
loadPredefinedCategories(): Promise<Record<string, number[]>>

// Load custom categories from JSON file (user-created only)
loadCustomCategories(): Promise<Record<string, number[]>>

// Save custom categories to JSON file
saveCustomCategories(categories: Record<string, number[]>): Promise<void>

// Initialize predefined categories (loads from file or generates if missing)
initializePredefinedCategories(): Promise<Record<string, number[]>>

// Create a new custom category
createCategory(categoryName: string, maxResults?: number): Promise<number[]>

// Delete a custom category
deleteCategory(categoryName: string): Promise<void>

// Get all categories (predefined + custom merged)
getAllCategories(): Promise<Record<string, number[]>>

// Get pictogram IDs for a category
getCategoryPictograms(categoryName: string): Promise<number[]>

// Check if category is predefined
isPredefinedCategory(categoryName: string): boolean
```

## Performance Considerations

- **Initialization**: First-time initialization may take 10-30 seconds (processing 186k+ pictograms)
- **Category Creation**: AI-based creation takes 2-5 seconds (Azure OpenAI API call + local search)
- **Queries**: O(1) lookup - instant response
- **Storage**: JSON file is small (~few KB even with many categories)

## Error Handling

- If Azure OpenAI is not configured, category creation will fail with a clear error message
- If `categories.json` is corrupted, the system will attempt to reinitialize
- Predefined categories cannot be deleted or recreated
- All operations validate input and provide meaningful error messages

## Future Enhancements

Potential improvements:
- Category editing (add/remove pictograms manually)
- Category merging
- Category statistics (most used, etc.)
- Export/import categories
- Category templates
- User-specific categories (multi-user support)

