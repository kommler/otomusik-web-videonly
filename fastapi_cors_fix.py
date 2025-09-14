# FastAPI CORS Configuration Fix
# Add this EXACT configuration to your FastAPI main application file

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CRITICAL: Add CORS middleware BEFORE any other middleware or routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js development server
        "http://127.0.0.1:3000",  # Alternative localhost format
        "http://localhost:3001",  # Alternative port
        # Add your production domains here when deploying
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "User-Agent",
        "Cache-Control",
        "Pragma",
    ],
    expose_headers=["*"],
    max_age=3600,
)

# Your existing API routes go here...

# Example route structure:
# @app.get("/")
# def read_root():
#     return {"message": "Hello World"}
# 
# # Include your routers AFTER the CORS middleware
# app.include_router(your_video_router, prefix="/api/video")
# app.include_router(your_channel_router, prefix="/api/video")

# IMPORTANT NOTES:
# 1. The CORSMiddleware MUST be added before any routes or other middleware
# 2. Make sure your FastAPI server is running on port 8001
# 3. Restart your FastAPI server after adding this configuration
# 4. Test with: curl -X OPTIONS -H "Origin: http://localhost:3000" http://localhost:8001/api/video/videos/count