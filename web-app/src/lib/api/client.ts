import { 
  VideoSchema, 
  VideoUpdateSchema, 
  ChannelSchema, 
  ChannelUpdateSchema,
  PlaylistSchema,
  PlaylistUpdateSchema,
  MusicChannelSchema,
  MusicChannelUpdateSchema,
  ReleaseSchema,
  ReleaseUpdateSchema,
  MusicVideoSchema,
  MusicVideoUpdateSchema,
  VideoQueryParams,
  ChannelQueryParams,
  PlaylistQueryParams,
  MusicChannelQueryParams,
  MusicReleaseQueryParams,
  MusicVideoQueryParams,
  CountResponse,
  HTTPValidationError
} from '../../types/api';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Error classes
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: HTTPValidationError
  ) {
    super(message);
    this.name = 'APIError';
  }
}
import { apiCache, CACHE_TTL } from './cache';

// Generic fetch wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  cacheOptions?: { ttl?: number; skipCache?: boolean }
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const isGetRequest = !options.method || options.method === 'GET';
  
  // Essayer le cache pour les requêtes GET
  if (isGetRequest && !cacheOptions?.skipCache) {
    const cached = apiCache.get<T>(endpoint);
    if (cached !== null) {
      return cached;
    }
  }
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config: RequestInit = {
    mode: 'cors',
    credentials: 'omit',
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorDetails: HTTPValidationError | undefined;
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        
        if (response.status === 422) {
          errorDetails = errorData as HTTPValidationError;
        } else if (response.status === 500) {
          // Internal server error - provide more context
          errorMessage = `Server error (${response.status}): ${errorData.detail || response.statusText}. This may be a database constraint or validation issue.`;
        } else if (errorData.detail) {
          errorMessage = `${errorMessage}: ${errorData.detail}`;
        }
      } catch {
        // If we can't parse the error response, use the default message
      }

      throw new APIError(
        errorMessage,
        response.status,
        errorDetails
      );
    }

    // Handle empty responses (like DELETE operations)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    const data = await response.json();
    
    // Mettre en cache les requêtes GET réussies
    if (isGetRequest && !cacheOptions?.skipCache) {
      apiCache.set(endpoint, undefined, data, cacheOptions?.ttl ?? CACHE_TTL.MEDIUM);
    }
    
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Handle CORS and network errors
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new APIError(
          `CORS or network error: Unable to connect to API server at ${API_BASE_URL}. Please check that the backend server is running and CORS is properly configured.`,
          0
        );
      }
      
      throw new APIError(
        `Network error: ${error.message}`,
        0
      );
    }
    
    throw new APIError(
      'Unknown network error occurred',
      0
    );
  }
}

// Utility function to build query string
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Wrapper pour les mutations qui invalide le cache
 */
async function mutationRequest<T>(
  endpoint: string,
  options: RequestInit,
  cacheInvalidationPattern: string
): Promise<T> {
  const result = await apiRequest<T>(endpoint, options, { skipCache: true });
  // Invalider le cache après une mutation réussie
  apiCache.invalidate(cacheInvalidationPattern);
  return result;
}

// Video API endpoints
export const videoApi = {
  // GET /api/video/videos/
  list: async (params: VideoQueryParams = {}): Promise<VideoSchema[]> => {
    const queryString = buildQueryString(params);
    return apiRequest<VideoSchema[]>(`/api/video/videos/${queryString}`, {}, { ttl: CACHE_TTL.MEDIUM });
  },

  // POST /api/video/videos/
  create: async (video: VideoSchema): Promise<VideoSchema> => {
    return mutationRequest<VideoSchema>('/api/video/videos/', {
      method: 'POST',
      body: JSON.stringify(video),
    }, '/api/video/videos');
  },

  // GET /api/video/videos/count
  count: async (params: Omit<VideoQueryParams, 'limit' | 'sort_by' | 'sort_order'> = {}): Promise<CountResponse> => {
    const queryString = buildQueryString(params);
    return apiRequest<CountResponse>(`/api/video/videos/count${queryString}`, {}, { ttl: CACHE_TTL.SHORT });
  },

  // GET /api/video/videos/{item_id}
  get: async (itemId: number): Promise<VideoSchema> => {
    return apiRequest<VideoSchema>(`/api/video/videos/${itemId}`, {}, { ttl: CACHE_TTL.MEDIUM });
  },

  // PUT /api/video/videos/{item_id}
  update: async (itemId: number, video: VideoSchema): Promise<VideoSchema> => {
    return mutationRequest<VideoSchema>(`/api/video/videos/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(video),
    }, '/api/video/videos');
  },

  // PATCH /api/video/videos/{item_id}
  patch: async (itemId: number, updates: VideoUpdateSchema): Promise<VideoSchema> => {
    return mutationRequest<VideoSchema>(`/api/video/videos/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }, '/api/video/videos');
  },

  // DELETE /api/video/videos/{item_id}
  delete: async (itemId: number): Promise<void> => {
    return mutationRequest<void>(`/api/video/videos/${itemId}`, {
      method: 'DELETE',
    }, '/api/video/videos');
  },
};

