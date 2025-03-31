import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChartIcon, ExternalLink, Eye, ThumbsUp, MessageSquare, Clock, BarChart, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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

interface VideoData {
  id: string;
  video_id: string;
  video_title: string;
  thumbnail_url: string;
  video_url: string;
  date_published: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  duration: string;
  virality_score: number;
  impressions: number;
  is_tracked: boolean;
  channel_id: string;
  transcript_url: string | null;
  date_added: string;
  last_scraped_at: string;
  last_updated_at: string;
  created_at?: string;
}

const ITEMS_PER_PAGE = 10;

const VideosAnalytics: React.FC = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('date_scraped');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('last_scraped_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map(video => ({
        ...video,
        views_count: Number(video.views_count),
        likes_count: Number(video.likes_count),
        comments_count: Number(video.comments_count),
        impressions: Number(video.impressions),
        virality_score: Number(video.virality_score),
        is_tracked: Boolean(video.is_tracked),
        duration: String(video.duration || '')
      }));
      
      const sortedData = sortVideos(formattedData);
      setVideos(sortedData);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortVideos = (videosToSort: VideoData[]) => {
    return [...videosToSort].sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.views_count - a.views_count;
        case 'likes':
          return b.likes_count - a.likes_count;
        case 'comments':
          return b.comments_count - a.comments_count;
        case 'impressions':
          return b.impressions - a.impressions;
        case 'date_scraped':
          return new Date(b.last_scraped_at).getTime() - new Date(a.last_scraped_at).getTime();
        case 'date':
          return new Date(b.date_published).getTime() - new Date(a.date_published).getTime();
        default:
          return new Date(b.last_scraped_at).getTime() - new Date(a.last_scraped_at).getTime();
      }
    });
  };

  useEffect(() => {
    setVideos(sortVideos([...videos]));
  }, [sortBy, videos]);

  // Calculate pagination
  const totalPages = Math.ceil(videos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentVideos = videos.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const detailFields = [
    { label: 'Video Title', key: 'video_title' },
    { label: 'Video ID', key: 'video_id' },
    { label: 'Channel ID', key: 'channel_id' },
    { label: 'Views', key: 'views_count' },
    { label: 'Likes', key: 'likes_count' },
    { label: 'Comments', key: 'comments_count' },
    { label: 'Published Date', key: 'date_published' },
    { label: 'Duration', key: 'duration' },
    { label: 'Impressions', key: 'impressions' },
    { label: 'Virality Score', key: 'virality_score' },
    { label: 'Tracking Status', key: 'is_tracked' },
    { label: 'Last Updated', key: 'last_updated_at' },
    { label: 'Last Scraped', key: 'last_scraped_at' },
    { label: 'Video URL', key: 'video_url' },
    { label: 'Transcript URL', key: 'transcript_url' },
  ];

  const handleRowClick = (video: VideoData) => {
    setSelectedVideo(video);
    setSidebarOpen(true);
  };

  const formatDuration = (duration: string) => {
    if (!duration) return '0:00';

    // If duration is already in HH:MM:SS format, return as is
    if (duration.includes(':')) return duration;

    // YouTube duration format is like "PT1H2M10S" or "PT5M6S"
    const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!matches) return duration;

    const [_, hours, minutes, seconds] = matches;
    const h = parseInt(hours || '0');
    const m = parseInt(minutes || '0');
    const s = parseInt(seconds || '0');

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getViralityColor = (score: number) => {
    if (score >= 7) return 'text-green-500';
    if (score >= 4) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Add delete video function
  const handleDeleteVideo = async (videoId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click

    toast.promise(
      (async () => {
        const { error } = await supabase
          .from('videos')
          .delete()
          .eq('video_id', videoId);

        if (error) throw error;

        // Remove video from local state
        setVideos(prev => prev.filter(video => video.video_id !== videoId));
        return 'Video deleted successfully';
      })(),
      {
        loading: 'Deleting video...',
        success: (message) => message,
        error: 'Failed to delete video'
      }
    );
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-theme(spacing.16))]">
        <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5" />
              Tracked Videos
          </CardTitle>
          <CardDescription>
              Monitor videos being tracked for AI-powered content generation and script ideas
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
                  <SelectItem value="date_scraped">Date Scraped</SelectItem>
                  <SelectItem value="date">Date Published</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                  <SelectItem value="likes">Most Liked</SelectItem>
                  <SelectItem value="comments">Most Commented</SelectItem>
                  <SelectItem value="impressions">Most Impressions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px]">Video</TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="text-xs">Views</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span className="text-xs">Likes</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="text-xs">Comments</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">Duration</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <BarChart className="h-3.5 w-3.5" />
                        <span className="text-xs">Impressions</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">Scraped</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-14 w-24 rounded" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
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
                    currentVideos.map((video) => (
                      <TableRow 
                        key={video.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(video)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img 
                              src={video.thumbnail_url} 
                              alt={video.video_title}
                              className="w-24 h-14 object-cover rounded shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium break-words pr-4 text-sm">{video.video_title}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(video.date_published), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {video.views_count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {video.likes_count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {video.comments_count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatDuration(video.duration)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {video.impressions.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(video.last_scraped_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="rounded-full h-7 px-3 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(video);
                              }}
                            >
                              View More
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(video.video_url, '_blank');
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => handleDeleteVideo(video.video_id, e)}
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

            {!loading && videos.length > 0 && (
              <div className="flex items-center justify-between gap-2 mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, videos.length)} of {videos.length} videos
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
        data={selectedVideo}
        fields={detailFields}
        title="Video Details"
      />
    </>
  );
};

export default VideosAnalytics; 