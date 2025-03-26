import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PIPELINE_STAGES, ScriptIdea } from '@/types/scriptPipeline';
import PipelineStage from './PipelineStage';

interface KanbanViewProps {
  scriptIdeas: ScriptIdea[];
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, status: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: string) => void;
  onEditIdea: (idea: ScriptIdea) => void;
  onDeleteInitiate: (id: string, event: React.MouseEvent) => void;
  onGenerateScript: (idea: ScriptIdea, event: React.MouseEvent) => void;
  generatingScripts?: Set<string>;
  generatingIdeas?: {
    pending: boolean;
    toastId?: string;
  };
}

const KanbanView: React.FC<KanbanViewProps> = ({
  scriptIdeas,
  onDragStart,
  onDragOver,
  onDrop,
  onEditIdea,
  onDeleteInitiate,
  onGenerateScript,
  generatingScripts = new Set(),
  generatingIdeas = { pending: false }
}) => {
  // Filter ideas by pipeline stage
  const getIdeasByStage = (stageId: string) => {
    const dbStatus = PIPELINE_STAGES.find(stage => stage.id === stageId)?.dbStatus;
    const ideasInStage = scriptIdeas.filter(idea => idea.status === dbStatus);
    
    // No additional sorting needed here since the sorting is already handled 
    // in the useScriptIdeas hook based on created_at
    return ideasInStage;
  };

  // Create a wrapper for onDragOver that includes the stage
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stageId: string) => {
    onDragOver(e, stageId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kanban View</CardTitle>
        <CardDescription>Manage your script ideas across different stages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PIPELINE_STAGES.map(stage => (
            <PipelineStage
              key={stage.id}
              stage={stage}
              ideas={scriptIdeas.filter(idea => idea.status === stage.dbStatus)}
              onDragStart={onDragStart}
              onDragOver={handleDragOver}
              onDrop={onDrop}
              onEditIdea={onEditIdea}
              onDeleteInitiate={onDeleteInitiate}
              onGenerateScript={onGenerateScript}
              generatingScripts={generatingScripts}
              generatingIdeas={generatingIdeas}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default KanbanView;
