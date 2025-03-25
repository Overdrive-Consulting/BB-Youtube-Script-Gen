import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScriptIdea } from '@/types/scriptPipeline';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useScriptIdeas } from '@/hooks/useScriptIdeas';
import { useAudienceProfiles } from '@/hooks/useAudienceProfiles';
import { Loader2, ExternalLink, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface EditScriptIdeaDialogProps {
  scriptIdea: ScriptIdea | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedIdea: ScriptIdea) => void;
}

interface ChannelAccount {
  id: string;
  channel_id: string;
  target_audiences?: string;
  channel_url?: string;
  status?: string;
}

const EditScriptIdeaDialog: React.FC<EditScriptIdeaDialogProps> = ({ 
  scriptIdea, open, onOpenChange, onSave 
}) => {
  const { parseTargetAudiences } = useScriptIdeas();
  const [editedIdea, setEditedIdea] = useState<ScriptIdea | null>(scriptIdea);
  const [accounts, setAccounts] = useState<ChannelAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableAudiences, setAvailableAudiences] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [selectedAudienceName, setSelectedAudienceName] = useState<string>('');
  
  // Keep audience data in a separate state to avoid saving it directly from form inputs
  const [audienceData, setAudienceData] = useState<{
    age_group: string;
    gender: string;
  }>({ age_group: '', gender: '' });
  
  const [selectedAccountDetails, setSelectedAccountDetails] = useState<{
    channelUrl: string;
    status: string;
  }>({ channelUrl: '', status: '' });

  // Fetch audience profile information
  const { 
    data: audienceProfiles = [], 
    isLoading: isLoadingAudienceProfiles,
  } = useAudienceProfiles(selectedAudienceName);
  
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [publishDate, setPublishDate] = useState<string>('');
  const [showNotes, setShowNotes] = useState(false);

  // Fetch accounts from Supabase
  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('accounts_settings')
          .select('id, channel_id, target_audiences, channel_url, status');
        
        if (error) {
          console.error('Error fetching accounts:', error);
          toast.error('Failed to load accounts');
        } else {
          console.log('Accounts fetched:', data);
          setAccounts(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
        toast.error('Failed to load accounts');
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchAccounts();
    }
  }, [open]);

  // Update local state when the scriptIdea prop changes
  useEffect(() => {
    if (!scriptIdea) return;
    
    setEditedIdea(scriptIdea);
    
    // Set audience data from script idea
    setAudienceData({
      age_group: scriptIdea.age_group || '',
      gender: scriptIdea.gender || ''
    });
    
    // Set selected audiences when scriptIdea changes
    if (scriptIdea.target_audiences) {
      const audienceArray = parseTargetAudiences(scriptIdea.target_audiences);
      setSelectedAudiences(audienceArray);
      
      // Set the audience name for profile lookup if available
      if (audienceArray.length > 0) {
        setSelectedAudienceName(audienceArray[0]);
      }
    } else {
      setSelectedAudiences([]);
      setSelectedAudienceName('');
    }
  }, [scriptIdea, parseTargetAudiences]);

  // Update available audiences when account changes
  useEffect(() => {
    if (!editedIdea?.account) return;
    
    const selectedAccount = accounts.find(acc => acc.channel_id === editedIdea.account);
    if (selectedAccount) {
      // Update the selected account details
      setSelectedAccountDetails({
        channelUrl: selectedAccount.channel_url || '',
        status: selectedAccount.status || ''
      });

      // Process target audiences
      if (selectedAccount.target_audiences) {
        const audienceArray = parseTargetAudiences(selectedAccount.target_audiences);
        setAvailableAudiences(audienceArray);
        
        // Auto-select the first audience when account changes
        if (audienceArray.length > 0) {
          setSelectedAudiences([audienceArray[0]]);
          setSelectedAudienceName(audienceArray[0]);
        }
      } else {
        setAvailableAudiences([]);
      }
    }
  }, [editedIdea?.account, accounts, parseTargetAudiences]);

  // Update age group and gender when audience profile data changes
  useEffect(() => {
    if (audienceProfiles.length > 0) {
      const profile = audienceProfiles[0];
      
      // Update the audience data state instead of directly modifying editedIdea
      setAudienceData({
        age_group: profile.age_group || '',
        gender: profile.gender || ''
      });
    }
  }, [audienceProfiles]);

  // Update approval state when scriptIdea changes
  useEffect(() => {
    if (scriptIdea) {
      setIsApproved(scriptIdea.status === 'Scheduled');
      setPublishDate(scriptIdea.publish_date || '');
    }
  }, [scriptIdea]);

  if (!editedIdea) return null;

  const handleSave = () => {
    // Create a clean copy of the edited idea
    const updatedIdea = {
      ...editedIdea,
      target_audiences: selectedAudiences.length > 0 ? selectedAudiences[0] : '',
      age_group: audienceData.age_group,
      gender: audienceData.gender
    };

    // Update status based on approval and publish date
    if (editedIdea.status === 'Reviewed') {
      if (isApproved && publishDate) {
        updatedIdea.status = 'Scheduled';
        updatedIdea.publish_date = publishDate;
      } else if (isApproved === false) {
        updatedIdea.status = 'Reviewed';
        updatedIdea.publish_date = '';
      }
    }
    
    console.log('Saving idea:', updatedIdea);
    onSave(updatedIdea);
    onOpenChange(false);
  };

  const handleChange = (field: keyof ScriptIdea, value: any) => {
    setEditedIdea(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const handleAudienceChange = (audience: string, checked: boolean) => {
    // Instead of adding to an array, just set the single audience
    if (checked) {
      setSelectedAudiences([audience]);
      setSelectedAudienceName(audience);
    } else {
      setSelectedAudiences([]);
      setSelectedAudienceName('');
    }
  };

  // Extract duration number from the string
  const getDurationValue = () => {
    const duration = editedIdea.target_duration || '';
    return duration.replace(/\s*mins?$/, '');
  };

  // Check if the script has been generated (any status after Idea Submitted)
  const isIdeaSubmitted = editedIdea.status === 'Idea Submitted';

  // Handle approval state change
  const handleApproval = (approved: boolean) => {
    setIsApproved(approved);
    if (!approved) {
      setPublishDate('');
    }
    // Don't change status here, wait for save
  };

  // Handle publish date change
  const handlePublishDateChange = (date: string) => {
    setPublishDate(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isIdeaSubmitted ? 'Edit Script Idea' : 'Script Details'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* For Idea Submitted status, show basic fields */}
          {isIdeaSubmitted ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editedIdea.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editedIdea.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Target Duration</Label>
                  <div className="relative">
                    <Input
                      id="duration"
                      value={getDurationValue()}
                      onChange={(e) => handleChange('target_duration', `${e.target.value} mins`)}
                      className="pr-12"
                      type="number"
                      min="1"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      mins
                    </span>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="channel">Account</Label>
                  <Select 
                    value={editedIdea.account} 
                    onValueChange={(value) => handleChange('account', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="channel">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem value="loading" disabled>Loading accounts...</SelectItem>
                      ) : (
                        accounts.map(account => (
                          <SelectItem key={account.id} value={account.channel_id}>
                            {account.channel_id}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Channel URL field - auto-populated based on selected account */}
              {editedIdea.account && (
                <div className="grid gap-2">
                  <Label htmlFor="channel-url">Channel URL</Label>
                  <Input
                    id="channel-url"
                    value={selectedAccountDetails.channelUrl}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              )}
              
              {/* Target Audiences field - visible only when an account is selected */}
              {editedIdea.account && availableAudiences.length > 0 && (
                <div className="grid gap-2">
                  <Label htmlFor="target-audiences">Target Audiences</Label>
                  {isLoading ? (
                    <div className="flex items-center space-x-2 h-[150px] border rounded-md p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading audiences...</span>
                    </div>
                  ) : (
                    <ScrollArea className="h-[150px] border rounded-md p-4">
                      <div className="space-y-2">
                        {availableAudiences.map((audience) => (
                          <div key={audience} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`audience-${audience}`}
                              checked={selectedAudiences.includes(audience)}
                              onCheckedChange={(checked) => handleAudienceChange(audience, !!checked)}
                            />
                            <label 
                              htmlFor={`audience-${audience}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {audience}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
              
              {/* Age Group field - READ-ONLY */}
              <div className="grid gap-2">
                <Label htmlFor="age-group">Age Group</Label>
                <Input
                  id="age-group"
                  value={audienceData.age_group}
                  readOnly
                  className="bg-muted"
                  placeholder={isLoadingAudienceProfiles ? 'Loading...' : ''}
                />
              </div>
              
              {/* Gender field - READ-ONLY */}
              <div className="grid gap-2">
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  value={audienceData.gender}
                  readOnly
                  className="bg-muted"
                  placeholder={isLoadingAudienceProfiles ? 'Loading...' : ''}
                />
              </div>
            </>
          ) : (
            // For other statuses (Content Generated, Reviewed, Scheduled), show all fields
            <>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editedIdea.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                />
              </div>
              
              {/* Script Title field */}
              <div className="grid gap-2">
                <Label htmlFor="generated-title">Script Title</Label>
                <Input
                  id="generated-title"
                  value={editedIdea.generated_title || ''}
                  onChange={(e) => handleChange('generated_title', e.target.value)}
                />
              </div>
              
              {/* Script Link field */}
              <div className="grid gap-2">
                <Label htmlFor="generated-script-link">Script</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="generated-script-link"
                    value={editedIdea.generated_script_link || ''}
                    onChange={(e) => handleChange('generated_script_link', e.target.value)}
                  />
                  {editedIdea.generated_script_link && (
                    <a 
                      href={editedIdea.generated_script_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-2 text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
              
              {/* Script Thumbnail field */}
              <div className="grid gap-2">
                <Label htmlFor="generated-thumbnail">Script Thumbnail</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="generated-thumbnail"
                    value={editedIdea.generated_thumbnail || ''}
                    onChange={(e) => handleChange('generated_thumbnail', e.target.value)}
                  />
                  {editedIdea.generated_thumbnail && (
                    <a 
                      href={editedIdea.generated_thumbnail} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-2 text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
              
              {/* Video Type field */}
              <div className="grid gap-2">
                <Label htmlFor="video-type">Video Type</Label>
                <Input
                  id="video-type"
                  value={editedIdea.video_type || ''}
                  onChange={(e) => handleChange('video_type', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Target Duration</Label>
                  <div className="relative">
                    <Input
                      id="duration"
                      value={getDurationValue()}
                      onChange={(e) => handleChange('target_duration', `${e.target.value} mins`)}
                      className="pr-12"
                      type="number"
                      min="1"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      mins
                    </span>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="channel">Account</Label>
                  <Input
                    id="channel"
                    value={editedIdea.account || ''}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
              
              {/* Target Audience field */}
              {editedIdea.target_audiences && (
                <div className="grid gap-2">
                  <Label htmlFor="target-audience">Target Audience</Label>
                  <Input
                    id="target-audience"
                    value={editedIdea.target_audiences}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              )}
              
              {/* Description field */}
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editedIdea.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              {/* Notes Toggle and Field */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-notes"
                    checked={showNotes}
                    onCheckedChange={(checked) => setShowNotes(!!checked)}
                  />
                  <Label htmlFor="show-notes" className="text-sm cursor-pointer">
                    Add Notes
                  </Label>
                </div>
                
                {showNotes && (
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={editedIdea.notes || ''}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder="Add notes here"
                      className="min-h-[100px]"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Approval Section - Only show for Reviewed status */}
          {editedIdea.status === 'Reviewed' && (
            <div className="mt-6 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-900">Approve?</h3>
                <Badge variant="outline" className="text-xs bg-slate-100/50">
                  Pending Review
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={isApproved ? "default" : "outline"}
                  className={`flex-1 ${isApproved ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' : 'hover:bg-emerald-50'}`}
                  onClick={() => handleApproval(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={isApproved === false ? "default" : "outline"}
                  className={`flex-1 ${isApproved === false ? 'bg-red-50 hover:bg-red-100 text-red-700' : 'hover:bg-red-50'}`}
                  onClick={() => handleApproval(false)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  No
                </Button>
              </div>

              {/* Publish Date Section - Only show when approved */}
              {isApproved && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="publish-date" className="flex items-center gap-2 text-slate-900">
                    <Calendar className="h-4 w-4" />
                    Schedule Publish Date
                  </Label>
                  <Input
                    id="publish-date"
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => handlePublishDateChange(e.target.value)}
                    className="bg-white"
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  />
                  {publishDate && (
                    <p className="text-xs text-slate-600">
                      Will be published on {format(new Date(publishDate), 'PPPp')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Show scheduled info if status is Scheduled */}
          {editedIdea.status === 'Scheduled' && publishDate && (
            <div className="mt-4 p-4 rounded-lg border border-emerald-100 bg-emerald-50/30">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-emerald-900">Publishing Schedule</h3>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  Scheduled
                </Badge>
              </div>
              <p className="mt-2 text-sm text-emerald-800">
                Scheduled to publish on {format(new Date(publishDate), 'PPPp')}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditScriptIdeaDialog;
