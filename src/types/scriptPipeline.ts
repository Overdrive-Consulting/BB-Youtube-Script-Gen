export const PIPELINE_STAGES = [
  { id: 'idea', label: 'Idea Submitted', dbStatus: 'Idea Submitted' },
  { id: 'generated', label: 'Content Generated', dbStatus: 'Content Generated' },
  { id: 'reviewed', label: 'Reviewed', dbStatus: 'Reviewed' },
  { id: 'published', label: 'Scheduled', dbStatus: 'Scheduled' }
];

// This will ensure the VideoUrlType is consistent across the app
export type VideoUrlType = 'video' | 'channel' | string;

export interface ScriptIdea {
  id: string;
  title: string;
  description: string;
  target_duration: string;
  account: string;
  video_type?: string;
  target_audiences?: string; // Will store as a plain string now
  generated_title?: string;
  generated_script_link?: string;
  generated_thumbnail_prompt?: string;
  generated_thumbnail?: string;
  status: string;
  notes?: string;
  publish_date?: string;
  age_group?: string; // Added age_group property
  gender?: string;    // Added gender property
  created_at?: string;
}

export interface AudienceProfile {
  id: string;
  audience_profile_name: string;
  age_group?: string;
  geographic_region?: string;
  gender?: string;
  interests?: string;
  primary_motivation?: string;
  created_at?: string;
  updated_at?: string;
}

// New type for user's own YouTube channel
export interface MyYouTubeChannel {
  id: string;
  name: string;
  url: string;
  status: string;
  description?: string;
  audiences?: ChannelAudience[];
}

// New type for channel audience
export interface ChannelAudience {
  id: string;
  ageGroup: string;
  region: string;
  gender: string;
  interests: string[];
  motivation?: string;
}

// New type for tracked YouTube channels (competitor channels)
export interface TrackedYouTubeChannel {
  id: string;
  name: string;
  url: string;
  subscribers?: number;
  videoCount?: number;
  lastUpdated?: string;
  isTracked: boolean;
}
