import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart as BarChartIcon,
  TrendingUp,
  Users,
  PlaySquare,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  Zap,
  LineChart,
  Activity,
  HelpCircle,
  PenLine,
  ExternalLink,
  RefreshCw,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { PIPELINE_STAGES } from '@/types/scriptPipeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardMetrics {
  totalVideos: number;
  totalChannels: number;
  totalViews: number;
  totalSubscribers: number;
  totalLikes: number;
  totalComments: number;
  avgViralityScore: number;
  trackedVideos: number;
  trackedChannels: number;
  trackedPercentage: number;
  lastScrapedDate: string;
  highEngagementCount: number;
  trendingTopicsCount: number;
  recentlyUpdated: {
    videos: {
      id: string;
      title: string;
      date: string;
      views: number;
      thumbnail?: string;
      url?: string;
    }[];
    channels: {
      id: string;
      name: string;
      date: string;
      subscribers: number;
      url?: string;
    }[];
    scriptIdeas: {
      id: string;
      title: string;
      status: string;
      created_at: string;
      account: string;
      generated_title?: string;
      generated_script_link?: string;
      target_audiences?: string;
    }[];
  };
  topGrowingChannels: any[];
  topPerformingVideos: any[];
  engagementOverTime: any[];
  contentDistribution: any[];
  scriptMetrics: {
    totalIdeas: number;
    byStage: {
      id: string;
      label: string;
      count: number;
    }[];
    conversionRates: {
      ideaToGenerated: number;
      generatedToReviewed: number;
      reviewedToScheduled: number;
    };
    avgTimeInStage: {
      ideaToGenerated: number;
      generatedToReviewed: number;
      reviewedToScheduled: number;
    };
    topAccounts: {
      name: string;
      count: number;
    }[];
    topAudiences: {
      name: string;
      count: number;
    }[];
  };
}

