# Hydration Troubleshooting Guide

## Common Hydration Issues and Solutions

### 1. Browser Extension Conflicts
**Problem**: Extensions modify DOM before React hydration
**Solution**: ✅ Fixed with `suppressHydrationWarning` on `<body>`

### 2. Dynamic Content Mismatches
**Problem**: Server and client render different content
**Solution**: Use `NoSSR` component for client-only content

### 3. Date/Time Formatting Issues
**Problem**: Server timezone differs from client
**Solution**: Format dates on client-side only

### 4. Environment Variables
**Problem**: Different values between server/client
**Solution**: Use `NEXT_PUBLIC_` prefix for client variables

## Usage Examples

### Using NoSSR for Client-Only Components
```tsx
import { NoSSR } from '@/components/layout/NoSSR';

function MyComponent() {
  return (
    <NoSSR fallback={<div>Loading...</div>}>
      <ClientOnlyComponent />
    </NoSSR>
  );
}
```

### Handling Dynamic Dates
```tsx
import { NoSSR } from '@/components/layout/NoSSR';

function CurrentTime() {
  return (
    <NoSSR>
      <span>{new Date().toLocaleString()}</span>
    </NoSSR>
  );
}
```

## Debug Commands

### Check for Hydration Warnings
```bash
npm run dev
# Open browser console and look for hydration warnings
```

### Production Build Test
```bash
npm run build && npm start
# Test in production mode to catch SSR issues
```