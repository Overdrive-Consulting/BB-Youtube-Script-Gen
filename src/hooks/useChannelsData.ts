import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Channel {
  id?: string;
  channel_id: string;
  channel_title?: string;
  channel_description?: string;
  channel_avatar_url?: string;
  channel_banner_url?: string;
  subscriber_count?: number;
  view_count?: number;
  video_count?: number;
  channel_published_at?: string;
  channel_location?: string;
  channel_country?: string;
  channel_language?: string;
  channel_history?: string;
  channel_history_updated?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Allow for any additional fields
}

export const useChannelsData = () => {
  const [data, setData] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching channels data from Supabase...');
        
        const { data: channelsData, error, status, statusText } = await supabase
          .from('channels')
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
        
        console.log(`Successfully fetched ${channelsData?.length || 0} channels`);
        setData(channelsData || []);
      } catch (err: any) {
        console.error('Error fetching channels data:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
          details: err.details,
          code: err.code,
        });
        
        let errorMessage = 'Failed to fetch channels data';
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

    fetchChannels();
  }, []);

  return { data, isLoading, error };
}; 