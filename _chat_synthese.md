# Chat Synthesis - Complete OtoMusik Web Application Development

## Overview
This document provides a comprehensive synthesis of all steps and commands needed to create a working web application interface (IHM) that integrates with the OtoMusik API backend.

## Technology Stack
- **Frontend Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + Headless UI
- **State Management**: Zustand
- **API Client**: Fetch API with generated types
- **WebSocket**: Socket.io-client
- **Icons**: Heroicons
- **Build Tool**: Turbopack (Next.js)

## Complete Step-by-Step Implementation

### Phase 1: Project Initialization
```bash
# Initialize Next.js project
npx create-next-app@latest web-app --typescript --tailwind --app --use-npm --yes
cd web-app

# Install dependencies
npm install zustand @headlessui/react @heroicons/react socket.io-client
npm install -D @types/node
npm install class-variance-authority clsx tailwind-merge date-fns

# Optional utilities
npm install socket.io-client @types/socket.io-client
```

### Phase 2: API Integration & Type Safety

#### Environment Configuration
Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8001
```

#### TypeScript Types Generation
Based on OpenAPI specification, create `src/types/api.ts`:
```typescript
export interface VideoSchema {
  id: number;
  title: string;
  url: string;
  oto_channel_id?: number | null;
  channel_name?: string;
  status?: string;
  errors?: Record<string, any> | null;
  // ... other fields from OpenAPI
}

export interface ChannelSchema {
  id: number;
  name: string;
  url: string;
  status?: string;
  resolution?: string;
  // ... other fields from OpenAPI
}
```

#### API Client Implementation
Create `src/lib/api/client.ts`:
```typescript
export class APIClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
  }

  async videos = {
    list: (params?: VideoQueryParams) => this.get<VideoSchema[]>('/api/video/videos/', params),
    count: (params?: VideoQueryParams) => this.get<CountResponse>('/api/video/videos/count', params),
    create: (data: VideoCreateRequest) => this.post<VideoSchema>('/api/video/videos/', data),
    // ... other methods
  }
  
  async channels = {
    // Similar implementation
  }
}
```

### Phase 3: State Management with Zustand

#### Video Store
```typescript
interface VideoState {
  videos: VideoSchema[];
  totalCount: number;
  statusCounts: Record<string, number>;
  filters: VideoQueryParams;
  // ... other state
  
