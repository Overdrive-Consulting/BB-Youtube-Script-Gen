
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://pwamqttxjhnydpruxwdh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3YW1xdHR4amhueWRwcnV4d2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMzE0MjgsImV4cCI6MjA1NjYwNzQyOH0.WkJrhv-uPaAHG9shssrfPeQ9L-a7pCL8KKiym8xK9vw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: {
    fetch: (url: RequestInfo | URL, options?: RequestInit) => {
      // Log start of request
      console.log('Supabase request started:', url);
      const startTime = performance.now();
      
      return fetch(url, options).then(response => {
        // Log end of request with timing
        const endTime = performance.now();
        console.log(`Supabase request completed in ${(endTime - startTime).toFixed(2)}ms:`, url, response.status);
        return response;
      });
    }
  }
});

// Add a simple helper to check if Supabase connection is working
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('video_generator_input')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (e) {
    console.error('Supabase connection exception:', e);
    return false;
  }
};

// Let's add a direct check for the tables related to user's own YouTube channels
export const checkChannelTables = async () => {
  console.log('Checking user YouTube channels table...');
  const { data: channels, error: channelsError } = await supabase
    .from('channels')
    .select('*');
  
  console.log('User YouTube channels check result:', { 
    data: channels, 
    count: channels?.length || 0,
    error: channelsError 
  });
  
  console.log('Checking YouTube channel settings table...');
  const { data: accountsSettings, error: accountsError } = await supabase
    .from('accounts_settings')
    .select('*');
  
  console.log('YouTube channel settings check result:', { 
    data: accountsSettings, 
    count: accountsSettings?.length || 0,
    error: accountsError 
  });
  
  console.log('Checking audience profile settings table...');
  const { data: audienceProfiles, error: audienceError } = await supabase
    .from('audience_profile_settings')
    .select('*');
  
  console.log('Audience profiles check result:', { 
    data: audienceProfiles, 
    count: audienceProfiles?.length || 0,
    error: audienceError 
  });
  
  return {
    channels: { 
      data: channels, 
      count: channels?.length || 0,
      error: channelsError 
    },
    accountsSettings: { 
      data: accountsSettings, 
      count: accountsSettings?.length || 0, 
      error: accountsError 
    },
    audienceProfiles: { 
      data: audienceProfiles, 
      count: audienceProfiles?.length || 0, 
      error: audienceError 
    }
  };
};

// Run the check automatically when this module is imported
checkSupabaseConnection().then(isConnected => {
  console.log(`Supabase initial connection check: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
  if (isConnected) {
    checkChannelTables().then(results => {
      console.log('YouTube channel tables check complete:', results);
    });
  }
});
