import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Edit, ExternalLink as ExternalLinkIcon, Users as UsersIcon, Youtube, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AudienceProfile } from "@/types/scriptPipeline";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ChannelAudience {
  id: string;
  age_group: string;
  geographic_region: string;
  gender: string;
  interests: string[];
  primary_motivation?: string;
}

interface MyYouTubeChannel {
  id: string;
  name: string;
  url: string;
  status: string;
  description: string;
  audiences: ChannelAudience[];
}

interface Channel {
  channel_id: string;
  channel_name: string;
  channel_url: string;
  channel_description: string;
  is_tracked: string;
}

interface AccountData {
  channel_url: string;
  channel_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  target_audiences?: string;
}

interface AccountUpdateData {
  channel_url: string;
  channel_id: string;
  status: string;
  updated_at: string;
  target_audiences?: string;
}

const youtubeChannelSchema = z.object({
  name: z.string().optional(),
  url: z.string().url({
    message: "Please enter a valid YouTube URL."
  }),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
  audienceProfileId: z.string().optional()
});

const audienceSchema = z.object({
  audience_profile_name: z.string().min(1, "Profile name is required"),
  age_group: z.string().min(1, "Age group is required"),
  geographic_region: z.string().min(1, "Region is required"),
  gender: z.string().min(1, "Gender is required"),
  interests: z.string().min(1, "At least one interest is required"),
  primary_motivation: z.string().optional()
});

const channelAudienceSchema = z.object({
  audienceProfileId: z.string().min(1, {
    message: "Please select a target audience."
  })
});

