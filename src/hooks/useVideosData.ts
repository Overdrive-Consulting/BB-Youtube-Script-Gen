import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Video {
  id?: string;
  video_id: string;
  channel_id?: string;
  video_title?: string;
  video_description?: string;
  video_thumbnail_url?: string;
  video_url?: string;
  video_published_at?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  duration?: string;
  tags?: string;
  category_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Allow for any additional fields
}

export const useVideosData = () => {
  const [data, setData] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching videos data from Supabase...');
        
        const { data: videosData, error, status, statusText } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });
        
        console.log(`Supabase response status: ${status} ${statusText || ''}`);
        
        if (error) {
          console.error('Supabase error details:', {
            message: error.message, 
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        
        console.log(`Successfully fetched ${videosData?.length || 0} videos`);
        setData(videosData || []);
      } catch (err: any) {
        console.error('Error fetching videos data:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
          details: err.details,
          code: err.code,
        });
        
        let errorMessage = 'Failed to fetch videos data';
        if (err.message) {
          errorMessage += `: ${err.message}`;
        }
        if (err.code) {
          errorMessage += ` (Code: ${err.code})`;
        }
        
        setError(new Error(errorMessage));
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return { data, isLoading, error };
}; 