
import { supabase } from '@/integrations/supabase/client';

export const setupStorage = async () => {
  // Check if avatars bucket exists, if not create it
  const { data: buckets } = await supabase.storage.listBuckets();
  
  if (!buckets?.find(bucket => bucket.name === 'avatars')) {
    const { error } = await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 1024 * 1024 * 2, // 2MB
    });
    
    if (error) {
      console.error('Error creating avatars bucket:', error);
    } else {
      console.log('Created avatars bucket');
    }
  }
};
