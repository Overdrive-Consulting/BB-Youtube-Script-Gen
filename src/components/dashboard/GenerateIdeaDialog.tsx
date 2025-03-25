import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sparkles, Link as LinkIcon, Users, UserCircle, Building, Clock } from 'lucide-react';
import { useAudienceProfiles } from '@/hooks/useAudienceProfiles';
import { useScriptIdeas } from '@/hooks/useScriptIdeas';
import { Input } from '@/components/ui/input';

interface ChannelAccount {
  id: string;
  channel_id: string;
  target_audiences?: string;
  channel_url?: string;
  status?: string;
}

interface GenerateIdeaDialogProps {
  accounts: ChannelAccount[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (account: string) => void;
}

const GenerateIdeaDialog: React.FC<GenerateIdeaDialogProps> = ({
  accounts,
  open,
  onOpenChange,
  onGenerate,
}) => {
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const { parseTargetAudiences } = useScriptIdeas();
  
  // States for account details
  const [selectedAccountDetails, setSelectedAccountDetails] = useState<{
    channelUrl: string;
    targetAudiences: string[];
  }>({
    channelUrl: '',
    targetAudiences: []
  });

  // State for audience data
  const [audienceData, setAudienceData] = useState<{
    age_group: string;
    gender: string;
    geographic_region: string;
    interests: string;
    primary_motivation: string;
  }>({
    age_group: '',
    gender: '',
    geographic_region: '',
    interests: '',
    primary_motivation: ''
  });

  // Use the audience profiles hook
  const {
    data: audienceProfiles = [],
    isLoading: isLoadingAudienceProfile
  } = useAudienceProfiles(selectedAccountDetails.targetAudiences[0] || '');

  // Update account details when account selection changes
  useEffect(() => {
    if (!selectedAccount) {
      setSelectedAccountDetails({ channelUrl: '', targetAudiences: [] });
      setAudienceData({ age_group: '', gender: '', geographic_region: '', interests: '', primary_motivation: '' });
      return;
    }

    const account = accounts.find(acc => acc.channel_id === selectedAccount);
    if (account) {
      const audiences = parseTargetAudiences(account.target_audiences || '');
      setSelectedAccountDetails({
        channelUrl: account.channel_url || '',
        targetAudiences: audiences
      });
    }
  }, [selectedAccount, accounts, parseTargetAudiences]);

  // Update audience data when audience profiles change
  useEffect(() => {
    if (audienceProfiles.length > 0) {
      const profile = audienceProfiles[0];
      setAudienceData({
        age_group: profile.age_group || '',
        gender: profile.gender || '',
        geographic_region: profile.geographic_region || '',
        interests: profile.interests || '',
        primary_motivation: profile.primary_motivation || ''
      });
    }
  }, [audienceProfiles]);

  const handleGenerate = () => {
    if (!selectedAccount || !duration) {
      return;
    }

    // Prepare the payload with all account details
    const payload = {
      timestamp: new Date().toISOString(),
      duration: parseInt(duration, 10),
      account: selectedAccount,
      channel_url: selectedAccountDetails.channelUrl,
      target_audience: selectedAccountDetails.targetAudiences.join(', '),
      age_group: audienceData.age_group,
      gender: audienceData.gender,
      geographic_region: audienceData.geographic_region,
      interests: audienceData.interests,
      primary_motivation: audienceData.primary_motivation
    };

    onGenerate(JSON.stringify(payload));
    setSelectedAccount('');
    setDuration('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Generate Idea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Script Idea</DialogTitle>
          <DialogDescription>
            Set the duration and select an account to generate a new script idea using AI.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Duration Field */}
          <div className="grid gap-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              Duration (minutes)
            </Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="60"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Enter video duration in minutes"
              className="col-span-3"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account">Account</Label>
            <Select
              value={selectedAccount}
              onValueChange={setSelectedAccount}
            >
              <SelectTrigger id="account">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(channel => (
                  <SelectItem key={channel.id} value={channel.channel_id || ''}>
                    {channel.channel_id || 'Unnamed Account'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Details Section */}
          {selectedAccount && (
            <div className="mt-4 p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
              <h3 className="text-sm font-medium text-slate-900 mb-3">Account Details</h3>
              
              {/* Channel URL */}
              {selectedAccountDetails.channelUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <LinkIcon className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">Channel URL:</span>
                  <a 
                    href={selectedAccountDetails.channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {selectedAccountDetails.channelUrl}
                  </a>
                </div>
              )}

              {/* Target Audience */}
              {selectedAccountDetails.targetAudiences.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">Target Audience:</span>
                  <span className="text-slate-900">
                    {selectedAccountDetails.targetAudiences.join(', ')}
                  </span>
                </div>
              )}

              {/* Age Group */}
              {audienceData.age_group && (
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">Age Group:</span>
                  <span className="text-slate-900">{audienceData.age_group}</span>
                </div>
              )}

              {/* Gender */}
              {audienceData.gender && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">Gender:</span>
                  <span className="text-slate-900">{audienceData.gender}</span>
                </div>
              )}

              {/* Geographic Region */}
              {audienceData.geographic_region && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">Geographic Region:</span>
                  <span className="text-slate-900">{audienceData.geographic_region}</span>
                </div>
              )}

              {/* Interests */}
              {audienceData.interests && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">Interests:</span>
                  <span className="text-slate-900">{audienceData.interests}</span>
                </div>
              )}

              {/* Primary Motivation */}
              {audienceData.primary_motivation && (
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">Primary Motivation:</span>
                  <span className="text-slate-900">{audienceData.primary_motivation}</span>
                </div>
              )}

              {isLoadingAudienceProfile && (
                <div className="text-sm text-slate-500">Loading audience details...</div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleGenerate}
            disabled={!selectedAccount || !duration}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateIdeaDialog; 