const AudienceCarousel = ({ audiences, onEdit, onDelete }: {
  audiences: AudienceProfile[];
  onEdit: (audience: AudienceProfile) => void;
  onDelete: (id: string) => void;
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const cardsPerPage = 3;
  const totalPages = Math.ceil(audiences.length / cardsPerPage);
  const [isAnimating, setIsAnimating] = useState(false);

  const nextPage = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const visibleAudiences = audiences.slice(
    currentPage * cardsPerPage,
    (currentPage + 1) * cardsPerPage
  );

  return (
    <div className="relative w-full">
      {totalPages > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-12 top-1/2 transform -translate-y-1/2 z-10"
            onClick={prevPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-12 top-1/2 transform -translate-y-1/2 z-10"
            onClick={nextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}
      <div 
        className="grid grid-cols-3 gap-8 w-full transition-transform duration-500 ease-in-out"
        style={{
          transform: `translateX(-${currentPage * 100}%)`,
        }}
        onTransitionEnd={() => setIsAnimating(false)}
      >
        {visibleAudiences.map((audience) => (
          <Card key={audience.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-slate-200 flex flex-col">
            <CardHeader className="pb-3 space-y-0 pt-4">
              <div className="flex items-start">
                <div className="space-y-1 flex-1 min-w-0">
                  <CardTitle className="flex items-center text-lg">
                    <UsersIcon className="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold leading-none tracking-tight break-words mb-4 mt-4">
                        {audience.audience_profile_name}
                      </h3>
                    </div>
                  </CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-4 space-y-4 flex-1">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {audience.age_group && (
                    <Badge variant="outline" className="text-xs bg-white">
                      {audience.age_group}
                    </Badge>
                  )}
                  {audience.geographic_region && (
                    <Badge variant="outline" className="text-xs bg-white">
                      {audience.geographic_region}
                    </Badge>
                  )}
                  {audience.gender && (
                    <Badge variant="outline" className="text-xs capitalize bg-white">
                      {audience.gender}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {audience.interests && audience.interests.split(',').map((interest) => (
                    <Badge key={interest} variant="secondary" className="text-xs">
                      {interest.trim()}
                    </Badge>
                  ))}
                </div>
                {audience.primary_motivation && (
                  <p className="text-sm text-muted-foreground pt-2">
                    Motivation: {audience.primary_motivation}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="mt-auto pt-2 pb-3 px-4 border-t flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-slate-100"
                onClick={() => onEdit(audience)}
              >
                <Edit className="h-4 w-4 text-slate-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-red-50"
                onClick={() => onDelete(audience.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
        {visibleAudiences.length < cardsPerPage && 
          Array(cardsPerPage - visibleAudiences.length)
            .fill(null)
            .map((_, index) => (
              <div key={`placeholder-${index}`} className="h-0" />
            ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array(totalPages)
            .fill(null)
            .map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentPage === index 
                    ? 'bg-slate-400' 
                    : 'bg-slate-200 hover:bg-slate-300'
                }`}
                onClick={() => {
                  if (!isAnimating) {
                    setIsAnimating(true);
                    setCurrentPage(index);
                  }
                }}
              />
            ))}
        </div>
      )}
    </div>
  );
};

const ChannelCarousel = ({ channels, onEdit, onDelete, onAddAudience, onToggleStatus, audienceProfiles }: {
  channels: MyYouTubeChannel[];
  onEdit: (channel: MyYouTubeChannel) => void;
  onDelete: (id: string) => void;
  onAddAudience: (channel: MyYouTubeChannel) => void;
  onToggleStatus: (id: string, status: string) => void;
  audienceProfiles: AudienceProfile[];
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const cardsPerPage = 3;
  const totalPages = Math.ceil(channels.length / cardsPerPage);

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const visibleChannels = channels.slice(
    currentPage * cardsPerPage,
    (currentPage + 1) * cardsPerPage
  );

  return (
    <div className="relative w-full">
      {totalPages > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-12 top-1/2 transform -translate-y-1/2 z-10"
            onClick={prevPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-12 top-1/2 transform -translate-y-1/2 z-10"
            onClick={nextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}
      <div className="grid grid-cols-3 gap-8 w-full">
        {visibleChannels.map((channel) => (
          <YouTubeChannelCard
            key={channel.id}
            channel={channel}
            onEdit={() => onEdit(channel)}
            onDelete={() => onDelete(channel.id)}
            onAddAudience={() => onAddAudience(channel)}
            onToggleStatus={() => onToggleStatus(channel.id, channel.status)}
            audienceProfiles={audienceProfiles}
          />
        ))}
        {/* Add placeholder cards to maintain grid layout */}
        {visibleChannels.length < cardsPerPage && 
          Array(cardsPerPage - visibleChannels.length)
            .fill(null)
            .map((_, index) => (
              <div key={`placeholder-${index}`} className="h-0" />
            ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array(totalPages)
            .fill(null)
            .map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentPage === index 
                    ? 'bg-slate-400' 
                    : 'bg-slate-200 hover:bg-slate-300'
                }`}
                onClick={() => setCurrentPage(index)}
              />
            ))}
        </div>
      )}
    </div>
  );
};

const ChannelProfiles = () => {
  const queryClient = useQueryClient();
  const [myYouTubeChannels, setMyYouTubeChannels] = useState<MyYouTubeChannel[]>([]);
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<MyYouTubeChannel | null>(null);
  const [isSelectingAudience, setIsSelectingAudience] = useState(false);
  const [currentTab, setCurrentTab] = useState("all");
  
  // New state for audience profiles
  const [isAddingAudience, setIsAddingAudience] = useState(false);
  const [isEditingAudience, setIsEditingAudience] = useState(false);
  const [currentAudience, setCurrentAudience] = useState<AudienceProfile | null>(null);

  const {
    data: accountsSettingsData,
    isLoading: isLoadingAccountsSettings,
    error: accountsSettingsError,
    refetch: refetchAccountsSettings
  } = useQuery({
    queryKey: ["accountsSettings"],
    queryFn: async () => {
      console.log("Fetching accounts_settings data...");
      const {
        data,
        error
      } = await supabase.from("accounts_settings").select("*");
      if (error) {
        console.error("Error fetching accounts_settings:", error);
        throw error;
      }
      console.log("Accounts settings data fetched:", data);
      return data || [];
    },
    staleTime: 0,
    gcTime: 0
  });

  const {
    data: audienceProfiles = [],
    isLoading: isLoadingAudiences,
    error: profilesError,
    refetch: refetchAudienceProfiles
  } = useQuery({
    queryKey: ["audienceProfiles"],
    queryFn: async () => {
      console.log("Fetching audience profiles...");
      const {
        data,
        error
      } = await supabase.from("audience_profile_settings").select("*");
      if (error) {
        console.error("Error fetching audience profiles:", error);
        throw error;
      }
      console.log("Audience profiles fetched:", data);
      return data || [];
    }
  });
  
  useEffect(() => {
    if (profilesError) console.error("Audience profiles query error:", profilesError);
    if (accountsSettingsError) console.error("Accounts settings query error:", accountsSettingsError);
  }, [profilesError, accountsSettingsError]);
  
  useEffect(() => {
    if (accountsSettingsData && audienceProfiles) {
      const transformedChannels: MyYouTubeChannel[] = accountsSettingsData.map(account => {
        const channelId = account.channel_id || account.channel_url.split('/').pop() || '';
        const audiences: ChannelAudience[] = [];
        
        if (account.target_audiences) {
          const audienceProfile = audienceProfiles.find(
            ap => ap.id === account.target_audiences || ap.audience_profile_name === account.target_audiences
          );
          if (audienceProfile) {
            audiences.push({
              id: audienceProfile.id,
              age_group: audienceProfile.age_group || "",
              geographic_region: audienceProfile.geographic_region || "",
              gender: audienceProfile.gender || "",
              interests: audienceProfile.interests ? audienceProfile.interests.split(',') : [],
              primary_motivation: audienceProfile.primary_motivation
            });
          }
        }

        return {
          id: channelId,
          name: channelId,
          url: account.channel_url,
          status: account.status || "inactive",
          description: "",
          audiences: audiences
        };
      });

      console.log("Transformed channels data:", transformedChannels);
      setMyYouTubeChannels(transformedChannels);
    }
  }, [accountsSettingsData, audienceProfiles]);
  
  const channelForm = useForm({
    resolver: zodResolver(youtubeChannelSchema),
    defaultValues: {
      name: "",
      url: "",
      isActive: true,
      description: "",
      audienceProfileId: ""
    }
  });

  const audienceForm = useForm({
    resolver: zodResolver(audienceSchema),
    defaultValues: {
      audience_profile_name: "",
      age_group: "",
      geographic_region: "",
      gender: "",
      interests: "",
      primary_motivation: ""
    }
  });

  const channelAudienceForm = useForm({
    resolver: zodResolver(channelAudienceSchema),
    defaultValues: {
      audienceProfileId: ""
    }
  });

  const setupAddChannel = () => {
    channelForm.reset({
      name: "",
      url: "",
      isActive: true,
      description: "",
      audienceProfileId: ""
    });
    setIsAddingChannel(true);
    setCurrentChannel(null);
  };

  const setupEditChannel = (channel: MyYouTubeChannel) => {
    let currentAudienceProfileId = "";
    if (channel.audiences.length > 0) {
      const audienceProfile = audienceProfiles.find(
        profile => profile.id === channel.audiences[0].id
      );
      if (audienceProfile) {
        currentAudienceProfileId = audienceProfile.id;
      }
    }
    
    channelForm.reset({
      name: channel.name,
      url: channel.url,
      isActive: channel.status === "active",
      description: channel.description || "",
      audienceProfileId: currentAudienceProfileId
    });
    setIsEditingChannel(true);
    setCurrentChannel(channel);
  };

  const setupSelectAudience = (channel: MyYouTubeChannel) => {
    channelAudienceForm.reset({
      audienceProfileId: ""
    });
    setIsSelectingAudience(true);
    setCurrentChannel(channel);
  };

  const setupAddAudience = () => {
    audienceForm.reset();
    setIsAddingAudience(true);
    setCurrentAudience(null);
  };

  const setupEditAudience = (audience: AudienceProfile) => {
    audienceForm.reset({
      audience_profile_name: audience.audience_profile_name || "",
      age_group: audience.age_group || "",
      geographic_region: audience.geographic_region || "",
      gender: audience.gender || "",
      interests: audience.interests || "",
      primary_motivation: audience.primary_motivation || ""
    });
    setIsEditingAudience(true);
    setCurrentAudience(audience);
  };

  const onChannelSubmit = async (data: z.infer<typeof youtubeChannelSchema>) => {
    try {
      const status = data.isActive ? "active" : "inactive";
      const now = new Date().toISOString();
      
      if (isAddingChannel) {
        const accountData: AccountData = {
          channel_url: data.url,
          channel_id: data.name || '',
          status: status,
          created_at: now,
          updated_at: now
        };

        if (data.audienceProfileId) {
          const selectedProfile = audienceProfiles.find(profile => profile.id === data.audienceProfileId);
          if (selectedProfile) {
            accountData.target_audiences = selectedProfile.audience_profile_name;
          }
        }

        // Start optimistic update
        queryClient.setQueryData(["accountsSettings"], (old: any[]) => {
          return [...(old || []), { ...accountData, id: 'temp-' + Date.now() }];
        });

        const { error: accountError } = await supabase
          .from("accounts_settings")
          .insert(accountData);
        
        if (accountError) throw accountError;
        
        // Force immediate refetch to get the real data
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["accountsSettings"] }),
          queryClient.invalidateQueries({ queryKey: ["audienceProfiles"] })
        ]);

        setIsAddingChannel(false);
        toast.success("Channel Added", {
          description: "Your channel has been added successfully."
        });
      } else if (isEditingChannel && currentChannel) {
        const updateData: AccountUpdateData = {
          channel_url: data.url,
          channel_id: data.name || '',
          status: status,
          updated_at: now
        };

        if (data.audienceProfileId) {
          const selectedProfile = audienceProfiles.find(profile => profile.id === data.audienceProfileId);
          if (selectedProfile) {
            updateData.target_audiences = selectedProfile.audience_profile_name;
          }
        }

        // Start optimistic update
        queryClient.setQueryData(["accountsSettings"], (old: any[]) => {
          return (old || []).map(item => 
            item.channel_id === (data.name || currentChannel.name) 
              ? { ...item, ...updateData }
              : item
          );
        });

        const { error: accountError } = await supabase
          .from("accounts_settings")
          .update(updateData)
          .eq("channel_id", data.name || currentChannel.name);

        if (accountError) throw accountError;
        
        // Force immediate refetch to get the real data
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["accountsSettings"] }),
          queryClient.invalidateQueries({ queryKey: ["audienceProfiles"] })
        ]);

        setIsEditingChannel(false);
        setCurrentChannel(null);
        toast.success("Channel Updated", {
          description: "Your channel has been updated successfully."
        });
      }
    } catch (error: any) {
      // Rollback optimistic update on error
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["accountsSettings"] }),
        queryClient.invalidateQueries({ queryKey: ["audienceProfiles"] })
      ]);
      console.error('Channel operation error:', error);
      toast.error(error.message || "An error occurred while processing your request");
    }
  };

  const onChannelAudienceSelect = async (data: z.infer<typeof channelAudienceSchema>) => {
    if (isSelectingAudience && currentChannel) {
      try {
        const selectedProfile = audienceProfiles.find(profile => profile.id === data.audienceProfileId);
        if (selectedProfile) {
          const now = new Date().toISOString();
          
          const { error } = await supabase
            .from("accounts_settings")
            .update({
              target_audiences: selectedProfile.audience_profile_name,
              updated_at: now
            })
            .eq("channel_id", currentChannel.id);
            
          if (error) throw error;
          
          // Immediate refetch after audience update
          await Promise.all([
            refetchAccountsSettings(),
            refetchAudienceProfiles()
          ]);

          setIsSelectingAudience(false);
          setCurrentChannel(null);
          toast("Audience Added", {
            description: "The audience profile has been added to your channel."
          });
        }
      } catch (error: any) {
        toast("Error", {
          description: error.message || "An error occurred"
        });
      }
    }
  };

  const onAudienceSubmit = async (data: any) => {
    try {
      if (isAddingAudience) {
        const { error } = await supabase
          .from("audience_profile_settings")
          .insert({
            audience_profile_name: data.audience_profile_name,
            age_group: data.age_group,
            geographic_region: data.geographic_region,
            gender: data.gender,
            interests: data.interests,
            primary_motivation: data.primary_motivation
          });

        if (error) throw error;

        await refetchAudienceProfiles();
        toast("Audience Profile Added", {
          description: "Your audience profile has been added successfully."
        });
        setIsAddingAudience(false);
      } else if (isEditingAudience && currentAudience) {
        const { error } = await supabase
          .from("audience_profile_settings")
          .update({
            audience_profile_name: data.audience_profile_name,
            age_group: data.age_group,
            geographic_region: data.geographic_region,
            gender: data.gender,
            interests: data.interests,
            primary_motivation: data.primary_motivation
          })
          .eq("id", currentAudience.id);

        if (error) throw error;

        await refetchAudienceProfiles();
        toast("Audience Profile Updated", {
          description: "Your audience profile has been updated successfully."
        });
        setIsEditingAudience(false);
        setCurrentAudience(null);
      }
    } catch (error: any) {
      toast("Error", {
        description: error.message || "An error occurred"
      });
    }
  };

  const deleteChannel = async (channelId: string) => {
    try {
      // Start optimistic update
      queryClient.setQueryData(["accountsSettings"], (old: any[]) => {
        return (old || []).filter(item => item.channel_id !== channelId);
      });

      const { error } = await supabase
        .from("accounts_settings")
        .delete()
        .eq("channel_id", channelId);
        
      if (error) throw error;
      
      // Force immediate refetch to get the real data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["accountsSettings"] }),
        queryClient.invalidateQueries({ queryKey: ["audienceProfiles"] })
      ]);

      toast("Channel Deleted", {
        description: "Your channel has been removed."
      });
    } catch (error: any) {
      // Rollback optimistic update on error
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["accountsSettings"] }),
        queryClient.invalidateQueries({ queryKey: ["audienceProfiles"] })
      ]);
      toast("Error", {
        description: error.message || "An error occurred"
      });
    }
  };

  const toggleChannelStatus = async (channelId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const now = new Date().toISOString();
      
      // Start optimistic update
      queryClient.setQueryData(["accountsSettings"], (old: any[]) => {
        return (old || []).map(item => 
          item.channel_id === channelId 
            ? { ...item, status: newStatus, updated_at: now }
            : item
        );
      });

      const { error } = await supabase
        .from("accounts_settings")
        .update({
          status: newStatus,
          updated_at: now
        })
        .eq("channel_id", channelId);
        
      if (error) {
        console.error("Error updating accounts_settings table:", error);
        throw error;
      }
      
      // Force immediate refetch to get the real data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["accountsSettings"] }),
        queryClient.invalidateQueries({ queryKey: ["audienceProfiles"] })
      ]);

      // Update local state after successful update
      setMyYouTubeChannels(prevChannels => prevChannels.map(channel => 
        channel.id === channelId ? { ...channel, status: newStatus } : channel
      ));

      toast("Status Updated", {
        description: `Your channel is now ${newStatus}.`
      });
    } catch (error: any) {
      // Rollback optimistic update on error
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["accountsSettings"] }),
        queryClient.invalidateQueries({ queryKey: ["audienceProfiles"] })
      ]);
      toast("Error", {
        description: error.message || "An error occurred"
      });
    }
  };

  const deleteAudience = async (audienceId: string) => {
    try {
      const { error } = await supabase
        .from("audience_profile_settings")
        .delete()
        .eq("id", audienceId);

      if (error) throw error;

      await refetchAudienceProfiles();
      toast("Audience Profile Deleted", {
        description: "Your audience profile has been removed."
      });
    } catch (error: any) {
      toast("Error", {
        description: error.message || "An error occurred"
      });
    }
  };

  const isLoadingAnyData = isLoadingAccountsSettings || isLoadingAudiences;
  const hasAnyData = myYouTubeChannels.length > 0;
  const hasAccountsSettingsData = accountsSettingsData && accountsSettingsData.length > 0;
  const filteredChannels = myYouTubeChannels.filter(channel => {
    if (currentTab === "all") return true;
    return channel.status === currentTab;
  });

  return <div className="container mx-auto py-6 space-y-16 max-w-7xl">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Channels</h1>
            <p className="text-muted-foreground mt-1">Manage your channel profiles and audience settings.</p>
          </div>
          
          <Dialog open={isAddingChannel} onOpenChange={setIsAddingChannel}>
            <DialogTrigger asChild>
              <Button onClick={setupAddChannel}>
                <Plus className="mr-2 h-4 w-4" />
                Add My Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add Your Channel</DialogTitle>
                <DialogDescription>
                  Enter your channel URL and select your target audience.
                </DialogDescription>
              </DialogHeader>
              <Form {...channelForm}>
                <form onSubmit={channelForm.handleSubmit(onChannelSubmit)} className="space-y-4">
                  <FormField control={channelForm.control} name="name" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Channel Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Will be auto-updated" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be auto-updated after adding the channel.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={channelForm.control} name="url" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Channel URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://youtube.com/c/channelname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={channelForm.control} name="isActive" render={({
                  field
                }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Status</FormLabel>
                          <FormDescription>
                            Set this channel as active or inactive.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${!field.value ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                              Inactive
                            </span>
                            <Switch 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span className={`text-sm ${field.value ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                              Active
                            </span>
                          </div>
                        </FormControl>
                      </FormItem>} />
                  
                  <FormField control={channelForm.control} name="audienceProfileId" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an audience profile" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingAudiences ? <SelectItem value="" disabled>
                                Loading...
                              </SelectItem> : audienceProfiles.length === 0 ? <SelectItem value="" disabled>
                                No audience profiles available
                              </SelectItem> : audienceProfiles.map(profile => <SelectItem key={profile.id} value={profile.id}>
                                  {profile.audience_profile_name || "Unnamed Profile"}
                                </SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Optional: Select a target audience profile for this channel.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>} />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddingChannel(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Channel</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditingChannel} onOpenChange={setIsEditingChannel}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Edit Channel</DialogTitle>
                <DialogDescription>
                  Update the details of your channel.
                </DialogDescription>
              </DialogHeader>
              <Form {...channelForm}>
                <form onSubmit={channelForm.handleSubmit(onChannelSubmit)} className="space-y-4">
                  <FormField control={channelForm.control} name="name" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Channel Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={channelForm.control} name="url" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Channel URL</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={channelForm.control} name="isActive" render={({
                  field
                }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Status</FormLabel>
                          <FormDescription>
                            Set this channel as active or inactive.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${!field.value ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                              Inactive
                            </span>
                            <Switch 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span className={`text-sm ${field.value ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                              Active
                            </span>
                          </div>
                        </FormControl>
                      </FormItem>} />
                  
                  <FormField control={channelForm.control} name="audienceProfileId" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an audience profile" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingAudiences ? <SelectItem value="" disabled>
                                Loading...
                              </SelectItem> : audienceProfiles.length === 0 ? <SelectItem value="" disabled>
                                No audience profiles available
                              </SelectItem> : audienceProfiles.map(profile => <SelectItem key={profile.id} value={profile.id}>
                                  {profile.audience_profile_name || "Unnamed Profile"}
                                </SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Update target audience profile for this channel.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>} />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditingChannel(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isSelectingAudience} onOpenChange={setIsSelectingAudience}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Select Target Audience</DialogTitle>
                <DialogDescription>
                  Choose an existing audience profile for{" "}
                  {currentChannel ? currentChannel.name : "this channel"}.
                </DialogDescription>
              </DialogHeader>
              <Form {...channelAudienceForm}>
                <form onSubmit={channelAudienceForm.handleSubmit(onChannelAudienceSelect)} className="space-y-4">
                  <FormField
                    control={channelAudienceForm.control}
                    name="audienceProfileId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience Profile</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an audience profile" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingAudiences ? (
                              <SelectItem value="" disabled>
                                Loading...
                              </SelectItem>
                            ) : audienceProfiles.length === 0 ? (
                              <SelectItem value="" disabled>
                                No audience profiles available
                              </SelectItem>
                            ) : (
                              audienceProfiles.map(profile => (
                                <SelectItem key={profile.id} value={profile.id}>
                                  {profile.audience_profile_name || "Unnamed Profile"}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsSelectingAudience(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Audience</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={value => setCurrentTab(value)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All Channels</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="w-full">
              {isLoadingAnyData ? (
                <p>Loading YouTube channels...</p>
              ) : profilesError || accountsSettingsError ? (
                <div className="col-span-3">
                  <p className="text-red-500">
                    Error loading YouTube channels: {((profilesError || accountsSettingsError) as Error).message}
                  </p>
                </div>
              ) : filteredChannels.length === 0 ? (
                <div className="col-span-3">
                  <p>No YouTube channels available. Add your first YouTube channel to get started.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Debug info: Channels data: {JSON.stringify(myYouTubeChannels.length)} items, 
                    Accounts Settings data: {JSON.stringify(accountsSettingsData?.length || 0)} items
                  </p>
                  {hasAccountsSettingsData && <div className="mt-4 p-4 border rounded bg-amber-50">
                      <h3 className="font-medium">Note: Data Found in accounts_settings</h3>
                      <p className="text-sm mt-2">
                        We found {accountsSettingsData?.length} channel entries in the accounts_settings table, 
                        but they couldn't be linked to channels. This might be because:
                      </p>
                      <ul className="list-disc list-inside text-sm mt-2">
                        <li>The channel_id values don't match</li>
                        <li>The channels were deleted from the channels table</li>
                      </ul>
                      <pre className="mt-2 p-2 bg-slate-100 text-xs rounded overflow-auto">
                        {JSON.stringify(accountsSettingsData, null, 2)}
                      </pre>
                    </div>}
                </div>
              ) : (
                <ChannelCarousel
                  channels={filteredChannels}
                  onEdit={setupEditChannel}
                  onDelete={deleteChannel}
                  onAddAudience={setupSelectAudience}
                  onToggleStatus={toggleChannelStatus}
                  audienceProfiles={audienceProfiles}
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="active" className="mt-6">
            <div className="w-full">
              {isLoadingAnyData ? (
                <p>Loading YouTube channels...</p>
              ) : profilesError || accountsSettingsError ? (
                <div className="col-span-3">
                  <p className="text-red-500">
                    Error loading YouTube channels: {((profilesError || accountsSettingsError) as Error).message}
                  </p>
                </div>
              ) : filteredChannels.length === 0 ? (
                <p>No active YouTube channels available.</p>
              ) : (
                <ChannelCarousel
                  channels={filteredChannels}
                  onEdit={setupEditChannel}
                  onDelete={deleteChannel}
                  onAddAudience={setupSelectAudience}
                  onToggleStatus={toggleChannelStatus}
                  audienceProfiles={audienceProfiles}
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="inactive" className="mt-6">
            <div className="w-full">
              {isLoadingAnyData ? (
                <p>Loading YouTube channels...</p>
              ) : profilesError || accountsSettingsError ? (
                <div className="col-span-3">
                  <p className="text-red-500">
                    Error loading YouTube channels: {((profilesError || accountsSettingsError) as Error).message}
                  </p>
                </div>
              ) : filteredChannels.length === 0 ? (
                <p>No inactive YouTube channels available.</p>
              ) : (
                <ChannelCarousel
                  channels={filteredChannels}
                  onEdit={setupEditChannel}
                  onDelete={deleteChannel}
                  onAddAudience={setupSelectAudience}
                  onToggleStatus={toggleChannelStatus}
                  audienceProfiles={audienceProfiles}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* New My Audiences section with increased top spacing */}
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Audiences</h1>
            <p className="text-muted-foreground mt-1">Manage your audience profiles for targeting content.</p>
          </div>

          <Dialog open={isAddingAudience} onOpenChange={setIsAddingAudience}>
            <DialogTrigger asChild>
              <Button onClick={setupAddAudience}>
                <Plus className="mr-2 h-4 w-4" />
                Add Audience Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add Audience Profile</DialogTitle>
                <DialogDescription>
                  Create a new audience profile for targeting your content.
                </DialogDescription>
              </DialogHeader>
              <Form {...audienceForm}>
                <form onSubmit={audienceForm.handleSubmit(onAudienceSubmit)} className="space-y-4">
                  <FormField
                    control={audienceForm.control}
                    name="audience_profile_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Young Tech Enthusiasts" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={audienceForm.control}
                    name="age_group"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age Group</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select age group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="13-17">13-17</SelectItem>
                            <SelectItem value="18-24">18-24</SelectItem>
                            <SelectItem value="25-34">25-34</SelectItem>
                            <SelectItem value="35-44">35-44</SelectItem>
                            <SelectItem value="45-54">45-54</SelectItem>
                            <SelectItem value="55+">55+</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={audienceForm.control}
                    name="geographic_region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geographic Region</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="North America">North America</SelectItem>
                            <SelectItem value="Europe">Europe</SelectItem>
                            <SelectItem value="Asia">Asia</SelectItem>
                            <SelectItem value="South America">South America</SelectItem>
                            <SelectItem value="Africa">Africa</SelectItem>
                            <SelectItem value="Oceania">Oceania</SelectItem>
                            <SelectItem value="Global">Global</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={audienceForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="all">All</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={audienceForm.control}
                    name="interests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interests</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., technology, gaming, education (comma-separated)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter interests separated by commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={audienceForm.control}
                    name="primary_motivation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Motivation (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Learning new skills" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddingAudience(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Profile</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="w-full">
          {isLoadingAudiences ? (
            <p>Loading audience profiles...</p>
          ) : profilesError ? (
            <div className="col-span-3">
              <p className="text-red-500">Error loading audience profiles: {(profilesError as Error).message}</p>
            </div>
          ) : audienceProfiles.length === 0 ? (
            <p>No audience profiles available. Add your first audience profile to get started.</p>
          ) : (
            <AudienceCarousel
              audiences={audienceProfiles}
              onEdit={setupEditAudience}
              onDelete={deleteAudience}
            />
          )}
        </div>

        <Dialog open={isEditingAudience} onOpenChange={setIsEditingAudience}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Edit Audience Profile</DialogTitle>
              <DialogDescription>
                Update the details of your audience profile.
              </DialogDescription>
            </DialogHeader>
            <Form {...audienceForm}>
              <form onSubmit={audienceForm.handleSubmit(onAudienceSubmit)} className="space-y-4">
                <FormField
                  control={audienceForm.control}
                  name="audience_profile_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={audienceForm.control}
                  name="age_group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Group</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select age group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="13-17">13-17</SelectItem>
                          <SelectItem value="18-24">18-24</SelectItem>
                          <SelectItem value="25-34">25-34</SelectItem>
                          <SelectItem value="35-44">35-44</SelectItem>
                          <SelectItem value="45-54">45-54</SelectItem>
                          <SelectItem value="55+">55+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={audienceForm.control}
                  name="geographic_region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Geographic Region</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="North America">North America</SelectItem>
                          <SelectItem value="Europe">Europe</SelectItem>
                          <SelectItem value="Asia">Asia</SelectItem>
                          <SelectItem value="South America">South America</SelectItem>
                          <SelectItem value="Africa">Africa</SelectItem>
                          <SelectItem value="Oceania">Oceania</SelectItem>
                          <SelectItem value="Global">Global</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={audienceForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={audienceForm.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interests</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter interests separated by commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={audienceForm.control}
                  name="primary_motivation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Motivation (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditingAudience(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
};

const YouTubeChannelCard = ({
  channel,
  onEdit,
  onDelete,
  onAddAudience,
  onToggleStatus,
  audienceProfiles
}: {
  channel: MyYouTubeChannel;
  onEdit: () => void;
  onDelete: () => void;
  onAddAudience: () => void;
  onToggleStatus: () => void;
  audienceProfiles: AudienceProfile[];
}) => {
  return <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-slate-200">
      <CardHeader className="pb-2 space-y-0 pt-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1 mr-2">
            <CardTitle className="flex items-center text-lg">
              <Youtube className="h-4 w-4 mr-2 text-red-600 flex-shrink-0" />
              <span className="truncate">{channel.name || "Unnamed Channel"}</span>
            </CardTitle>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={onEdit}>
              <Edit className="h-4 w-4 text-slate-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-red-50" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-1">
          <CardDescription className="flex items-center">
            <a href={channel.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center text-xs">
              View Channel
              <ExternalLinkIcon className="ml-1 h-3 w-3" />
            </a>
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3 px-4 pt-1">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-medium flex items-center">
            <UsersIcon className="h-4 w-4 mr-1.5 text-slate-600" /> Target Audiences
          </h4>
          <Button variant="outline" size="sm" onClick={onAddAudience} className="text-xs h-7 px-2 text-slate-700 bg-slate-50 hover:bg-slate-100">
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        
        {channel.audiences.length > 0 ? <ScrollArea className="h-[140px] pr-3">
            {channel.audiences.map(audience => <div key={audience.id} className="p-3 mb-2 bg-slate-50 rounded-md border border-slate-100">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {audience.age_group && <Badge variant="outline" className="text-xs bg-white">
                      {audience.age_group}
                    </Badge>}
                  {audience.geographic_region && <Badge variant="outline" className="text-xs bg-white">
                      {audience.geographic_region}
                    </Badge>}
                  {audience.gender && <Badge variant="outline" className="text-xs capitalize bg-white">
                      {audience.gender}
                    </Badge>}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {audience.interests && audience.interests.map(interest => <Badge key={interest} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>)}
                </div>
              </div>)}
          </ScrollArea> : <div className="py-5 text-center text-muted-foreground text-sm bg-slate-50 rounded-md border border-dashed border-slate-200">
            No audience profiles defined yet.
          </div>}
      </CardContent>
      
      <CardFooter className="pt-2 pb-3 px-4 border-t">
        <div className="w-full flex justify-between items-center">
          <Badge variant={channel.status === "active" ? "default" : "secondary"} className={`capitalize ${channel.status === "active" ? "bg-blue-500 hover:bg-blue-600" : "bg-slate-100 text-slate-800 hover:bg-slate-200"}`}>
            {channel.status}
          </Badge>
          <Switch checked={channel.status === "active"} onCheckedChange={onToggleStatus} className="data-[state=checked]:bg-blue-500" />
        </div>
      </CardFooter>
    </Card>;
};

export default ChannelProfiles;
