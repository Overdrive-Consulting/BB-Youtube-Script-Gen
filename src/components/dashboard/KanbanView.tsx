import React from 'react';
import { PIPELINE_STAGES, ScriptIdea } from '@/types/scriptPipeline';
import PipelineStage from './PipelineStage';

interface KanbanViewProps {
  scriptIdeas: ScriptIdea[];
  onDragStart: (ideaId: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, stageId: string) => void;
  onEditIdea: (idea: ScriptIdea) => void;
  onDeleteInitiate: (id: string, event: React.MouseEvent) => void;
  onGenerateScript: (idea: ScriptIdea, event: React.MouseEvent) => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({
  scriptIdeas,
  onDragStart,
  onDragOver,
  onDrop,
  onEditIdea,
  onDeleteInitiate,
  onGenerateScript
}) => {
  // Filter ideas by pipeline stage
  const getIdeasByStage = (stageId: string) => {
    const dbStatus = PIPELINE_STAGES.find(stage => stage.id === stageId)?.dbStatus;
    const ideasInStage = scriptIdeas.filter(idea => idea.status === dbStatus);
    
    // No additional sorting needed here since the sorting is already handled 
    // in the useScriptIdeas hook based on created_at
    return ideasInStage;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {PIPELINE_STAGES.map(stage => (
        <PipelineStage
          key={stage.id}
          stageId={stage.id}
          stageLabel={stage.label}
          ideas={getIdeasByStage(stage.id)}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onEditIdea={onEditIdea}
          onDeleteInitiate={onDeleteInitiate}
          onGenerateScript={onGenerateScript}
        />
      ))}
    </div>
  );
};

export default KanbanView;
