import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import EditScriptIdeaDialog from '@/components/EditScriptIdeaDialog';
import { supabase } from '@/integrations/supabase/client';
import { ScriptIdea, PIPELINE_STAGES } from '@/types/scriptPipeline';
import { useScriptIdeas, useAccounts } from '@/hooks/useScriptIdeas';
import { useAudienceProfiles } from '@/hooks/useAudienceProfiles';
import { useQueryClient } from '@tanstack/react-query';

// Import refactored components
import KanbanView from '@/components/dashboard/KanbanView';
import ListView from '@/components/dashboard/ListView';
import DeleteAlertDialog from '@/components/dashboard/DeleteAlertDialog';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import GenerateIdeaDialog from '@/components/dashboard/GenerateIdeaDialog';

const Dashboard: React.FC = () => {
  // Fetch script ideas and accounts
  const {
    scriptIdeas,
    isLoading,
    addScriptIdea,
    updateScriptIdea,
    deleteScriptIdea
  } = useScriptIdeas();

  // Use the useAccounts hook
  const {
    data: accounts = [],
    isLoading: isLoadingAccounts,
    error: accountsError
  } = useAccounts();

  useEffect(() => {
    if (accountsError) {
      console.error('Error loading accounts:', accountsError);
      toast.error('Failed to load accounts');
    }
  }, [accountsError]);

  // State management
  const [newIdeaDialogOpen, setNewIdeaDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditIdea, setCurrentEditIdea] = useState<ScriptIdea | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  const [draggedIdea, setDraggedIdea] = useState<string | null>(null);
  const [selectedNewAudience, setSelectedNewAudience] = useState<string>('');
  const [audienceData, setAudienceData] = useState<{
    age_group: string;
    gender: string;
  }>({
    age_group: '',
    gender: ''
  });

  // Fetch audience profiles
  const {
    data: newIdeaAudienceProfiles = [],
    isLoading: isLoadingNewAudienceProfile
  } = useAudienceProfiles(selectedNewAudience);

  // Update audience data when profiles change
  useEffect(() => {
    if (newIdeaAudienceProfiles.length > 0) {
      const profile = newIdeaAudienceProfiles[0];

      // Store demographic data separately
      setAudienceData({
        age_group: profile.age_group || '',
        gender: profile.gender || ''
      });
    } else {
      setAudienceData({
        age_group: '',
        gender: ''
      });
    }
  }, [newIdeaAudienceProfiles]);

  // Add state for generate dialog
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  // Get the query client for manual cache updates
  const queryClient = useQueryClient();

  // Track items that are in process of generating
  const [generatingItems, setGeneratingItems] = useState<Set<string>>(new Set());

  // Polling mechanism to check for updates on generating items
  useEffect(() => {
    // Don't poll if no items are generating
    if (generatingItems.size === 0) return;
    
    console.log(`Polling for ${generatingItems.size} generating scripts`);
    
    // Function to check for updates
    const checkForUpdates = async () => {
      try {
        // Get the latest data for all items that are generating
        const { data, error } = await supabase
          .from('video_generator_script_pipeline')
          .select('*')
          .in('id', Array.from(generatingItems));
        
        if (error) {
          console.error('Error checking for updates:', error);
          return;
        }
        
        // Check for completed items
        const completedItems = new Set<string>();
        data?.forEach(item => {
          if (item.generated_script_link) {
            completedItems.add(item.id);
            toast.success(`Script for "${item.title}" is now ready!`);
          }
        });
        
        // Remove completed items from tracking
        if (completedItems.size > 0) {
          setGeneratingItems(prev => {
            const newSet = new Set(prev);
            completedItems.forEach(id => newSet.delete(id));
            return newSet;
          });
          
          // Refresh the script ideas data
          queryClient.invalidateQueries({ queryKey: ['scriptIdeas'] });
        }
      } catch (err) {
        console.error('Error in polling mechanism:', err);
      }
    };
    
    // Set up polling interval - check every 5 seconds
    const intervalId = setInterval(checkForUpdates, 5000);
    
    // Cleanup function
    return () => clearInterval(intervalId);
  }, [generatingItems, queryClient]);

  // Function to send script idea data to webhook
  const sendToWebhook = async (idea: ScriptIdea) => {
    const webhookUrl = "https://hook.us1.make.com/pq9udfdx8dr64r8x0d8b6ndelc3ymps3";
    try {
      // Get the latest data for this specific script idea from Supabase
      const { data, error } = await supabase
        .from('video_generator_script_pipeline')
        .select('*')
        .eq('id', idea.id)
        .single();
      
      if (error) {
        console.error('Error fetching script idea details:', error);
        toast.error('Failed to fetch script details');
        throw error;
      }
      
      if (!data) {
        toast.error('Script idea not found');
        throw new Error('Script idea not found');
      }

      // Check if the title exists
      if (!data.title || data.title.trim() === '') {
        toast.error('Please add a title to this script idea before generating a script');
        return false;
      }

      // Prepare the payload for the webhook including target_audiences
      const payload = {
        id: data.id,
        title: data.title,
        description: data.description,
        target_duration: data.target_duration,
        status: data.status,
        account: data.account,
        target_audiences: data.target_audiences || ''
      };
      
      console.log('Sending payload to webhook:', payload);

      // Send the data to the webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Webhook request failed with status ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error sending data to webhook:', error);
      toast.error('Failed to send data to webhook');
      return false;
    }
  };

  // Handle adding a new idea
  const handleAddIdea = (newIdea: Partial<ScriptIdea>) => {
    if (!newIdea.title || !newIdea.account) {
      toast.error('Please fill out all required fields');
      return;
    }

    // Ensure status is set before passing to addScriptIdea
    const ideaWithStatus = {
      ...newIdea,
      status: newIdea.status || 'Idea Submitted'
    };
    
    addScriptIdea.mutate(ideaWithStatus as Omit<ScriptIdea, 'id'>);
    setNewIdeaDialogOpen(false);
  };

  // Handle generating an idea with AI
  const handleGenerateIdea = async (payloadString: string) => {
    const webhookUrl = "https://hook.us1.make.com/sdaoiwstw6czw7abruthp85qolcmfavq";

    toast.promise(
      (async () => {
        try {
          // Parse the payload
          const payload = JSON.parse(payloadString);

          // Send the webhook request with all account details
          await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          setGenerateDialogOpen(false); // Close the dialog
          return 'Idea generation started';
        } catch (error) {
          console.error('Error triggering idea generation:', error);
          throw new Error('Failed to start idea generation');
        }
      })(),
      {
        loading: 'Starting idea generation...',
        success: (message) => message,
        error: 'Failed to start idea generation'
      }
    );
  };

  // Handle generating script with AI - modified to only update status
  const handleGenerateScript = async (idea: ScriptIdea, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click

    toast.promise((async () => {
      // First send the data to the webhook
      const webhookSuccess = await sendToWebhook(idea);
      if (!webhookSuccess) {
        throw new Error('Failed to send data to webhook');
      }

      // Add this item to the set of generating items
      setGeneratingItems(prev => new Set(prev).add(idea.id));

      // Only update the status to "Content Generated"
      await updateScriptIdea.mutateAsync({
        id: idea.id,
        status: 'Content Generated' // Only update the status
      });
      
      return 'Script request sent successfully. You will be notified when it completes.';
    })(), {
      loading: 'Processing script generation request...',
      success: message => message,
      error: 'Failed to send script generation request'
    });
  };

  // Handle editing an idea
  const handleEditIdea = (idea: ScriptIdea) => {
    setCurrentEditIdea(idea);
    setEditDialogOpen(true);
  };

  // Handle saving edited idea
  const handleSaveEditedIdea = (updatedIdea: ScriptIdea) => {
    updateScriptIdea.mutate(updatedIdea, {
      onSuccess: () => {
        toast.success('Script idea updated successfully');
      }
    });
  };

  // Handle initiating delete process
  const handleDeleteInitiate = (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Stop propagation to prevent card click
    setIdeaToDelete(id);
    setDeleteAlertOpen(true);
  };

  // Handle confirming deletion
  const handleDeleteConfirm = () => {
    if (ideaToDelete) {
      deleteScriptIdea.mutate(ideaToDelete);
      setIdeaToDelete(null);
      setDeleteAlertOpen(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (ideaId: string) => {
    setDraggedIdea(ideaId);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, stageId: string) => {
    e.preventDefault();
    if (draggedIdea) {
      const idea = scriptIdeas.find(idea => idea.id === draggedIdea);
      if (idea && idea.status !== stageId) {
        const dbStatus = PIPELINE_STAGES.find(stage => stage.id === stageId)?.dbStatus;
        if (dbStatus) {
          updateScriptIdea.mutate({
            id: draggedIdea,
            status: dbStatus
          });
          toast.success(`Moved "${idea.title}" to ${PIPELINE_STAGES.find(s => s.id === stageId)?.label}`);
        }
      }
      setDraggedIdea(null);
    }
  };

  if (isLoading || isLoadingAccounts) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Dashboard Header */}
      <DashboardHeader
        accounts={accounts}
        newIdeaDialogOpen={newIdeaDialogOpen}
        setNewIdeaDialogOpen={setNewIdeaDialogOpen}
        onAddIdea={handleAddIdea}
        generateDialogOpen={generateDialogOpen}
        setGenerateDialogOpen={setGenerateDialogOpen}
        onGenerateIdea={handleGenerateIdea}
      />
      
      {/* Edit Dialog */}
      <EditScriptIdeaDialog 
        scriptIdea={currentEditIdea} 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        onSave={handleSaveEditedIdea} 
      />
      
      {/* Delete Alert Dialog */}
      <DeleteAlertDialog
        open={deleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        onCancel={() => setIdeaToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
      
      {/* Tabs for different views */}
      <Tabs defaultValue="kanban" className="space-y-6 w-full">
        <TabsList>
          <TabsTrigger value="kanban">Kanban View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban" className="space-y-4">
          <KanbanView
            scriptIdeas={scriptIdeas}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onEditIdea={handleEditIdea}
            onDeleteInitiate={handleDeleteInitiate}
            onGenerateScript={handleGenerateScript}
          />
        </TabsContent>
        
        <TabsContent value="list" className="space-y-4">
          <ListView
            scriptIdeas={scriptIdeas}
            onEditIdea={handleEditIdea}
            onDeleteInitiate={handleDeleteInitiate}
            onGenerateScript={handleGenerateScript}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