// Channel API endpoints
export const channelApi = {
  // GET /api/video/channels/
  list: async (params: ChannelQueryParams = {}): Promise<ChannelSchema[]> => {
    const queryString = buildQueryString(params);
    return apiRequest<ChannelSchema[]>(`/api/video/channels/${queryString}`, {}, { ttl: CACHE_TTL.MEDIUM });
  },

  // POST /api/video/channels/
  create: async (channel: ChannelSchema): Promise<ChannelSchema> => {
    return mutationRequest<ChannelSchema>('/api/video/channels/', {
      method: 'POST',
      body: JSON.stringify(channel),
    }, '/api/video/channels');
  },

  // GET /api/video/channels/count
  count: async (params: Omit<ChannelQueryParams, 'limit' | 'sort_by' | 'sort_order'> = {}): Promise<CountResponse> => {
    const queryString = buildQueryString(params);
    return apiRequest<CountResponse>(`/api/video/channels/count${queryString}`, {}, { ttl: CACHE_TTL.SHORT });
  },

  // GET /api/video/channels/{item_id}
  get: async (itemId: number): Promise<ChannelSchema> => {
    return apiRequest<ChannelSchema>(`/api/video/channels/${itemId}`, {}, { ttl: CACHE_TTL.MEDIUM });
  },

  // PUT /api/video/channels/{item_id}
  update: async (itemId: number, channel: ChannelSchema): Promise<ChannelSchema> => {
    return mutationRequest<ChannelSchema>(`/api/video/channels/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(channel),
    }, '/api/video/channels');
  },

  // PATCH /api/video/channels/{item_id}
  patch: async (itemId: number, updates: ChannelUpdateSchema): Promise<ChannelSchema> => {
    return mutationRequest<ChannelSchema>(`/api/video/channels/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }, '/api/video/channels');
  },

  // DELETE /api/video/channels/{item_id}
  delete: async (itemId: number): Promise<void> => {
    return mutationRequest<void>(`/api/video/channels/${itemId}`, {
      method: 'DELETE',
    }, '/api/video/channels');
  },
};

// Playlist API endpoints
export const playlistApi = {
  // GET /api/video/playlists/
  list: async (params: PlaylistQueryParams = {}): Promise<PlaylistSchema[]> => {
    const queryString = buildQueryString(params);
    return apiRequest<PlaylistSchema[]>(`/api/video/playlists/${queryString}`, {}, { ttl: CACHE_TTL.MEDIUM });
  },

  // POST /api/video/playlists/
  create: async (playlist: PlaylistSchema): Promise<PlaylistSchema> => {
    return mutationRequest<PlaylistSchema>('/api/video/playlists/', {
      method: 'POST',
      body: JSON.stringify(playlist),
    }, '/api/video/playlists');
  },

  // GET /api/video/playlists/count
  count: async (params: Omit<PlaylistQueryParams, 'limit' | 'sort_by' | 'sort_order'> = {}): Promise<CountResponse> => {
    const queryString = buildQueryString(params);
    return apiRequest<CountResponse>(`/api/video/playlists/count${queryString}`, {}, { ttl: CACHE_TTL.SHORT });
  },

  // GET /api/video/playlists/{item_id}
  get: async (itemId: number): Promise<PlaylistSchema> => {
    return apiRequest<PlaylistSchema>(`/api/video/playlists/${itemId}`, {}, { ttl: CACHE_TTL.MEDIUM });
  },

  // PUT /api/video/playlists/{item_id}
  update: async (itemId: number, playlist: PlaylistSchema): Promise<PlaylistSchema> => {
    return mutationRequest<PlaylistSchema>(`/api/video/playlists/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(playlist),
    }, '/api/video/playlists');
  },

  // PATCH /api/video/playlists/{item_id}
  patch: async (itemId: number, updates: PlaylistUpdateSchema): Promise<PlaylistSchema> => {
    return mutationRequest<PlaylistSchema>(`/api/video/playlists/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }, '/api/video/playlists');
  },

  // DELETE /api/video/playlists/{item_id}
  delete: async (itemId: number): Promise<void> => {
    return mutationRequest<void>(`/api/video/playlists/${itemId}`, {
      method: 'DELETE',
    }, '/api/video/playlists');
  },
};

