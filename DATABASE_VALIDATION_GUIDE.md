# Database Schema Validation Guide

## Common Database Errors and Solutions

### Problem: IntegrityError - null value violates not-null constraint

**Error Message Example:**
```
IntegrityError: (psycopg2.errors.NotNullViolation) null value in column "id" of relation "channel" violates not-null constraint
```

**Root Cause:**
When updating records via PUT requests, the frontend was sending incomplete data objects that excluded required fields like `id`. The backend API expects complete schema objects with all required fields.

**Solution Applied:**
Updated the edit handlers in both `videos/page.tsx` and `channels/page.tsx` to:
1. Start with the existing record data (`...editingVideo` or `...editingChannel`)
2. Override only the fields that can be edited by the user
3. Preserve all required fields (like `id`) from the original record

**Before (Problematic):**
```typescript
const channelData: ChannelSchema = {
  name: formData.name,
  description: formData.description || null,
  url: formData.url,
  // Missing required fields like 'id'!
};
```

**After (Fixed):**
```typescript
const channelData: ChannelSchema = {
  ...editingChannel, // Preserve all existing fields including 'id'
  // Override only user-editable fields
  name: formData.name,
  description: formData.description || null,
  url: formData.url,
};
```

## API Error Handling

Enhanced the API client (`lib/api/client.ts`) to provide better error messages for:
- **500 Internal Server Errors**: Shows database constraint or validation context
- **422 Validation Errors**: Displays field-specific validation details
- **Network/CORS Errors**: Provides troubleshooting guidance

## Prevention Tips

1. **Always preserve required fields** when updating records
2. **Use spread operator** (`...existingRecord`) to maintain data integrity
3. **Test update operations** with required fields in your database schema
4. **Check API responses** for detailed error information
5. **Use TypeScript** to catch missing fields at compile time

## Database Schema Considerations

Make sure your FastAPI backend:
1. **Validates required fields** before database operations
2. **Returns meaningful error messages** for constraint violations
3. **Uses proper HTTP status codes** (422 for validation, 500 for server errors)
4. **Logs detailed error information** for debugging

## Testing Database Updates

To test if updates work correctly:

1. **Create a test record** via the UI
2. **Edit the record** and save changes
3. **Check the browser network tab** for API request/response details
4. **Verify database constraints** are properly handled
5. **Test edge cases** like null/empty values in optional fields