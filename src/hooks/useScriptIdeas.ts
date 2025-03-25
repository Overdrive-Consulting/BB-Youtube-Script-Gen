import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScriptIdea, AudienceProfile } from '@/types/scriptPipeline';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

// Function to generate UUID v4
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper function to safely parse target_audiences
const parseTargetAudiences = (audiences: string | string[] | null): string[] => {
  if (!audiences) return [];
  
  // If already an array, return it
  if (Array.isArray(audiences)) return audiences;
  
  // If it's a string, try to parse it as JSON if it starts with [ or {
  if (typeof audiences === 'string') {
    if (audiences.trim().startsWith('[') || audiences.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(audiences);
        return Array.isArray(parsed) ? parsed : [audiences];
      } catch (e) {
        console.log('Not valid JSON, treating as a single audience:', audiences);
        return [audiences];
      }
    }
    // If it's just a plain string, return it as a single-item array
    return [audiences];
  }
  
  return [];
};

export const useScriptIdeas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up Supabase real-time subscription
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for script ideas');
    
    // Subscribe to changes on video_generator_script_pipeline table
    const subscription = supabase
      .channel('video_generator_script_pipeline-changes')
      .on('postgres_changes', {
        event: '*', // Listen for inserts, updates, and deletes
        schema: 'public',
        table: 'video_generator_script_pipeline'
      }, (payload) => {
        console.log('Received real-time update:', payload);
        
        // Get the current script ideas from the cache
        const currentScriptIdeas = queryClient.getQueryData<ScriptIdea[]>(['scriptIdeas']);
        
        if (currentScriptIdeas) {
          let updatedScriptIdeas: ScriptIdea[];
          
          if (payload.eventType === 'INSERT') {
            // Add the new idea to the list (at the beginning since it's newest)
            updatedScriptIdeas = [payload.new as ScriptIdea, ...currentScriptIdeas];
          } else if (payload.eventType === 'UPDATE') {
            // Replace the updated idea in the list
            const newRecord = payload.new as ScriptIdea;
            const oldRecord = payload.old as ScriptIdea;
            
            updatedScriptIdeas = currentScriptIdeas.map(idea => 
              idea.id === newRecord.id ? newRecord : idea
            );
            
            // Show notifications for important updates
            if (newRecord.generated_thumbnail && !oldRecord.generated_thumbnail) {
              toast.success('Thumbnail generated successfully');
            }
            
            if (newRecord.generated_script_link && !oldRecord.generated_script_link) {
              toast.success('Script generated successfully');
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove the deleted idea from the list
            updatedScriptIdeas = currentScriptIdeas.filter(
              idea => idea.id !== (payload.old as ScriptIdea).id
            );
          } else {
            // For other events, just invalidate the query
            queryClient.invalidateQueries({ queryKey: ['scriptIdeas'] });
            return;
          }
          
          // Update the cache directly
          queryClient.setQueryData(['scriptIdeas'], updatedScriptIdeas);
        } else {
          // If we don't have the data in cache, invalidate to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ['scriptIdeas'] });
        }
      })
      .subscribe();

    // Clean up subscription when component unmounts
    return () => {
      console.log('Cleaning up real-time subscription');
      subscription.unsubscribe();
    };
  }, [queryClient, user]);

  const fetchScriptIdeas = async (): Promise<ScriptIdea[]> => {
    console.log('Fetching all script ideas from database');
    
    const { data, error } = await supabase
      .from('video_generator_script_pipeline')
      .select('*')
      .order('created_at', { ascending: false }); // Sort by created_at timestamp, newest first
    
    if (error) {
      console.error('Error fetching script ideas:', error);
      toast.error('Failed to load script ideas');
      throw error;
    }
    
    // Process the data to sort items appropriately
    if (data) {
      // Data is already sorted by created_at timestamp from the database query
      console.log('Script ideas fetched and sorted:', data);
      console.log('Number of script ideas:', data.length || 0);
      return data;
    }
    
    return [];
  };

  const { data: scriptIdeas = [], isLoading, error } = useQuery({
    queryKey: ['scriptIdeas'],
    queryFn: fetchScriptIdeas,
    // Only enable the query when a user is logged in
    enabled: !!user,
  });

  const addScriptIdea = useMutation({
    mutationFn: async (newIdea: Omit<ScriptIdea, 'id'>) => {
      if (!user) throw new Error('User not authenticated');

      // Generate a new UUID for the id field
      const id = uuidv4();
      
      // Format the target_duration with "mins" suffix if it's a number
      let formattedDuration = newIdea.target_duration;
      if (formattedDuration && !isNaN(Number(formattedDuration))) {
        formattedDuration = `${formattedDuration} mins`;
      }

      // Ensure target_audiences is a plain string, not an array
      let targetAudience = newIdea.target_audiences;
      if (Array.isArray(targetAudience) && targetAudience.length === 1) {
        targetAudience = targetAudience[0];
      }
      
      // If it's still a JSON string, parse it and convert to string
      if (typeof targetAudience === 'string' && 
          (targetAudience.startsWith('[') || targetAudience.startsWith('{'))) {
        try {
          const parsed = JSON.parse(targetAudience);
          if (Array.isArray(parsed) && parsed.length > 0) {
            targetAudience = parsed[0];
          }
        } catch (e) {
          console.log('Not valid JSON, using as is:', targetAudience);
        }
      }

      // Ensure status is set with a default value if it's missing
      const status = newIdea.status || 'Idea Submitted';

      // Map the incoming data to match the database schema
      const dataToInsert = {
        id, // Include the generated UUID
        title: newIdea.title,
        description: newIdea.description || '',
        target_duration: formattedDuration,
        account: newIdea.account,
        status, // Use the status from above
        user_id: user.id,
        target_audiences: targetAudience, // Store as a plain string
        created_at: new Date().toISOString(), // Add creation timestamp
        // Include other optional fields if they exist
        ...(newIdea.generated_title && { generated_title: newIdea.generated_title }),
        ...(newIdea.generated_script_link && { generated_script_link: newIdea.generated_script_link }),
        ...(newIdea.generated_thumbnail_prompt && { generated_thumbnail_prompt: newIdea.generated_thumbnail_prompt }),
        ...(newIdea.publish_date && { publish_date: newIdea.publish_date }),
        ...(newIdea.notes && { notes: newIdea.notes }),
        ...(newIdea.video_type && { video_type: newIdea.video_type }),
        ...(newIdea.age_group && { age_group: newIdea.age_group }),
        ...(newIdea.gender && { gender: newIdea.gender })
      };

      console.log('Adding script idea with formatted data:', dataToInsert);
      
      const { data, error } = await supabase
        .from('video_generator_script_pipeline')
        .insert(dataToInsert)
        .select();

      if (error) {
        console.error('Error adding script idea:', error);
        toast.error('Failed to add script idea');
        throw error;
      }

      console.log('Script idea added successfully:', data);
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scriptIdeas'] });
      toast.success('New idea added successfully');
    },
  });

  const updateScriptIdea = useMutation({
    mutationFn: async (updatedIdea: Partial<ScriptIdea> & { id: string }) => {
      const { id, age_group, gender, ...rest } = updatedIdea;
      
      // Define a type that includes created_at for our dataToUpdate object
      type UpdateData = typeof rest & { created_at?: string };
      
      // Format the target_duration with "mins" suffix if it's just a number
      let dataToUpdate: UpdateData = { ...rest };
      if (rest.target_duration !== undefined) {
        let formattedDuration = rest.target_duration;
        if (formattedDuration && !isNaN(Number(formattedDuration)) && !formattedDuration.includes("mins")) {
          dataToUpdate.target_duration = `${formattedDuration} mins`;
        }
      }

      // Process target_audiences - convert array to string
      if (dataToUpdate.target_audiences !== undefined) {
        if (Array.isArray(dataToUpdate.target_audiences) && dataToUpdate.target_audiences.length === 1) {
          dataToUpdate.target_audiences = dataToUpdate.target_audiences[0];
        }
      }

      // If status is changing to "Content Generated", update the created_at to now to make it appear first
      if (dataToUpdate.status === "Content Generated") {
        const { data: existingData } = await supabase
          .from('video_generator_script_pipeline')
          .select('status')
          .eq('id', id)
          .single();
          
        if (existingData && existingData.status === "Idea Submitted") {
          // Only update created_at when moving from Idea Submitted to Content Generated
          dataToUpdate.created_at = new Date().toISOString();
        }
      }

      // Log what we're sending to the database (excluding age_group and gender)
      console.log('Updating script idea with data:', { id, ...dataToUpdate });

      const { data, error } = await supabase
        .from('video_generator_script_pipeline')
        .update(dataToUpdate)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating script idea:', error);
        toast.error('Failed to update script idea');
        throw error;
      }

      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scriptIdeas'] });
    },
  });

  const deleteScriptIdea = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('video_generator_script_pipeline')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting script idea:', error);
        toast.error('Failed to delete script idea');
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scriptIdeas'] });
      toast.success('Idea deleted successfully');
    },
  });

  return {
    scriptIdeas,
    isLoading,
    error,
    addScriptIdea,
    updateScriptIdea,
    deleteScriptIdea,
    parseTargetAudiences
  };
};

// Add a new hook to fetch accounts
export const useAccounts = () => {
  const fetchAccounts = async () => {
    console.log('Fetching all accounts from database');
    
    // Explicitly log the query we're about to make
    console.log('Querying accounts_settings table...');
    
    const { data, error } = await supabase
      .from('accounts_settings')
      .select('id, channel_id, target_audiences, channel_url, status');
    
    if (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
    
    console.log('Accounts fetched:', data);
    return data || [];
  };

  return useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  });
};