// Music Channel API endpoints
export const musicChannelApi = {
  // GET /api/music/channels/
  list: async (params: MusicChannelQueryParams = {}): Promise<MusicChannelSchema[]> => {
    const queryString = buildQueryString(params);
    return apiRequest<MusicChannelSchema[]>(`/api/music/channels/${queryString}`, {}, { ttl: CACHE_TTL.MEDIUM });
  },

  // POST /api/music/channels/
  create: async (channel: MusicChannelSchema): Promise<MusicChannelSchema> => {
    return mutationRequest<MusicChannelSchema>('/api/music/channels/', {
      method: 'POST',
      body: JSON.stringify(channel),
    }, '/api/music/channels');
  },

  // GET /api/music/channels/count
  count: async (params: Omit<MusicChannelQueryParams, 'limit' | 'sort_by' | 'sort_order'> = {}): Promise<CountResponse> => {
    const queryString = buildQueryString(params);
    return apiRequest<CountResponse>(`/api/music/channels/count${queryString}`, {}, { ttl: CACHE_TTL.SHORT });
  },

  // GET /api/music/channels/{item_id}
  get: async (itemId: number): Promise<MusicChannelSchema> => {
    return apiRequest<MusicChannelSchema>(`/api/music/channels/${itemId}`, {}, { ttl: CACHE_TTL.MEDIUM });
  },

  // PUT /api/music/channels/{item_id}
  update: async (itemId: number, channel: MusicChannelSchema): Promise<MusicChannelSchema> => {
    return mutationRequest<MusicChannelSchema>(`/api/music/channels/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(channel),
    }, '/api/music/channels');
  },

  // PATCH /api/music/channels/{item_id}
  patch: async (itemId: number, updates: MusicChannelUpdateSchema): Promise<MusicChannelSchema> => {
    return mutationRequest<MusicChannelSchema>(`/api/music/channels/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }, '/api/music/channels');
  },

  // DELETE /api/music/channels/{item_id}
  delete: async (itemId: number): Promise<void> => {
    return mutationRequest<void>(`/api/music/channels/${itemId}`, {
      method: 'DELETE',
    }, '/api/music/channels');
  },
};

// Music Releases API
export const musicReleaseApi = {
  // GET /api/music/releases/
  list: async (params: MusicReleaseQueryParams = {}): Promise<ReleaseSchema[]> => {
    const queryString = buildQueryString(params);
    return apiRequest<ReleaseSchema[]>(`/api/music/releases/${queryString}`, {}, { ttl: CACHE_TTL.MEDIUM });
  },

  // POST /api/music/releases/
  create: async (release: ReleaseSchema): Promise<ReleaseSchema> => {
    return mutationRequest<ReleaseSchema>('/api/music/releases/', {
      method: 'POST',
      body: JSON.stringify(release),
    }, '/api/music/releases');
  },

  // GET /api/music/releases/count
  count: async (params: Omit<MusicReleaseQueryParams, 'limit' | 'sort_by' | 'sort_order'> = {}): Promise<CountResponse> => {
    const queryString = buildQueryString(params);
    return apiRequest<CountResponse>(`/api/music/releases/count${queryString}`, {}, { ttl: CACHE_TTL.SHORT });
  },

  // GET /api/music/releases/{item_id}
  get: async (itemId: number): Promise<ReleaseSchema> => {
    return apiRequest<ReleaseSchema>(`/api/music/releases/${itemId}`, {}, { ttl: CACHE_TTL.MEDIUM });
  },

  // PUT /api/music/releases/{item_id}
  update: async (itemId: number, release: ReleaseSchema): Promise<ReleaseSchema> => {
    return mutationRequest<ReleaseSchema>(`/api/music/releases/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(release),
    }, '/api/music/releases');
  },

  // PATCH /api/music/releases/{item_id}
  patch: async (itemId: number, updates: ReleaseUpdateSchema): Promise<ReleaseSchema> => {
    return mutationRequest<ReleaseSchema>(`/api/music/releases/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }, '/api/music/releases');
  },

  // DELETE /api/music/releases/{item_id}
  delete: async (itemId: number): Promise<void> => {
    return mutationRequest<void>(`/api/music/releases/${itemId}`, {
      method: 'DELETE',
    }, '/api/music/releases');
  },
};

