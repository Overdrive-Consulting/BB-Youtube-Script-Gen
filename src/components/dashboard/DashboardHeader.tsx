import React from 'react';
import { ScriptIdea } from '@/types/scriptPipeline';
import NewIdeaDialog from './NewIdeaDialog';
import GenerateIdeaDialog from './GenerateIdeaDialog';

interface ChannelAccount {
  id: string;
  channel_id: string;
}

interface DashboardHeaderProps {
  accounts: ChannelAccount[];
  newIdeaDialogOpen: boolean;
  setNewIdeaDialogOpen: (open: boolean) => void;
  onAddIdea: (idea: Partial<ScriptIdea>) => void;
  generateDialogOpen: boolean;
  setGenerateDialogOpen: (open: boolean) => void;
  onGenerateIdea: (payload: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  accounts,
  newIdeaDialogOpen,
  setNewIdeaDialogOpen,
  onAddIdea,
  generateDialogOpen,
  setGenerateDialogOpen,
  onGenerateIdea,
}) => {
  return (
    <div className="flex justify-between items-center w-full mb-0">
      <div>
      </div>
      
      <div className="flex space-x-3">
        <GenerateIdeaDialog
          accounts={accounts}
          open={generateDialogOpen}
          onOpenChange={setGenerateDialogOpen}
          onGenerate={onGenerateIdea}
        />
        
        <NewIdeaDialog
          accounts={accounts}
          open={newIdeaDialogOpen}
          onOpenChange={setNewIdeaDialogOpen}
          onAdd={onAddIdea}
        />
      </div>
    </div>
  );
};

export default DashboardHeader;
