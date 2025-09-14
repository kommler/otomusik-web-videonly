# CORS Configuration Guide for FastAPI Backend

## Problem
Your Next.js frontend is getting "Failed to fetch" errors because the FastAPI backend doesn't have CORS (Cross-Origin Resource Sharing) properly configured. The server is returning `405 Method Not Allowed` for OPTIONS requests.

## Solution

### Step 1: Add CORS Middleware to FastAPI

Add the following code to your **main FastAPI application file** (usually `main.py` or `app.py`) **at the very top, before any routes**:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CRITICAL: Add this BEFORE any routes or other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://127.0.0.1:3000",  # Alternative format
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Your existing routes go here AFTER the middleware
```

### Step 2: Restart FastAPI Server

After adding the CORS middleware, **restart your FastAPI server completely**:

```bash
# Stop the server (Ctrl+C)
# Then restart it:
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### Step 3: Verify CORS is Working

Test that CORS is working with this command:

```bash
curl -X OPTIONS -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" http://localhost:8001/api/video/videos/count
```

You should see a `200 OK` response with CORS headers like:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD
```

### Step 4: Test Your Frontend

1. Make sure your Next.js dev server is running:
   ```bash
   cd web-app && npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. Check the browser console - the API errors should be resolved

## Common Issues

1. **CORS middleware added in wrong place**: It must be added before any routes
2. **Server not restarted**: Always restart FastAPI after configuration changes  
3. **Wrong origins**: Make sure `http://localhost:3000` is in the allow_origins list
4. **Missing methods**: Include "OPTIONS" in allow_methods

## Quick Fix Template

If you're unsure about your FastAPI structure, here's a complete minimal example:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create app instance
app = FastAPI(title="OtoMusik API")

# Add CORS - MUST be first middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Now add your routes/routers
@app.get("/")
def root():
    return {"message": "API is working"}

# Include your existing routers here
# app.include_router(video_router, prefix="/api/video")
```