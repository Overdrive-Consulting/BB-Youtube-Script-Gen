import { supabase } from '@/integrations/supabase/client';

type SupabaseTable = 'channels' | 'videos';

/**
 * Checks if a specific table exists in Supabase by attempting to count rows
 * @param tableName Name of the table to check
 * @returns Boolean indicating if the table exists and is accessible
 */
export const checkTableExists = async (tableName: SupabaseTable): Promise<boolean> => {
  try {
    console.log(`Checking if table "${tableName}" exists...`);
    
    // Try to count rows in the table (with a limit of 1)
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      console.error(`Error checking table "${tableName}":`, error);
      return false;
    }
    
    console.log(`Table "${tableName}" exists and has approximately ${count} rows`);
    return true;
  } catch (err) {
    console.error(`Failed to check if table "${tableName}" exists:`, err);
    return false;
  }
}; 