const Overview: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('views');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Overview component mounted');
    fetchDashboardData();
  }, [selectedTimeRange]);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...', selectedTimeRange);
      setLoading(true);
      setError(null);

      // Calculate the date range based on selectedTimeRange
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      switch (selectedTimeRange) {
        case '7d':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 90);
          break;
        case 'this-year':
          startDate = new Date(now.getFullYear(), 0, 1); // January 1st of current year
          break;
        case 'last-year':
          startDate = new Date(now.getFullYear() - 1, 0, 1); // January 1st of last year
          endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999); // December 31st of last year
          break;
        case 'all':
        default:
          // Don't set any date filters
          break;
      }

      // Build query for videos
      let videosQuery = supabase.from('videos').select('*');
      if (startDate) {
        videosQuery = videosQuery.gte('date_published', startDate.toISOString());
      }
      if (endDate) {
        videosQuery = videosQuery.lte('date_published', endDate.toISOString());
      }

      // Fetch videos
      const { data: videosData, error: videosError } = await videosQuery;

      if (videosError) {
        console.error('Error fetching videos:', videosError);
        throw videosError;
      }

      // Build query for channels
      let channelsQuery = supabase.from('channels').select('*');
      if (startDate) {
        channelsQuery = channelsQuery.gte('date_joined', startDate.toISOString());
      }
      if (endDate) {
        channelsQuery = channelsQuery.lte('date_joined', endDate.toISOString());
      }

      // Fetch channels
      const { data: channelsData, error: channelsError } = await channelsQuery;

      if (channelsError) {
        console.error('Error fetching channels:', channelsError);
        throw channelsError;
      }

      // Build query for script pipeline data
      let scriptPipelineQuery = supabase.from('video_generator_script_pipeline').select('*');
      if (startDate) {
        scriptPipelineQuery = scriptPipelineQuery.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        scriptPipelineQuery = scriptPipelineQuery.lte('created_at', endDate.toISOString());
      }

      // Fetch script pipeline data
      const { data: scriptPipelineData, error: scriptPipelineError } = await scriptPipelineQuery;

      if (scriptPipelineError) {
        console.error('Error fetching script pipeline data:', scriptPipelineError);
        throw scriptPipelineError;
      }

      // Fetch recent script pipeline data (this should always get the most recent 5, regardless of date filter)
      const { data: recentScriptPipelineData, error: recentScriptPipelineError } = await supabase
        .from('video_generator_script_pipeline')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentScriptPipelineError) {
        console.error('Error fetching recent script pipeline data:', recentScriptPipelineError);
        throw recentScriptPipelineError;
      }

      // Process data for metrics
      console.log('Processing metrics...');
      const processedMetrics: DashboardMetrics = {
        totalVideos: videosData.length,
        totalChannels: channelsData.length,
        trackedVideos: videosData.filter(v => v.is_tracked).length,
        trackedChannels: channelsData.filter(c => c.is_tracked).length,
        trackedPercentage: Math.round((videosData.filter(v => v.is_tracked).length / videosData.length) * 100),
        lastScrapedDate: getLatestScrapeDate(videosData),
        highEngagementCount: getHighEngagementCount(videosData),
        trendingTopicsCount: getTopicCount(videosData),
        totalViews: videosData.reduce((sum, video) => sum + (Number(video.views_count) || 0), 0),
        totalSubscribers: channelsData.reduce((sum, channel) => sum + (Number(channel.subscribers) || 0), 0),
        totalLikes: videosData.reduce((sum, video) => sum + (Number(video.likes_count) || 0), 0),
        totalComments: videosData.reduce((sum, video) => sum + (Number(video.comments_count) || 0), 0),
        avgViralityScore: videosData.reduce((sum, video) => sum + (Number(video.virality_score) || 0), 0) / videosData.length,
        recentlyUpdated: {
          videos: videosData.slice(0, 5).map(video => ({
            id: video.video_id || 'unknown',
            title: video.video_title || 'Untitled Video',
            date: video.date_published || '',
            views: Number(video.views_count) || 0,
            thumbnail: video.thumbnail_url || '',
            url: video.video_url || ''
          })),
          channels: channelsData
            .sort((a, b) => (b.subscribers || 0) - (a.subscribers || 0))
            .slice(0, 5)
            .map(channel => ({
              id: channel.channel_id || 'unknown',
              name: channel.channel_name || 'Untitled Channel',
              date: channel.date_joined || '',
              subscribers: Number(channel.subscribers) || 0,
              url: channel.channel_url || ''
            })),
          scriptIdeas: recentScriptPipelineData
            .filter(idea => idea.status === "Idea Submitted" || idea.status === "Content Generated")
            .map(idea => ({
              id: idea.id,
              title: idea.title,
              status: idea.status,
              created_at: idea.created_at,
              account: idea.account,
              generated_title: idea.generated_title,
              generated_script_link: idea.generated_script_link,
              target_audiences: idea.target_audiences
            }))
        },
        topGrowingChannels: channelsData
          .sort((a, b) => (Number(b.growth_3mo) || 0) - (Number(a.growth_3mo) || 0))
          .slice(0, 5)
          .map(channel => ({
            name: channel.channel_name,
            growth: Number(channel.growth_3mo) || 0,
            subscribers: Number(channel.subscribers) || 0
          })),
        topPerformingVideos: videosData
          .sort((a, b) => (Number(b.virality_score) || 0) - (Number(a.virality_score) || 0))
          .slice(0, 5)
          .map(video => ({
            title: video.video_title,
            views: Number(video.views_count) || 0,
            likes: Number(video.likes_count) || 0,
            comments: Number(video.comments_count) || 0,
            virality: Number(video.virality_score) || 0
          })),
        engagementOverTime: processEngagementData(videosData, selectedTimeRange),
        contentDistribution: processContentDistribution(videosData, channelsData),
        scriptMetrics: processScriptPipelineMetrics(scriptPipelineData || []),
      };

      console.log('Metrics processed successfully:', processedMetrics);
      setMetrics(processedMetrics);
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching data';
      setError(errorMessage);
      toast.error('Failed to load dashboard data', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const processEngagementData = (videosData: any[], timeRange: string) => {
    // Process video history data based on selected time range
    const daysToShow = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const now = new Date();
    const dates = Array.from({ length: daysToShow }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    // Simulate engagement data (replace with actual video_history data processing)
    return dates.map(date => ({
      date,
      views: Math.floor(Math.random() * 10000),
      likes: Math.floor(Math.random() * 1000),
      comments: Math.floor(Math.random() * 100)
    }));
  };

  const processContentDistribution = (videosData: any[], channelsData: any[]) => {
    // Process content distribution data
    return [
      { name: 'Videos', tracked: videosData?.filter(v => v.is_tracked).length || 0, total: videosData?.length || 0 },
      { name: 'Channels', tracked: channelsData?.filter(c => c.is_tracked).length || 0, total: channelsData?.length || 0 }
    ];
  };

  const getLatestScrapeDate = (videosData: any[]) => {
    if (!videosData?.length) return 'No data';
    const latestDate = new Date(Math.max(...videosData.map(v => 
      new Date(v.last_scraped_at).getTime()
    )));
    return !isNaN(latestDate.getTime()) 
      ? formatDistanceToNow(latestDate, { addSuffix: true })
      : 'No data';
  };

  const getHighEngagementCount = (videosData: any[]) => {
    return videosData?.filter(v => 
      (v.views_count > 100000 || v.likes_count > 10000) && 
      v.is_tracked
    ).length || 0;
  };

  const getTopicCount = (videosData: any[]) => {
    const topics = new Set(
      videosData
        ?.filter(v => v.is_tracked && v.virality_score > 7)
        .map(v => v.video_title.toLowerCase())
        .flatMap(title => title.split(/\s+/))
        .filter(word => word.length > 4)
    );
    return topics.size;
  };

  // Process script pipeline metrics
  const processScriptPipelineMetrics = (pipelineData: any[]) => {
    // Count ideas by stage
    const byStage = PIPELINE_STAGES.map(stage => ({
      id: stage.id,
      label: stage.label,
      count: pipelineData.filter(idea => idea.status === stage.dbStatus).length
    }));

    // Calculate conversion rates between stages
    const ideaCount = byStage.find(s => s.id === 'idea')?.count || 0;
    const generatedCount = byStage.find(s => s.id === 'generated')?.count || 0;
    const reviewedCount = byStage.find(s => s.id === 'reviewed')?.count || 0;
    const scheduledCount = byStage.find(s => s.id === 'published')?.count || 0;

    const conversionRates = {
      ideaToGenerated: ideaCount > 0 ? Math.round((generatedCount / ideaCount) * 100) : 0,
      generatedToReviewed: generatedCount > 0 ? Math.round((reviewedCount / generatedCount) * 100) : 0,
      reviewedToScheduled: reviewedCount > 0 ? Math.round((scheduledCount / reviewedCount) * 100) : 0
    };

    // Calculate average time in each stage (in days)
    // This would require detailed timestamp data for when ideas move between stages
    // For now, use placeholder data
    const avgTimeInStage = {
      ideaToGenerated: 2, // Placeholder: 2 days average
      generatedToReviewed: 1, // Placeholder: 1 day average
      reviewedToScheduled: 3 // Placeholder: 3 days average
    };

    // Get top accounts
    const accountCounts = pipelineData.reduce((acc: any, idea: any) => {
      if (idea.account) {
        acc[idea.account] = (acc[idea.account] || 0) + 1;
      }
      return acc;
    }, {});

    const topAccounts = Object.entries(accountCounts)
      .map(([name, count]: [string, any]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get top target audiences
    const audienceCounts = pipelineData.reduce((acc: any, idea: any) => {
      // Only count valid audience values (not empty, null, '[]', or too short)
      if (idea.target_audiences && 
          idea.target_audiences !== '[]' && 
          idea.target_audiences.trim() !== '' &&
          idea.target_audiences.length > 1) {
        acc[idea.target_audiences] = (acc[idea.target_audiences] || 0) + 1;
      }
      return acc;
    }, {});

    const topAudiences = Object.entries(audienceCounts)
      .map(([name, count]: [string, any]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalIdeas: pipelineData.length,
      byStage,
      conversionRates,
      avgTimeInStage,
      topAccounts,
      topAudiences
    };
  };

  return (
    <div className="space-y-12">
      {error ? (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-700 mb-8">
          <p className="font-medium">Error loading dashboard</p>
          <p className="text-sm mt-1">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchDashboardData()}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold">Analytics</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Time Range:</span>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="this-year">This year</SelectItem>
                  <SelectItem value="last-year">Last year</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    Tracked Content
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Videos and channels you're actively tracking for content generation</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <PlaySquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-7 w-[100px]" />
                  ) : (
                    <>
                      <div className="text-xl font-bold">
                        {metrics?.trackedVideos.toLocaleString()} videos
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {metrics?.trackedChannels.toLocaleString()} tracked channels
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        {metrics?.trackedPercentage}% of total content
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    Scraped Content
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Total videos and channels collected from YouTube, including tracked and untracked content</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-7 w-[100px]" />
                  ) : (
                    <>
                      <div className="text-xl font-bold">{metrics?.totalVideos.toLocaleString()} videos</div>
                      <div className="text-xs text-muted-foreground">
                        {metrics?.totalChannels.toLocaleString()} channels
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Last scraped: {metrics?.lastScrapedDate}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    Content Potential
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Videos with high engagement ({'>'}100K views or {'>'}10K likes) that are ideal for script inspiration</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-7 w-[100px]" />
                  ) : (
                    <>
                      <div className="text-xl font-bold">{metrics?.highEngagementCount.toLocaleString()} videos</div>
                      <div className="text-xs text-muted-foreground">
                        High engagement content
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        Potential script ideas
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Script Idea Generation Metrics */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold mb-6">Script Generation Pipeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    Script Ideas
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Total number of script ideas across all pipeline stages</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <PenLine className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-7 w-[100px]" />
                  ) : (
                    <>
                      <div className="text-xl font-bold">
                        {metrics?.scriptMetrics.totalIdeas.toLocaleString()} ideas
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Across all stages
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {metrics?.scriptMetrics.byStage.map((stage) => (
                          <Badge key={stage.id} variant="outline" className="justify-between">
                            {stage.label} <span className="ml-2">{stage.count}</span>
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    Pipeline Conversion
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Conversion rate between pipeline stages showing how effectively ideas progress</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-7 w-[100px]" />
                  ) : (
                    <>
                      <div className="text-xl font-bold">
                        {metrics?.scriptMetrics.conversionRates.ideaToGenerated}% conversion
                      </div>
                      <div className="text-xs text-muted-foreground">
                        From idea to generated
                      </div>
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Idea → Generated</span>
                          <span className="text-xs font-medium">{metrics?.scriptMetrics.conversionRates.ideaToGenerated}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Generated → Reviewed</span>
                          <span className="text-xs font-medium">{metrics?.scriptMetrics.conversionRates.generatedToReviewed}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Reviewed → Scheduled</span>
                          <span className="text-xs font-medium">{metrics?.scriptMetrics.conversionRates.reviewedToScheduled}%</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    Top Accounts
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Most active accounts with the highest number of script ideas</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-7 w-[100px]" />
                  ) : (
                    <>
                      <div className="text-xl font-bold">
                        {metrics?.scriptMetrics.topAccounts[0]?.name || 'None'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {metrics?.scriptMetrics.topAccounts[0]?.count || 0} ideas generated
                      </div>
                      <div className="space-y-2 mt-3">
                        {metrics?.scriptMetrics.topAccounts.slice(1).map((account, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs truncate max-w-[150px]">{account.name}</span>
                            <span className="text-xs font-medium">{account.count} ideas</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    Top Audiences
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Most targeted audience demographics for content creation</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-7 w-[100px]" />
                  ) : (
                    <>
                      <div className="text-xl font-bold">
                        {metrics?.scriptMetrics.topAudiences[0]?.name || 'None'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {metrics?.scriptMetrics.topAudiences[0]?.count || 0} ideas targeted
                      </div>
                      <div className="space-y-2 mt-3">
                        {metrics?.scriptMetrics.topAudiences.slice(1).map((audience, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs truncate max-w-[150px]">{audience.name}</span>
                            <span className="text-xs font-medium">{audience.count} ideas</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Engagement Over Time Chart */}
          <div className="mb-16">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-1">
                  Engagement Trends
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Shows how engagement metrics change over time to help identify trends</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>Track engagement metrics over time</CardDescription>
                <div className="flex items-center gap-4">
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="views">Views</SelectItem>
                      <SelectItem value="likes">Likes</SelectItem>
                      <SelectItem value="comments">Comments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Skeleton className="w-full h-[250px]" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={metrics?.engagementOverTime || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date"
                        tickFormatter={(value) => format(new Date(value), 'MMM d')}
                      />
                      <YAxis />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey={selectedMetric}
                        stroke="#2563eb"
                        strokeWidth={2}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Channel and Content Distribution */}
          <div className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Growing Channels */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-1">
                    Top Growing Channels
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>Channels with the highest subscriber growth rate in the last 3 months</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <CardDescription>Channels with highest 3-month growth</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {metrics?.topGrowingChannels.map((channel, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{channel.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {channel.subscribers.toLocaleString()} subscribers
                            </p>
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            +{channel.growth.toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Content Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-1">
                    Content Distribution
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>Shows proportion of tracked vs. total content, helping you understand your content coverage</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <CardDescription>Overview of tracked vs total content</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {loading ? (
                    <Skeleton className="w-full h-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics?.contentDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="tracked" fill="#2563eb" name="Tracked" />
                        <Bar dataKey="total" fill="#94a3b8" name="Total" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recently Updated Content */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1">
                  Recently Updated Content
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Recently updated videos, channels, and script ideas in your account</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>Track your latest content and script ideas</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Tabs defaultValue="videos">
                    <TabsList className="grid grid-cols-3 mb-4">
                      <TabsTrigger value="videos">Videos</TabsTrigger>
                      <TabsTrigger value="channels">Channels</TabsTrigger>
                      <TabsTrigger value="scripts">Script Ideas</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="videos">
                      {metrics?.recentlyUpdated.videos.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          <p className="mb-2">No videos found</p>
                          <p className="text-sm">This may occur if:</p>
                          <ul className="text-sm list-disc list-inside text-left max-w-md mx-auto mt-2">
                            <li>There are no videos in the database</li>
                            <li>The video data doesn't have publication dates</li>
                          </ul>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {metrics?.recentlyUpdated.videos.map((video, i) => (
                            <div key={i} className="flex items-center justify-between border-b pb-3">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={video.thumbnail || `https://placehold.co/120x68/e9deff/352b42?text=${encodeURIComponent(video.title || "Video")}`} 
                                  alt={video.title} 
                                  className="w-24 h-14 object-cover rounded shrink-0"
                                />
                                <div className="flex flex-col min-w-0">
                                  <p className="text-sm font-medium line-clamp-1">{video.title || 'Untitled Video'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {video.date && !isNaN(new Date(video.date).getTime())
                                      ? `Published ${formatDistanceToNow(new Date(video.date), { addSuffix: true })}`
                                      : 'Publication date not available'}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {video.views.toLocaleString()} views
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="gap-1"
                                        onClick={() => {
                                          if (video.url) window.open(video.url, '_blank');
                                        }}
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        <span className="sr-only sm:not-sr-only sm:inline">View</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <p>View on YouTube</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="channels">
                      {metrics?.recentlyUpdated.channels.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          <p className="mb-2">No channels found</p>
                          <p className="text-sm">This may occur if:</p>
                          <ul className="text-sm list-disc list-inside text-left max-w-md mx-auto mt-2">
                            <li>There are no channels in the database</li>
                            <li>The channel data doesn't have join dates</li>
                          </ul>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {metrics?.recentlyUpdated.channels.map((channel, i) => (
                            <div key={i} className="flex items-center justify-between border-b pb-3">
                              <div className="flex flex-col">
                                <p className="text-sm font-medium line-clamp-1">{channel.name || 'Untitled Channel'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {channel.date && !isNaN(new Date(channel.date).getTime())
                                    ? `Joined ${formatDistanceToNow(new Date(channel.date), { addSuffix: true })}`
                                    : 'Join date not available'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {channel.subscribers.toLocaleString()} subscribers
                                </p>
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="gap-1"
                                      onClick={() => {
                                        if (channel.url) window.open(channel.url, '_blank');
                                      }}
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      <span className="sr-only sm:not-sr-only sm:inline">Details</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left">
                                    <p>View channel on YouTube</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="scripts">
                      {metrics?.recentlyUpdated.scriptIdeas.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          <p className="mb-2">No script ideas found</p>
                          <p className="text-sm">This may occur if:</p>
                          <ul className="text-sm list-disc list-inside text-left max-w-md mx-auto mt-2">
                            <li>There are no script ideas in the database</li>
                            <li>No script ideas in "Idea Submitted" or "Content Generated" stages</li>
                          </ul>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {metrics?.recentlyUpdated.scriptIdeas.map((idea, i) => {
                            const stage = PIPELINE_STAGES.find(s => s.dbStatus === idea.status);
                            const iconName = stage?.id === 'idea' ? <PenLine className="h-3.5 w-3.5" /> : 
                                          stage?.id === 'generated' ? <Sparkles className="h-3.5 w-3.5" /> : 
                                          stage?.id === 'reviewed' ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />;
                            const stageColor = stage?.id === 'idea' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                                          stage?.id === 'generated' ? 'bg-purple-50 text-purple-600 border-purple-200' : 
                                          stage?.id === 'reviewed' ? 'bg-green-50 text-green-600 border-green-200' : 
                                          'bg-amber-50 text-amber-600 border-amber-200';
                            
                            return (
                              <div key={i} className="flex items-center justify-between border-b pb-3">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium line-clamp-1">{idea.title || 'Untitled Idea'}</p>
                                    <Badge variant="outline" className={`text-xs px-2 py-0 h-5 ${stageColor}`}>
                                      {stage?.label || idea.status}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Account: {idea.account || 'Not specified'}
                                  </p>
                                  {idea.target_audiences && (
                                    <p className="text-xs text-muted-foreground">
                                      Audience: {idea.target_audiences}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {idea.created_at && !isNaN(new Date(idea.created_at).getTime())
                                      ? `Created ${formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}`
                                      : 'Creation date not available'}
                                  </p>
                                </div>
                                
                                <div className="flex gap-2">
                                  {idea.generated_script_link && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="gap-1"
                                            onClick={() => {
                                              if (idea.generated_script_link) window.open(idea.generated_script_link, '_blank');
                                            }}
                                          >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            <span className="sr-only sm:not-sr-only sm:inline">View Script</span>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left">
                                          <p>View generated script</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Overview; 