// Music Videos API
export const musicVideoApi = {
  // GET /api/music/videos/
  list: async (params: MusicVideoQueryParams = {}): Promise<MusicVideoSchema[]> => {
    const queryString = buildQueryString(params);
    return apiRequest<MusicVideoSchema[]>(`/api/music/videos/${queryString}`, {}, { ttl: CACHE_TTL.MEDIUM });
  },

  // POST /api/music/videos/
  create: async (video: MusicVideoSchema): Promise<MusicVideoSchema> => {
    return mutationRequest<MusicVideoSchema>('/api/music/videos/', {
      method: 'POST',
      body: JSON.stringify(video),
    }, '/api/music/videos');
  },

  // GET /api/music/videos/count
  count: async (params: Omit<MusicVideoQueryParams, 'limit' | 'sort_by' | 'sort_order'> = {}): Promise<CountResponse> => {
    const queryString = buildQueryString(params);
    return apiRequest<CountResponse>(`/api/music/videos/count${queryString}`, {}, { ttl: CACHE_TTL.SHORT });
  },

  // GET /api/music/videos/{item_id}
  get: async (itemId: number): Promise<MusicVideoSchema> => {
    return apiRequest<MusicVideoSchema>(`/api/music/videos/${itemId}`, {}, { ttl: CACHE_TTL.MEDIUM });
  },

  // PUT /api/music/videos/{item_id}
  update: async (itemId: number, video: MusicVideoSchema): Promise<MusicVideoSchema> => {
    return mutationRequest<MusicVideoSchema>(`/api/music/videos/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(video),
    }, '/api/music/videos');
  },

  // PATCH /api/music/videos/{item_id}
  patch: async (itemId: number, updates: MusicVideoUpdateSchema): Promise<MusicVideoSchema> => {
    return mutationRequest<MusicVideoSchema>(`/api/music/videos/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }, '/api/music/videos');
  },

  // DELETE /api/music/videos/{item_id}
  delete: async (itemId: number): Promise<void> => {
    return mutationRequest<void>(`/api/music/videos/${itemId}`, {
      method: 'DELETE',
    }, '/api/music/videos');
  },
};

// Music Playlists API
export const musicPlaylistApi = {
  // GET /api/music/playlists/
  list: async (params: PlaylistQueryParams = {}): Promise<PlaylistSchema[]> => {
    const queryString = buildQueryString(params);
    return apiRequest<PlaylistSchema[]>(`/api/music/playlists/${queryString}`, {}, { ttl: CACHE_TTL.MEDIUM });
  },

  // POST /api/music/playlists/
  create: async (playlist: PlaylistSchema): Promise<PlaylistSchema> => {
    return mutationRequest<PlaylistSchema>('/api/music/playlists/', {
      method: 'POST',
      body: JSON.stringify(playlist),
    }, '/api/music/playlists');
  },

  // GET /api/music/playlists/count
  count: async (params: Omit<PlaylistQueryParams, 'limit' | 'sort_by' | 'sort_order'> = {}): Promise<CountResponse> => {
    const queryString = buildQueryString(params);
    return apiRequest<CountResponse>(`/api/music/playlists/count${queryString}`, {}, { ttl: CACHE_TTL.SHORT });
  },

  // GET /api/music/playlists/{item_id}
  get: async (itemId: number): Promise<PlaylistSchema> => {
    return apiRequest<PlaylistSchema>(`/api/music/playlists/${itemId}`, {}, { ttl: CACHE_TTL.MEDIUM });
  },

  // PUT /api/music/playlists/{item_id}
  update: async (itemId: number, playlist: PlaylistSchema): Promise<PlaylistSchema> => {
    return mutationRequest<PlaylistSchema>(`/api/music/playlists/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(playlist),
    }, '/api/music/playlists');
  },

  // PATCH /api/music/playlists/{item_id}
  patch: async (itemId: number, updates: PlaylistUpdateSchema): Promise<PlaylistSchema> => {
    return mutationRequest<PlaylistSchema>(`/api/music/playlists/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }, '/api/music/playlists');
  },

  // DELETE /api/music/playlists/{item_id}
  delete: async (itemId: number): Promise<void> => {
    return mutationRequest<void>(`/api/music/playlists/${itemId}`, {
      method: 'DELETE',
    }, '/api/music/playlists');
  },
};

// Combined API object for easier imports
export const api = {
  videos: videoApi,
  channels: channelApi,
  playlists: playlistApi,
  musicChannels: musicChannelApi,
  musicReleases: musicReleaseApi,
  musicVideos: musicVideoApi,
  musicPlaylists: musicPlaylistApi,
};

export default api;