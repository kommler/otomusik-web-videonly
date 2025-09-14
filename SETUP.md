# OtoMusik Web App - Setup and Testing Guide

> 📖 **Additional Guides**: See [HYDRATION_GUIDE.md](./HYDRATION_GUIDE.md) for hydration troubleshooting

## Database Configuration

### Backend (FastAPI) Configuration
The database connection is configured in your FastAPI backend. You should have:

1. **Database URL Configuration** (in your FastAPI backend):
   ```python
   # Usually in settings.py or config.py
   DATABASE_URL = "postgresql://username:password@localhost:5432/otomusik_db"
   # or
   DATABASE_URL = "sqlite:///./otomusik.db"
   ```

2. **Environment Variables** (backend `.env` file):
   ```bash
   DATABASE_URL=postgresql://username:password@localhost:5432/otomusik_db
   API_HOST=0.0.0.0
   API_PORT=8000
   ```

### Frontend Configuration
The frontend connects to the API via the URL configured in `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Testing the Application

### 1. Start the Backend API
First, ensure your FastAPI backend is running:
```bash
# In your FastAPI backend directory
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### 2. Test API Connection
You can test if the API is accessible:
```bash
curl http://localhost:8001/api/video/videos/
curl http://localhost:8001/api/video/channels/
```

### 3. Start the Frontend
In the web-app directory:
```bash
cd web-app
npm run dev
```

### 4. Access the Application
Open your browser to:
- Frontend: http://localhost:3000
- API Docs: http://localhost:8001/docs

## Database Schema
Based on your OpenAPI spec, you have these main tables:
- **videos**: VideoSchema with fields like id, url, title, status, etc.
- **channels**: ChannelSchema with fields like id, name, status, video_count, etc.

## Common Issues and Solutions

### 1. CORS Issues (Failed to fetch)
If you get CORS errors or "Failed to fetch" errors, this means your FastAPI backend needs CORS configuration. 

**📖 See [CORS_FIX_GUIDE.md](./CORS_FIX_GUIDE.md) for detailed step-by-step instructions.**

Quick fix - ensure your FastAPI backend has CORS configured **before any routes**:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Hydration Errors
📖 See [HYDRATION_GUIDE.md](./HYDRATION_GUIDE.md) for hydration troubleshooting

### 2. Database Connection
- Ensure your database server is running
- Check connection credentials
- Verify database exists and has proper permissions

### 3. Environment Variables
- Backend: Check `.env` file in FastAPI directory
- Frontend: Check `.env.local` in web-app directory

## API Endpoints Available

Based on your OpenAPI schema:

### Videos
- GET `/api/video/videos/` - List videos
- POST `/api/video/videos/` - Create video
- GET `/api/video/videos/{id}` - Get video
- PUT `/api/video/videos/{id}` - Update video
- PATCH `/api/video/videos/{id}` - Partial update
- DELETE `/api/video/videos/{id}` - Delete video
- GET `/api/video/videos/count` - Count videos

### Channels
- GET `/api/video/channels/` - List channels
- POST `/api/video/channels/` - Create channel
- GET `/api/video/channels/{id}` - Get channel
- PUT `/api/video/channels/{id}` - Update channel
- PATCH `/api/video/channels/{id}` - Partial update
- DELETE `/api/video/channels/{id}` - Delete channel
- GET `/api/video/channels/count` - Count channels