  // Actions
  fetchVideos: (params?: VideoQueryParams) => Promise<void>;
  fetchStatusCounts: (params?: VideoQueryParams) => Promise<void>;
  updateVideo: (id: number, data: Partial<VideoSchema>) => Promise<void>;
  // ... other actions
}
```

#### Channel Store
Similar implementation for channels with appropriate types.

#### UI Store
```typescript
interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  // ... other UI state
}
```

### Phase 4: Component Library

#### Base UI Components
- Button with variants (primary, secondary, destructive)
- Input, Textarea, Select with form integration
- Modal/Dialog with Headless UI
- Card layouts
- Loading spinners and states
- Toast notifications
- Modern Tooltip component

#### Data Components
- DataTable with sorting, filtering, pagination
- FilterPanel with status filters and search
- Pagination component with page size controls

#### Layout Components
- Navigation sidebar
- Header with branding
- Responsive layout container

### Phase 5: Main Application Pages

#### Dashboard (`/`)
```typescript
export default function Dashboard() {
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  const testApiConnection = async () => {
    try {
      const videos = await api.videos.count();
      const channels = await api.channels.count();
      setVideoCount(calculateTotal(videos));
      setChannelCount(calculateTotal(channels));
      setApiStatus('connected');
    } catch (error) {
      setApiStatus('disconnected');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* API Connection Status */}
      {/* Quick Stats */}
      {/* Navigation Cards */}
    </div>
  );
}
```

#### Video Management Page (`/videos`)
```typescript
export default function VideosPage() {
  const { videos, totalCount, statusCounts, filters, fetchVideos, fetchStatusCounts } = useVideoStore();
  
  // CRUD operations
  const handleCreateVideo = async (data: VideoCreateRequest) => {
    await createVideo(data);
    fetchVideos(filters);
    fetchStatusCounts(filters);
  };

  const handleStatusChange = async (video: VideoSchema, newStatus: string) => {
    await updateVideo(video.id, { status: newStatus });
    fetchVideos(filters);
    fetchStatusCounts(filters);
  };

  return (
    <div className="p-6">
      <FilterPanel 
        filters={filters}
        onFiltersChange={setFilters}
        statusCounts={statusCounts}
        totalFilteredCount={totalCount}
        type="video"
      />
      <VideoTable 
        videos={videos}
        onEdit={handleEditVideo}
        onDelete={handleDeleteVideo}
        onStatusChange={handleStatusChange}
      />
      <Pagination 
        currentPage={filters.page || 1}
        totalPages={Math.ceil(totalCount / (filters.limit || 50))}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
```

#### Channel Management Page (`/channels`)
Similar implementation with channel-specific logic.

### Phase 6: Advanced Features Implementation

#### Status Management with Interactive Tooltips
```typescript
// In VideoTable component
const StatusBadge = ({ video, status, onStatusChange }) => {
  const handleDoubleClick = () => {
    if (status === 'FAILED' || status === 'SKIP') {
      onStatusChange(video, 'PENDING');
    }
  };

  const tooltipContent = useMemo(() => {
    if (status === 'FAILED') {
      return (
        <>
          <div className="text-blue-300 mb-2">💡 Double-cliquez pour repasser en PENDING</div>
          <div>Error Details: {formatErrorMessage(video.errors)}</div>
        </>
      );
    }
    if (status === 'SKIP') {
      return (
        <>
          <div className="text-blue-300 mb-2">💡 Double-cliquez pour repasser en PENDING</div>
          <div>Cette vidéo a été volontairement ignorée</div>
        </>
      );
    }
    return null;
  }, [status, video.errors]);

  return (
    <Tooltip content={tooltipContent}>
      <span 
        className={getStatusColor(status)}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: (status === 'FAILED' || status === 'SKIP') ? 'pointer' : 'default' }}
      >
        {status}
      </span>
    </Tooltip>
  );
};
```

#### Dynamic Filtering System
```typescript
// Status counts that update with filters
const fetchStatusCounts = async (params: VideoQueryParams) => {
  const { status, sort_by, sort_order, limit, ...filterParams } = params;
  
  try {
    const response = await api.videos.count(filterParams);
    const statusCounts: Record<string, number> = {};
    let totalCount = 0;

    // Parse API response
    Object.entries(response).forEach(([key, value]) => {
      if (key !== 'count' && typeof value === 'number') {
        statusCounts[key] = value;
        totalCount += value;
      }
    });

    // Calculate filtered total based on selected statuses
    if (status && status.length > 0) {
      totalCount = status.reduce((sum, selectedStatus) => {
        return sum + (statusCounts[selectedStatus] || 0);
      }, 0);
    }

    set({ statusCounts, totalCount });
  } catch (error) {
    console.error('Error fetching status counts:', error);
  }
};
```

#### Pagination with Record Count Display
```typescript
const Pagination = ({ currentPage, totalPages, totalRecords, pageSize, onPageChange, onPageSizeChange }) => {
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Showing {startRecord.toLocaleString()} to {endRecord.toLocaleString()} of {totalRecords.toLocaleString()} results
      </div>
      
      <div className="flex items-center space-x-2">
        <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          Previous
        </button>
        
        {/* Page numbers with ellipses */}
        
        <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next
        </button>
      </div>
      
      <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
        <option value={200}>200</option>
      </select>
    </div>
  );
};
```

### Phase 7: CORS Configuration (Backend Required)

Add to FastAPI backend:
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

## Key Implementation Patterns

### 1. Error Handling
```typescript
try {
  const result = await api.videos.create(data);
  showNotification('success', 'Video created successfully');
  return result;
} catch (error) {
  if (error instanceof APIError) {
    showNotification('error', `API Error: ${error.message}`);
    if (error.details) {
      console.error('Validation errors:', error.details);
    }
  } else {
    showNotification('error', 'An unexpected error occurred');
  }
  throw error;
}
```

### 2. Form Management
```typescript
const [formData, setFormData] = useState<VideoFormData>({
  title: '',
  url: '',
  oto_channel_id: null,
  status: 'PENDING'
});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.title || !formData.url) {
    showNotification('error', 'Title and URL are required');
    return;
  }
  
  await handleCreateVideo(formData);
  setFormData({ title: '', url: '', oto_channel_id: null, status: 'PENDING' });
  setIsCreateModalOpen(false);
};
```

### 3. Real-time Updates with useEffect
```typescript
useEffect(() => {
  fetchVideos(filters);
  fetchStatusCounts(filters);
}, [filters, fetchVideos, fetchStatusCounts]);

// Separate effect for initial load
useEffect(() => {
  fetchVideos();
  fetchStatusCounts({});
}, []);
```

## Development Commands

### Development Server
```bash
cd web-app
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Type Checking
```bash
npx tsc --noEmit
```

## Testing the Application

### 1. Start Backend API
Ensure FastAPI server is running on port 8001:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### 2. Verify API Endpoints
```bash
# Test API connectivity
curl http://localhost:8001/api/video/videos/
curl http://localhost:8001/api/video/channels/
curl http://localhost:8001/api/video/videos/count
```

### 3. Start Frontend
```bash
cd web-app
npm run dev
```

### 4. Test Features
- Dashboard: http://localhost:3000
- Videos: http://localhost:3000/videos  
- Channels: http://localhost:3000/channels

## Troubleshooting Common Issues

### CORS Errors
- Ensure CORS middleware is configured in FastAPI
- Verify API URL in `.env.local`
- Check browser network tab for preflight requests

### Hydration Errors
- Use `suppressHydrationWarning` for dynamic content
- Ensure server and client render the same content
- Handle browser extensions that modify DOM

### API Connection Issues
- Verify backend is running on correct port
- Check firewall/network settings
- Validate API endpoint paths match OpenAPI spec

### State Management Issues
- Ensure stores are properly initialized
- Check useEffect dependencies
- Verify API responses match TypeScript interfaces

## Production Deployment Considerations

### Environment Variables
```bash
# .env.production
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### Build Optimization
```bash
# Enable static generation where possible
npm run build
npm run start
```

### Performance
- Implement proper loading states
- Use React.memo for expensive components
- Optimize API calls with debouncing
- Add error boundaries

## Final Result
A complete, modern web application with:
- ✅ Real-time API integration
- ✅ Complete CRUD operations for videos and channels
- ✅ Advanced filtering and search
- ✅ Status management with interactive features
- ✅ Responsive design with dark mode
- ✅ Professional pagination
- ✅ Error handling and notifications
- ✅ Type-safe TypeScript implementation
- ✅ Modern UI/UX patterns

The application provides a comprehensive interface for managing video and channel data with all the features needed for production use.