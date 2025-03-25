import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScriptIdea } from '@/types/scriptPipeline';
import { Plus } from 'lucide-react';

interface ChannelAccount {
  id: string;
  channel_id: string;
}

interface NewIdeaDialogProps {
  accounts: ChannelAccount[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (idea: Partial<ScriptIdea>) => void;
}

const NewIdeaDialog: React.FC<NewIdeaDialogProps> = ({
  accounts,
  open,
  onOpenChange,
  onAdd,
}) => {
  const [newIdea, setNewIdea] = useState<Partial<ScriptIdea>>({
    title: '',
    description: '',
    target_duration: '',
    account: '',
    status: 'Idea Submitted'
  });

  const handleAddIdea = () => {
    onAdd({
      ...newIdea,
      status: 'Idea Submitted'
    });
    
    // Reset form after submission
    setNewIdea({
      title: '',
      description: '',
      target_duration: '',
      account: '',
      status: 'Idea Submitted'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Idea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Add New Script Idea</DialogTitle>
          <DialogDescription>
            Create a new script idea to add to your content pipeline.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder="e.g., 10 React Hooks Every Developer Should Know" 
                value={newIdea.title} 
                onChange={e => setNewIdea({
                  ...newIdea,
                  title: e.target.value
                })} 
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Brief description of what the video will cover" 
                value={newIdea.description} 
                onChange={e => setNewIdea({
                  ...newIdea,
                  description: e.target.value
                })} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Target Duration</Label>
                <div className="relative">
                  <Input 
                    id="duration" 
                    placeholder="10" 
                    value={newIdea.target_duration} 
                    onChange={e => setNewIdea({
                      ...newIdea,
                      target_duration: e.target.value
                    })} 
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
                  value={newIdea.account} 
                  onValueChange={value => setNewIdea({
                    ...newIdea,
                    account: value
                  })}
                >
                  <SelectTrigger id="channel">
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
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button onClick={handleAddIdea}>Add Script Idea</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewIdeaDialog;
