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

// Add loading phases configuration
const IDEA_GENERATION_PHASES = [
  { message: "Analyzing channel content...", duration: 5000 },
  { message: "Extracting key themes...", duration: 5000 },
  { message: "Crafting unique idea...", duration: 5000 }
];

const SCRIPT_GENERATION_PHASES = [
  { message: "Analyzing reference content...", duration: 20000 },
  { message: "Developing narrative structure...", duration: 20000 },
  { message: "Writing detailed script...", duration: 20000 },
  { message: "Finalizing and formatting...", duration: 20000 }
];

// Add a CountdownTimer component at the top of the file
const CountdownTimer: React.FC<{ seconds: number }> = ({ seconds }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-1 mt-1 w-full">
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div 
          className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000"
          style={{ 
            width: `${(timeLeft / seconds) * 100}%`,
            transform: 'translateX(0)' // Ensure the bar starts from the left
          }}
        />
      </div>
      <div className="text-xs text-gray-500">
        {timeLeft}s remaining...
      </div>
    </div>
  );
};

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

  // Track items that are generating scripts and ideas
  const [generatingScripts, setGeneratingScripts] = useState<Set<string>>(new Set());
  const [generatingIdeas, setGeneratingIdeas] = useState<{
    pending: boolean;
    toastId?: string;
  }>({
    pending: false
  });

  // Polling mechanism to check for updates on generating items
  useEffect(() => {
    // Don't poll if no items are generating
    if (generatingScripts.size === 0 && !generatingIdeas.pending) return;
    
    console.log(`Polling for ${generatingScripts.size} generating scripts and ${generatingIdeas.pending ? 'pending idea' : 'no ideas'}`);
    
    // Function to check for updates
    const checkForUpdates = async () => {
      try {
        // For script updates
        if (generatingScripts.size > 0) {
          console.log('Checking for script updates...', Array.from(generatingScripts));
          const { data: scriptData, error: scriptError } = await supabase
            .from('video_generator_script_pipeline')
            .select('*')
            .in('id', Array.from(generatingScripts))
            .eq('status', 'Content Generated');
          
          if (scriptError) {
            console.error('Error checking for script updates:', scriptError);
            return;
          }
          
          // Check for completed scripts
          scriptData?.forEach(item => {
            console.log('Checking script:', item.id, item.status, item.generated_script_link);
            if (item.status === 'Content Generated' && item.generated_script_link) {
              // Remove from generating scripts
              setGeneratingScripts(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
              });
              // Show success message
              toast.success(`Script for "${item.title}" is now ready!`);
              // Force a refresh of the script ideas data
              queryClient.invalidateQueries({ queryKey: ['scriptIdeas'] });
            }
          });
        }

        // For idea updates - check for new records with status "Idea Submitted"
        if (generatingIdeas.pending) {
          console.log('Checking for new ideas...');
          const { data: ideaData, error: ideaError } = await supabase
            .from('video_generator_script_pipeline')
            .select('*')
            .eq('status', 'Idea Submitted')  // Changed from 'Idea Generation' to 'Idea Submitted'
            .order('created_at', { ascending: false })
            .limit(5);  // Limit to most recent ideas
          
          if (ideaError) {
            console.error('Error checking for idea updates:', ideaError);
            return;
          }
          
          // Check for completed ideas
          ideaData?.forEach(item => {
            console.log('Checking idea:', item.id, item.status, item.title);
            // Check if this is a newly created idea (within last minute)
            const createdAt = new Date(item.created_at);
            const isRecent = (Date.now() - createdAt.getTime()) < 60000; // Within last minute

            if (isRecent && item.title && item.description) {
              // Dismiss the specific toast we've been tracking
              if (generatingIdeas.toastId) {
                toast.dismiss(generatingIdeas.toastId);
              }
              // Show success message
              toast.success(`New idea "${item.title}" has been generated!`);
              // Reset generating ideas state
              setGeneratingIdeas({
                pending: false,
                toastId: undefined
              });
              // Force a refresh of the script ideas data
              queryClient.invalidateQueries({ queryKey: ['scriptIdeas'] });
            }
          });
        }
      } catch (err) {
        console.error('Error in polling mechanism:', err);
      }
    };
    
    // Set up polling interval - check every 5 seconds
    const intervalId = setInterval(checkForUpdates, 5000);
    
    // Run an initial check immediately
    checkForUpdates();
    
    // Cleanup function
    return () => clearInterval(intervalId);
  }, [generatingScripts, generatingIdeas, queryClient]);

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

  // Function to show phased loading toast
  const showPhasedLoadingToast = (phases: typeof IDEA_GENERATION_PHASES, toastId: string) => {
    let currentPhase = 0;
    
    // Show initial toast
    toast.loading(phases[0].message, {
      id: toastId,
      duration: Infinity // Keep the toast until we dismiss it
    });

    // Function to update toast with next phase
    const updateToast = () => {
      currentPhase++;
      if (currentPhase < phases.length) {
        toast.loading(phases[currentPhase].message, {
          id: toastId
        });
      }
    };

    // Schedule updates for each phase
    phases.forEach((phase, index) => {
      if (index < phases.length - 1) {
        setTimeout(updateToast, phase.duration);
      }
    });
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
    const toastId = 'idea-generation-' + Date.now();

    try {
      // Parse the payload
      const payload = JSON.parse(payloadString);

      // Add a pending flag and toastId to indicate we're waiting for a new idea
      setGeneratingIdeas({
        pending: true,
        toastId: toastId
      });

      // Show phased loading toast for idea generation (15s total)
      const phases = [
        { message: "Analyzing channel content...", duration: 5000 },
        { message: "Extracting key themes...", duration: 5000 },
        { message: "Crafting unique idea...", duration: 5000 }
      ];

      // Total duration in seconds
      const totalDurationSeconds = phases.reduce((sum, phase) => sum + phase.duration, 0) / 1000;

      // Show initial toast with countdown
      toast.loading(
        <div className="w-full">
          {phases[0].message}
          <CountdownTimer seconds={totalDurationSeconds} />
        </div>,
        {
          id: toastId,
          duration: Infinity
        }
      );

      // Function to update toast with next phase
      const updateToast = (index: number, secondsLeft: number) => {
        if (index < phases.length) {
          toast.loading(
            <div className="w-full">
              {phases[index].message}
              <CountdownTimer seconds={secondsLeft} />
            </div>,
            {
              id: toastId
            }
          );
        }
      };

      // Schedule updates for each phase
      phases.forEach((phase, index) => {
        if (index > 0) {
          const timeUntilPhase = phases.slice(0, index).reduce((sum, p) => sum + p.duration, 0);
          const secondsLeftAtPhase = totalDurationSeconds - (timeUntilPhase / 1000);
          setTimeout(() => updateToast(index, secondsLeftAtPhase), timeUntilPhase);
        }
      });

      // Set a timeout to dismiss the toast after all phases complete (15 seconds)
      setTimeout(() => {
        toast.dismiss(toastId);
      }, totalDurationSeconds * 1000);

      // Send the webhook request with all account details
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to send request to webhook');
      }

      setGenerateDialogOpen(false);
      
    } catch (error) {
      console.error('Error triggering idea generation:', error);
      // Remove the pending flag if there's an error
      setGeneratingIdeas({
        pending: false,
        toastId: undefined
      });
      // Dismiss the loading toast and show error
      toast.dismiss(toastId);
      toast.error('Failed to start idea generation');
    }
  };

  // Handle generating script with AI
  const handleGenerateScript = async (idea: ScriptIdea, event: React.MouseEvent) => {
    event.stopPropagation();
    const toastId = 'script-generation-' + idea.id;

    try {
      // First send the data to the webhook
      const webhookSuccess = await sendToWebhook(idea);
      if (!webhookSuccess) {
        throw new Error('Failed to send data to webhook');
      }

      // Add this item to the set of generating scripts
      setGeneratingScripts(prev => new Set(prev).add(idea.id));

      // Total duration in seconds (1 minute 20 seconds)
      const totalDurationSeconds = 80;

      // Show initial toast with countdown
      toast.loading(
        <div className="w-full">
          {SCRIPT_GENERATION_PHASES[0].message}
          <CountdownTimer seconds={totalDurationSeconds} />
        </div>,
        {
          id: toastId,
          duration: Infinity
        }
      );

      // Function to update toast with next phase
      const updateToast = (index: number, secondsLeft: number) => {
        if (index < SCRIPT_GENERATION_PHASES.length) {
          toast.loading(
            <div className="w-full">
              {SCRIPT_GENERATION_PHASES[index].message}
              <CountdownTimer seconds={secondsLeft} />
            </div>,
            {
              id: toastId
            }
          );
        }
      };

      // Schedule updates for each phase
      SCRIPT_GENERATION_PHASES.forEach((phase, index) => {
        if (index > 0) {
          const timeUntilPhase = SCRIPT_GENERATION_PHASES.slice(0, index).reduce((sum, p) => sum + p.duration, 0);
          const secondsLeftAtPhase = totalDurationSeconds - (timeUntilPhase / 1000);
          setTimeout(() => updateToast(index, secondsLeftAtPhase), timeUntilPhase);
        }
      });

      // Set a timeout to dismiss the toast after all phases complete (80 seconds)
      setTimeout(() => {
        toast.dismiss(toastId);
      }, totalDurationSeconds * 1000);

      // Update the status to "Content Generated"
      await updateScriptIdea.mutateAsync({
        id: idea.id,
        status: 'Content Generated'
      });
      
    } catch (error) {
      console.error('Error generating script:', error);
      // Remove from generating scripts if there's an error
      setGeneratingScripts(prev => {
        const newSet = new Set(prev);
        newSet.delete(idea.id);
        return newSet;
      });
      // Dismiss the loading toast and show error
      toast.dismiss(toastId);
      toast.error('Failed to generate script');
    }
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
            generatingScripts={generatingScripts}
            generatingIdeas={generatingIdeas}
          />
        </TabsContent>
        
        <TabsContent value="list" className="space-y-4">
          <ListView
            scriptIdeas={scriptIdeas}
            onEditIdea={handleEditIdea}
            onDeleteInitiate={handleDeleteInitiate}
            onGenerateScript={handleGenerateScript}
            generatingScripts={generatingScripts}
            generatingIdeas={generatingIdeas}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
