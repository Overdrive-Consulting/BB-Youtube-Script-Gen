
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AudienceProfile } from '@/types/scriptPipeline';

export const useAudienceProfiles = (audienceProfileName: string) => {
  return useQuery({
    queryKey: ['audienceProfile', audienceProfileName],
    queryFn: async (): Promise<AudienceProfile[]> => {
      if (!audienceProfileName) return [];

      const { data, error } = await supabase
        .from('audience_profile_settings')
        .select('*')
        .eq('audience_profile_name', audienceProfileName);

      if (error) {
        console.error('Error fetching audience profile:', error);
        throw error;
      }

      // Ensure the returned data matches the AudienceProfile type
      const audienceProfiles: AudienceProfile[] = data ? data.map(item => ({
        id: item.id,
        audience_profile_name: item.audience_profile_name || '',
        age_group: item.age_group || '',
        geographic_region: item.geographic_region || '',
        gender: item.gender || '',
        interests: item.interests || '',
        primary_motivation: item.primary_motivation || '',
        created_at: item.created_at || '',
        updated_at: item.updated_at || ''
      })) : [];

      return audienceProfiles;
    },
    enabled: !!audienceProfileName,
  });
};
