import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChartIcon, 
  ExternalLink, 
  Users, 
  PlaySquare, 
  Eye, 
  TrendingUp,
  CheckCircle2,
  MapPin,
  Trash2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import DetailsSidebar from '@/components/analytics/DetailsSidebar';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from 'sonner';

interface ChannelData {
  channel_id: string;
  channel_url: string;
  channel_name: string;
  subscribers: number;
  date_joined: string;
  growth_3mo: number;
  growth_6mo: number;
  growth_12mo: number;
  channel_total_videos: number;
  channel_total_views: number;
  channel_location: string;
  is_channel_verified: boolean;
  is_age_restricted: boolean;
  channel_description: string;
  channel_avatar_url: string;
  channel_banner_url: string;
  last_scraped_date: string;
  is_tracked: boolean;
  date_added: string;
  last_updated_at: string;
  created_at?: string;
}

const ITEMS_PER_PAGE = 10;

const ChannelsAnalytics: React.FC = () => {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('subscribers');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('subscribers', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map(channel => ({
        ...channel,
        subscribers: Number(channel.subscribers),
        channel_total_videos: Number(channel.channel_total_videos),
        channel_total_views: Number(channel.channel_total_views),
        growth_3mo: Number(channel.growth_3mo),
        growth_6mo: Number(channel.growth_6mo),
        growth_12mo: Number(channel.growth_12mo),
        is_tracked: Boolean(channel.is_tracked),
        is_channel_verified: Boolean(channel.is_channel_verified),
        is_age_restricted: Boolean(channel.is_age_restricted)
      }));
      
      const sortedData = sortChannels(formattedData);
      setChannels(sortedData);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortChannels = (channelsToSort: ChannelData[]) => {
    return [...channelsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'subscribers':
          return b.subscribers - a.subscribers;
        case 'videos':
          return b.channel_total_videos - a.channel_total_videos;
        case 'views':
          return b.channel_total_views - a.channel_total_views;
        case 'growth':
          return b.growth_3mo - a.growth_3mo;
        default:
          return new Date(b.date_joined).getTime() - new Date(a.date_joined).getTime();
      }
    });
  };

  useEffect(() => {
    setChannels(sortChannels(channels));
  }, [sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(channels.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentChannels = channels.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const detailFields = [
    { label: 'Channel Name', key: 'channel_name' },
    { label: 'Channel ID', key: 'channel_id' },
    { label: 'Subscribers', key: 'subscribers' },
    { label: 'Total Videos', key: 'channel_total_videos' },
    { label: 'Total Views', key: 'channel_total_views' },
    { label: 'Location', key: 'channel_location' },
    { label: 'Date Joined', key: 'date_joined' },
    { label: '3 Month Growth', key: 'growth_3mo' },
    { label: '6 Month Growth', key: 'growth_6mo' },
    { label: '12 Month Growth', key: 'growth_12mo' },
    { label: 'Verified', key: 'is_channel_verified' },
    { label: 'Age Restricted', key: 'is_age_restricted' },
    { label: 'Description', key: 'channel_description' },
    { label: 'Last Updated', key: 'last_updated_at' },
    { label: 'Last Scraped', key: 'last_scraped_date' },
    { label: 'Channel URL', key: 'channel_url' },
  ];

  const handleRowClick = (channel: ChannelData) => {
    setSelectedChannel(channel);
    setSidebarOpen(true);
  };

  // Add delete channel function
  const handleDeleteChannel = async (channelId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click

    // Show confirmation toast
    toast.promise(
      (async () => {
        const { error } = await supabase
          .from('channels')
          .delete()
          .eq('channel_id', channelId);

        if (error) throw error;

        // Remove channel from local state
        setChannels(prev => prev.filter(channel => channel.channel_id !== channelId));
        return 'Channel deleted successfully';
      })(),
      {
        loading: 'Deleting channel...',
        success: (message) => message,
        error: 'Failed to delete channel'
      }
    );
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-theme(spacing.16))]">
        <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon className="h-5 w-5" />
              Tracked Channels
          </CardTitle>
          <CardDescription>
              Monitor YouTube channels being tracked for content analysis and insights
          </CardDescription>
        </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-end gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Sort:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscribers">Most Subscribers</SelectItem>
                  <SelectItem value="videos">Most Videos</SelectItem>
                  <SelectItem value="views">Most Views</SelectItem>
                  <SelectItem value="growth">Highest Growth (3mo)</SelectItem>
                  <SelectItem value="date">Date Joined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex-1 overflow-auto border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background border-b">
                  <TableRow>
                    <TableHead className="min-w-[300px] bg-background">
                      <div className="flex items-center gap-1">
                        Channel
                      </div>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap bg-background">
                      <div className="flex items-center justify-end gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs">Subscribers</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap bg-background">
                      <div className="flex items-center justify-end gap-1">
                        <PlaySquare className="h-3.5 w-3.5" />
                        <span className="text-xs">Videos</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap bg-background">
                      <div className="flex items-center justify-end gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="text-xs">Total Views</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap bg-background">
                      <div className="flex items-center justify-end gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-xs">Location</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right bg-background">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Skeleton className="h-7 w-20 rounded-full" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    currentChannels.map((channel) => (
                      <TableRow 
                        key={channel.channel_id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(channel)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img 
                              src={channel.channel_avatar_url} 
                              alt={channel.channel_name}
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-medium break-words pr-1 text-sm">
                                  {channel.channel_name}
                                </span>
                                {channel.is_channel_verified && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Joined {formatDistanceToNow(new Date(channel.date_joined), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {channel.subscribers.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {channel.channel_total_videos.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {channel.channel_total_views.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {channel.channel_location || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="rounded-full h-7 px-3 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(channel);
                              }}
                            >
                              View More
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(channel.channel_url, '_blank');
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => handleDeleteChannel(channel.channel_id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {!loading && channels.length > 0 && (
              <div className="flex items-center justify-between gap-2 mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, channels.length)} of {channels.length} channels
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === 1 || 
                               page === totalPages || 
                               (page >= currentPage - 1 && page <= currentPage + 1);
                      })
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      ))}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
          </div>
            )}
        </CardContent>
      </Card>
    </div>

      <DetailsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        data={selectedChannel}
        fields={detailFields}
        title="Channel Details"
      />
    </>
  );
};

export default ChannelsAnalytics; 