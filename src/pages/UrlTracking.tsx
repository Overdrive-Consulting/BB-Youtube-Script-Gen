import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, ExternalLink, Search, Trash, XCircle, Youtube, Loader2, Info, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, checkSupabaseConnection } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { VideoUrlType } from '@/types/scriptPipeline';
import { Switch } from '@/components/ui/switch';

interface TrackedUrl {
  id: string;
  video_channel_url: string;
  is_tracked: boolean;
  url_type: VideoUrlType;
  created_at?: string;
  updated_at?: string;
  reference_for?: string | null;
}

const UrlTracking: React.FC = () => {
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();
  const [newUrlDialogOpen, setNewUrlDialogOpen] = useState(false);
  const [editUrlDialogOpen, setEditUrlDialogOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [currentUrl, setCurrentUrl] = useState<TrackedUrl | null>(null);
  const [newUrl, setNewUrl] = useState({
    url: '',
    type: 'channel',
    tracked: true
  });

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkSupabaseConnection();
      setConnectionStatus(isConnected);
      if (!isConnected) {
        toast.error('Failed to connect to Supabase. Please check your configuration.');
      }
    };
    checkConnection();
  }, []);

  const {
    data: urls = [],
    isLoading,
    error,
    refetch: refetchUrls
  } = useQuery({
    queryKey: ['trackedUrls', user?.id],
    queryFn: async () => {
      console.log('Fetching URLs from Supabase as user:', user?.id);
      const { data, error } = await supabase.from('video_generator_input').select('*');
      if (error) {
        console.error('Error fetching URLs:', error);
        throw error;
      }
      console.log('Fetched URLs:', data);
      return data as TrackedUrl[] || [];
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0
  });

  const addUrlMutation = useMutation({
    mutationFn: async (url: Partial<TrackedUrl>) => {
      console.log('Adding URL to Supabase:', url);
      const { data, error } = await supabase.from('video_generator_input').insert([url]).select();
      if (error) {
        console.error('Error adding URL:', error);
        throw error;
      }
      console.log('Added URL:', data?.[0]);
      return data?.[0];
    },
    onMutate: async (newUrl) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['trackedUrls', user?.id] });

      // Snapshot the previous value
      const previousUrls = queryClient.getQueryData(['trackedUrls', user?.id]);

      // Optimistically update to the new value
      queryClient.setQueryData(['trackedUrls', user?.id], (old: TrackedUrl[] | undefined) => {
        const tempUrl: TrackedUrl = {
          id: 'temp-' + Date.now(),
          video_channel_url: newUrl.video_channel_url || '',
          is_tracked: newUrl.is_tracked || false,
          url_type: newUrl.url_type || 'channel',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return [...(old || []), tempUrl];
      });

      return { previousUrls };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousUrls) {
        queryClient.setQueryData(['trackedUrls', user?.id], context.previousUrls);
      }
      toast.error('Failed to add URL. Please try again.');
    },
    onSettled: async () => {
      // Always refetch after error or success
      await queryClient.invalidateQueries({ queryKey: ['trackedUrls', user?.id] });
    }
  });

  const updateUrlMutation = useMutation({
    mutationFn: async (url: Partial<TrackedUrl>) => {
      console.log('Updating URL in Supabase:', url);
      const { data, error } = await supabase
        .from('video_generator_input')
        .update({
          video_channel_url: url.video_channel_url,
          url_type: url.url_type,
          is_tracked: url.is_tracked,
          updated_at: new Date().toISOString()
        })
        .eq('id', url.id)
        .select();
      if (error) {
        console.error('Error updating URL:', error);
        throw error;
      }
      console.log('Updated URL:', data?.[0]);
      return data?.[0];
    },
    onMutate: async (updatedUrl) => {
      await queryClient.cancelQueries({ queryKey: ['trackedUrls', user?.id] });
      const previousUrls = queryClient.getQueryData(['trackedUrls', user?.id]);

      queryClient.setQueryData(['trackedUrls', user?.id], (old: TrackedUrl[] | undefined) => {
        if (!old) return old;
        return old.map(url => 
          url.id === updatedUrl.id ? { ...url, ...updatedUrl, updated_at: new Date().toISOString() } : url
        );
      });

      return { previousUrls };
    },
    onError: (err, variables, context) => {
      if (context?.previousUrls) {
        queryClient.setQueryData(['trackedUrls', user?.id], context.previousUrls);
      }
      toast.error('Failed to update URL. Please try again.');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trackedUrls', user?.id] });
    }
  });

  const updateTrackingMutation = useMutation({
    mutationFn: async ({
      id,
      isTracked
    }: {
      id: string;
      isTracked: boolean;
    }) => {
      console.log('Updating URL tracking status:', id, isTracked);
      const { data, error } = await supabase.from('video_generator_input').update({
        is_tracked: isTracked,
        updated_at: new Date().toISOString()
      }).eq('id', id).select();
      if (error) {
        console.error('Error updating URL:', error);
        throw error;
      }
      console.log('Updated URL:', data?.[0]);
      return data?.[0];
    },
    onMutate: async ({ id, isTracked }) => {
      // Cancel any outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ['trackedUrls', user?.id] });

      // Snapshot the previous value
      const previousUrls = queryClient.getQueryData(['trackedUrls', user?.id]);

      // Update the cache with our optimistic value while maintaining array order
      queryClient.setQueryData(['trackedUrls', user?.id], (old: TrackedUrl[] | undefined) => {
        if (!old) return old;
        return old.map(url => 
          url.id === id 
            ? { ...url, is_tracked: isTracked, updated_at: new Date().toISOString() } 
            : url
        );
      });

      return { previousUrls };
    },
    onError: (err, variables, context) => {
      // On error, rollback to the previous value
      if (context?.previousUrls) {
        queryClient.setQueryData(['trackedUrls', user?.id], context.previousUrls);
      }
      toast.error('Failed to update tracking status. Please try again.');
      
      // Only invalidate queries on error to ensure we have the correct state
      queryClient.invalidateQueries({ queryKey: ['trackedUrls', user?.id] });
    }
  });

  const deleteUrlMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting URL:', id);
      const { error } = await supabase.from('video_generator_input').delete().eq('id', id);
      if (error) {
        console.error('Error deleting URL:', error);
        throw error;
      }
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['trackedUrls', user?.id] });
      const previousUrls = queryClient.getQueryData(['trackedUrls', user?.id]);

      queryClient.setQueryData(['trackedUrls', user?.id], (old: TrackedUrl[] | undefined) => {
        if (!old) return old;
        return old.filter(url => url.id !== id);
      });

      return { previousUrls };
    },
    onError: (err, variables, context) => {
      if (context?.previousUrls) {
        queryClient.setQueryData(['trackedUrls', user?.id], context.previousUrls);
      }
      toast.error('Failed to remove URL. Please try again.');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trackedUrls', user?.id] });
    }
  });

  const resetNewUrlForm = () => {
    setNewUrl({
      url: '',
      type: 'channel',
      tracked: true
    });
  };

  const handleAddUrl = () => {
    if (!newUrl.url) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    if (!newUrl.url.includes('youtube.com')) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }
    
    addUrlMutation.mutate({
      video_channel_url: newUrl.url,
      is_tracked: newUrl.tracked,
      url_type: newUrl.type as 'channel' | 'video'
    }, {
      onSuccess: () => {
        setNewUrlDialogOpen(false);
        resetNewUrlForm();
        toast.success('URL added successfully', {
          description: 'The URL has been added to your tracking list.'
        });
      }
    });
  };

  const handleUpdateUrl = () => {
    if (!currentUrl) return;
    
    if (!currentUrl.video_channel_url) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    if (!currentUrl.video_channel_url.includes('youtube.com')) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }
    
    updateUrlMutation.mutate({
      id: currentUrl.id,
      video_channel_url: currentUrl.video_channel_url,
      url_type: currentUrl.url_type,
      is_tracked: currentUrl.is_tracked
    });
  };

  const toggleTracking = (id: string, currentStatus: boolean) => {
    updateTrackingMutation.mutate({
      id,
      isTracked: !currentStatus
    });
  };

  const handleRemoveUrl = (id: string) => {
    deleteUrlMutation.mutate(id);
  };

  const openEditDialog = (url: TrackedUrl) => {
    setCurrentUrl(url);
    setEditUrlDialogOpen(true);
  };

  const filteredUrls = urls.filter((url: TrackedUrl) => {
    const urlStr = url.video_channel_url?.toLowerCase() || '';
    const matchesSearch = searchText === '' || urlStr.includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'tracked' && url.is_tracked) || 
                          (statusFilter === 'not-tracked' && !url.is_tracked);
    const matchesType = typeFilter === 'all' || typeFilter === url.url_type;
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => {
    // Sort by updated_at in descending order (newest first)
    const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return dateB - dateA;
  });

  if (error) {
    toast.error('Failed to load URLs. Please check your connection and try again.');
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return 'Invalid date';
    }
  };

  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground mt-1">
            Monitor YouTube channels and videos for content research
          </p>
        </div>
        
        <Dialog open={newUrlDialogOpen} onOpenChange={setNewUrlDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add URL</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New YouTube URL</DialogTitle>
              <DialogDescription>
                Add a YouTube channel or video to track for content research.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="url">YouTube URL</Label>
                <Input id="url" placeholder="https://www.youtube.com/c/channel-name" value={newUrl.url} onChange={e => setNewUrl({
                ...newUrl,
                url: e.target.value
              })} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">URL Type</Label>
                  <Select value={newUrl.type} onValueChange={value => setNewUrl({
                  ...newUrl,
                  type: value
                })}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="channel">Channel</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="tracked">Track Status</Label>
                  <Select value={newUrl.tracked ? 'true' : 'false'} onValueChange={value => setNewUrl({
                  ...newUrl,
                  tracked: value === 'true'
                })}>
                    <SelectTrigger id="tracked">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Tracked</SelectItem>
                      <SelectItem value="false">Not Tracked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewUrlDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUrl} disabled={addUrlMutation.isPending}>
                {addUrlMutation.isPending ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </> : 'Add URL'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={editUrlDialogOpen} onOpenChange={setEditUrlDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit YouTube URL</DialogTitle>
              <DialogDescription>
                Update this YouTube resource.
              </DialogDescription>
            </DialogHeader>
            
            {currentUrl && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-url">YouTube URL</Label>
                  <Input 
                    id="edit-url" 
                    placeholder="https://www.youtube.com/c/channel-name" 
                    value={currentUrl.video_channel_url || ''} 
                    onChange={e => setCurrentUrl({
                      ...currentUrl,
                      video_channel_url: e.target.value
                    })} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-type">URL Type</Label>
                    <Select 
                      value={currentUrl.url_type.toString()} 
                      onValueChange={value => setCurrentUrl({
                        ...currentUrl,
                        url_type: value as VideoUrlType
                      })}
                    >
                      <SelectTrigger id="edit-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="channel">Channel</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-tracked">Track Status</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch 
                        id="edit-tracked"
                        checked={currentUrl.is_tracked} 
                        onCheckedChange={checked => setCurrentUrl({
                          ...currentUrl,
                          is_tracked: checked
                        })}
                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200"
                      />
                      <Label htmlFor="edit-tracked" className="text-sm font-normal">
                        {currentUrl.is_tracked ? 'Tracked' : 'Not Tracked'}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUrlDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUrl} disabled={updateUrlMutation.isPending}>
                {updateUrlMutation.isPending ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {connectionStatus === false && <Alert variant="destructive" className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            Failed to connect to Supabase. Please check your configuration and network connection.
          </AlertDescription>
        </Alert>}
      
      <Card>
        <CardHeader>
          <CardTitle>YouTube Resources</CardTitle>
          <CardDescription>
            Track YouTube channels and videos for content research and inspiration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search URLs..." value={searchText} onChange={e => setSearchText(e.target.value)} className="pl-8" />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="tracked">Tracked</SelectItem>
                  <SelectItem value="not-tracked">Not Tracked</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="channel">Channels</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? 
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading URLs...
                      </div>
                    </TableCell>
                  </TableRow> 
                : filteredUrls.length > 0 ? 
                  filteredUrls.map((url: TrackedUrl) => 
                    <TableRow key={url.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <a href={url.video_channel_url || '#'} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-1 hover:text-foreground">
                            {url.video_channel_url && url.video_channel_url.length > 40 ? url.video_channel_url.substring(0, 40) + '...' : url.video_channel_url || 'No URL provided'}
                            {url.video_channel_url && <ExternalLink className="h-3 w-3" />}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={url.url_type === 'channel' ? "outline" : "secondary"} 
                          className={`flex items-center gap-1 w-fit ${url.url_type === 'channel' ? 'bg-amber-100 hover:bg-amber-200 border-amber-200' : ''}`}
                        >
                          <Youtube className="h-3 w-3" />
                          {url.url_type === 'channel' ? 'Channel' : 'Video'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={url.is_tracked}
                            onCheckedChange={() => toggleTracking(url.id, url.is_tracked)}
                            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200"
                            disabled={updateTrackingMutation.isPending}
                          />
                          <span className="text-sm text-muted-foreground">
                            {url.is_tracked ? 'Tracked' : 'Not Tracked'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(url.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-foreground hover:bg-accent" 
                            onClick={() => openEditDialog(url)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" 
                            onClick={() => handleRemoveUrl(url.id)} 
                            disabled={deleteUrlMutation.isPending}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) 
                : <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {connectionStatus === false ? "Connection to Supabase failed. Please check your configuration." : user ? "No URLs found. Try adjusting your filters or add a new URL." : "Please sign in to view and manage your URLs."}
                    </TableCell>
                  </TableRow>
                }
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>;
};

export default UrlTracking;
