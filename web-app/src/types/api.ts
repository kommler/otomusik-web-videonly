// Generated types from OpenAPI schema

export interface VideoSchema {
  id?: number | null;
  url?: string | null;
  video_name?: string | null;
  duration_seconds?: number | null;
  uploader?: string | null;
  uploader_slug?: string | null;
  file_name?: string | null;
  view_count?: number | null;
  like_count?: number | null;
  description?: string | null;
  published_at?: string | null; // ISO date-time string
  extracted_at?: string | null; // ISO date-time string
  topic?: string | null;
  resolution?: string | null;
  status?: string | null;
  origin?: string | null;
  playlist_id?: string | null;
  playlist_url?: string | null;
  inserted_at?: string | null; // ISO date-time string
  updated_at?: string | null; // ISO date-time string
  downloaded_at?: string | null; // ISO date-time string
  failed_at?: string | null; // ISO date-time string
  file_size?: number | null;
  channel_name?: string | null;
  playlist_index?: number | null;
  oto_channel_id?: number | null;
  title?: string | null;
  duration?: number | null;
  errors?: Record<string, any> | null;
}

export interface VideoUpdateSchema extends VideoSchema {}

export interface ChannelSchema {
  id?: number | null;
  url?: string | null;
  topic?: string | null;
  resolution?: string | null;
  name?: string | null;
  uploader?: string | null;
  status?: string | null;
  inserted_at?: string | null; // ISO date-time string
  updated_at?: string | null; // ISO date-time string
  count_videos?: number | null;
  refreshed_at?: string | null; // ISO date-time string
  channel_extracted_at?: string | null; // ISO date-time string
  channel_follower_count?: number | null;
  channel_id?: string | null;
  channel_slug?: string | null;
  channel_url?: string | null;
  description?: string | null;
  playlist_count?: number | null;
  subscriber_count?: number | null;
  uploader_id?: string | null;
  uploader_url?: string | null;
  video_count?: number | null;
  view_count?: number | null;
  max_videos?: number | null;
  max_age?: number | null;
  scrap_options?: string | null;
  refresh_interval_days?: number | null;
  scraped_at?: string | null; // ISO date-time string
}

export interface ChannelUpdateSchema extends ChannelSchema {}

export interface PlaylistSchema {
  id?: number | null;
  url?: string | null;
  topic?: string | null;
  resolution?: string | null;
  status?: string | null;
  name?: string | null;
  inserted_at?: string | null; // ISO date-time string
  updated_at?: string | null; // ISO date-time string
  current_index?: number | null;
  total_index?: number | null;
  channel_name?: string | null;
  errors?: Record<string, any> | null;
  downloaded_at?: string | null; // ISO date-time string
  channel_extracted_at?: string | null; // ISO date-time string
  channel_follower_count?: number | null;
  channel_id?: string | null;
  channel_slug?: string | null;
  channel_url?: string | null;
  description?: string | null;
  playlist_count?: number | null;
  playlist_id?: string | null;
}

export interface PlaylistUpdateSchema extends PlaylistSchema {}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface CountResponse {
  count?: number; // Simple count format
  [key: string]: number | undefined; // Status-based count format (e.g., PENDING: 30, DOWNLOADED: 2282)
}

// Query parameters for list endpoints
export interface VideoQueryParams {
  status?: string[];
  search?: string;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  id__eq?: number;
  url__ilike?: string;
  url?: string;
  video_name__ilike?: string;
  video_name?: string;
  duration_seconds__eq?: number;
  uploader__ilike?: string;
  uploader?: string;
  uploader_slug__ilike?: string;
  uploader_slug?: string;
  file_name__ilike?: string;
  file_name?: string;
  view_count__eq?: number;
  like_count__eq?: number;
  description__ilike?: string;
  description?: string;
  published_at__eq?: string;
  published_at__isnull?: boolean;
  extracted_at__eq?: string;
  extracted_at__isnull?: boolean;
  topic__ilike?: string;
  topic?: string;
  resolution__ilike?: string;
  resolution?: string;
  status__ilike?: string;
  origin__ilike?: string;
  origin?: string;
  playlist_id__ilike?: string;
  playlist_id?: string;
  playlist_url__ilike?: string;
  playlist_url?: string;
  inserted_at__eq?: string;
  inserted_at__isnull?: boolean;
  updated_at__eq?: string;
  updated_at__isnull?: boolean;
  downloaded_at__eq?: string;
  downloaded_at__isnull?: boolean;
  failed_at__eq?: string;
  failed_at__isnull?: boolean;
  file_size__eq?: number;
  channel_name__ilike?: string;
  channel_name?: string;
  playlist_index__eq?: number;
  oto_channel_id__eq?: number;
  title__ilike?: string;
  title?: string;
  duration__eq?: number;
}

export interface ChannelQueryParams {
  status?: string[];
  search?: string;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  id__eq?: number;
  url__ilike?: string;
  url?: string;
  topic__ilike?: string;
  topic?: string;
  resolution__ilike?: string;
  resolution?: string;
  name__ilike?: string;
  name?: string;
  uploader__ilike?: string;
  uploader?: string;
  status__ilike?: string;
  inserted_at__eq?: string;
  inserted_at__isnull?: boolean;
  updated_at__eq?: string;
  updated_at__isnull?: boolean;
  count_videos__eq?: number;
  refreshed_at__eq?: string;
  refreshed_at__isnull?: boolean;
  channel_extracted_at__eq?: string;
  channel_extracted_at__isnull?: boolean;
  channel_follower_count__eq?: number;
  channel_id__ilike?: string;
  channel_id?: string;
  channel_slug__ilike?: string;
  channel_slug?: string;
  channel_url__ilike?: string;
  channel_url?: string;
  description__ilike?: string;
  description?: string;
  playlist_count__eq?: number;
  subscriber_count__eq?: number;
  uploader_id__ilike?: string;
  uploader_id?: string;
  uploader_url__ilike?: string;
  uploader_url?: string;
  video_count__eq?: number;
  view_count__eq?: number;
  max_videos__eq?: number;
  max_age__eq?: number;
  scrap_options__ilike?: string;
  scrap_options?: string;
  refresh_interval_days__eq?: number;
  scraped_at__eq?: string;
  scraped_at__isnull?: boolean;
}

export interface PlaylistQueryParams {
  status?: string[];
  search?: string;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  id__eq?: number;
  url__ilike?: string;
  url?: string;
  topic__ilike?: string;
  topic?: string;
  resolution__ilike?: string;
  resolution?: string;
  status__ilike?: string;
  name__ilike?: string;
  name?: string;
  inserted_at__eq?: string;
  inserted_at__isnull?: boolean;
  updated_at__eq?: string;
  updated_at__isnull?: boolean;
  current_index__eq?: number;
  total_index__eq?: number;
  channel_name__ilike?: string;
  channel_name?: string;
  downloaded_at__eq?: string;
  downloaded_at__isnull?: boolean;
  channel_extracted_at__eq?: string;
  channel_extracted_at__isnull?: boolean;
  channel_follower_count__eq?: number;
  channel_id__ilike?: string;
  channel_id?: string;
  channel_slug__ilike?: string;
  channel_slug?: string;
  channel_url__ilike?: string;
  channel_url?: string;
  description__ilike?: string;
  description?: string;
  playlist_count__eq?: number;
  playlist_id__ilike?: string;
  playlist_id?: string;
}