import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Wand2, ExternalLink, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import IconRenderer from '@/components/IconRenderer';
import { ScriptIdea } from '@/types/scriptPipeline';

interface PipelineStageProps {
  stage: {
    id: string;
    label: string;
    dbStatus: string;
  };
  ideas: ScriptIdea[];
  onDragStart: (ideaId: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, stageId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, stageId: string) => void;
  onEditIdea: (idea: ScriptIdea) => void;
  onDeleteInitiate: (id: string, event: React.MouseEvent) => void;
  onGenerateScript: (idea: ScriptIdea, event: React.MouseEvent) => void;
  generatingScripts?: Set<string>;
  generatingIdeas?: {
    pending: boolean;
    toastId?: string;
  };
}

const PipelineStage: React.FC<PipelineStageProps> = ({
  stage,
  ideas,
  onDragStart,
  onDragOver,
  onDrop,
  onEditIdea,
  onDeleteInitiate,
  onGenerateScript,
  generatingScripts = new Set(),
  generatingIdeas = { pending: false }
}) => {
  const iconName = stage.id === 'idea' ? 'PenLine' : 
                  stage.id === 'generated' ? 'Sparkles' : 
                  stage.id === 'reviewed' ? 'CheckCircle' : 'Clock';
  
  const stageColor = stage.id === 'idea' ? 'bg-green-50 text-green-600 border-green-200' : 
                    stage.id === 'generated' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                    stage.id === 'reviewed' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                    'bg-purple-50 text-purple-600 border-purple-200';

  const containerBg = stage.id === 'idea' ? 'bg-green-100/50' : 
                     stage.id === 'generated' ? 'bg-blue-100/50' : 
                     stage.id === 'reviewed' ? 'bg-amber-100/50' : 
                     'bg-purple-100/50';

  // Render a card based on its status
  const renderCard = (idea: ScriptIdea) => {
    const isGeneratingScript = generatingScripts.has(idea.id);
    const isGeneratingIdea = generatingIdeas.pending && idea.status === 'Idea Generation';

    // Helper for formatting the audience information
    const formatAudience = () => {
      if (!idea.target_audiences && !idea.age_group && !idea.gender) return null;
      
      if (stage.id === 'idea') {
        // For Idea Submitted, show audience as simple text
        const text = idea.target_audiences || '';
        return text ? `Audience: ${text}` : null;
      } else {
        // For other stages show more detailed information including age ranges
        let ageRange = '';
        if (idea.age_group) {
          ageRange = idea.age_group.includes('-') ? idea.age_group : `${idea.age_group}`;
        }
        
        const gender = idea.gender || '';
        
        const parts = [gender, ageRange].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : null;
      }
    };

    // Format minutes display
    const formatDuration = (duration: string) => {
      if (!duration) return '';
      
      // Check if duration already has 'minutes' or 'mins'
      if (duration.toLowerCase().includes('min')) {
        return duration;
      }
      
      // If it's just a number, add 'minutes'
      if (!isNaN(Number(duration))) {
        return `${duration} mins`;
      }
      
      return duration;
    };

    const renderCardContent = () => {
      // Different content for different stages
      if (stage.id === 'idea') {
        return (
          <>
            {/* Thumbnail preview */}
            <div className="aspect-video overflow-hidden rounded-md mb-3 bg-gray-100">
              <img 
                src={idea.generated_thumbnail || `https://placehold.co/600x400/e9deff/352b42?text=${encodeURIComponent(idea.title || '')}`}
                alt={idea.title} 
                className="w-full h-full object-cover" 
              />
            </div>
            
            {/* Title */}
            <h3 className="text-base font-medium mb-2 line-clamp-2">{idea.title}</h3>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {idea.description || ""}
            </p>
            
            {/* Duration & Category */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{formatDuration(idea.target_duration || '')}</span>
              </div>
              
              <div className="flex items-center gap-1 ml-2">
                <Badge variant="secondary" className="text-xs font-normal">
                  {idea.account || ''}
                </Badge>
              </div>
            </div>
            
            {/* Audience */}
            <div className="text-sm text-muted-foreground mb-4">
              {formatAudience() || ''}
            </div>
            
            {/* Actions */}
            <div className="flex justify-between items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-red-500 hover:text-red-700 px-1" 
                onClick={e => onDeleteInitiate(idea.id, e)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              
              <div className="flex gap-1">
                {idea.status === 'Idea Submitted' ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={e => onGenerateScript(idea, e)} 
                    className="text-xs hover:bg-gray-50"
                    disabled={isGeneratingScript}
                  >
                    {isGeneratingScript ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-3.5 w-3.5 mr-1" />
                        Generate
                      </>
                    )}
                  </Button>
                ) : isGeneratingIdea ? (
                  <div className="flex items-center text-xs text-blue-600">
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Generating Idea...
                  </div>
                ) : idea.generated_script_link ? (
                  <a 
                    href={idea.generated_script_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="text-xs flex items-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Script
                    </Button>
                  </a>
                ) : null}
              </div>
            </div>
          </>
        );
      } else {
        // Content for other stages (Generated, Reviewed, Scheduled)
        return (
          <>
            {/* Thumbnail preview */}
            <div className="aspect-video overflow-hidden rounded-md mb-3 bg-gray-100">
              <img 
                src={idea.generated_thumbnail || `https://placehold.co/600x400/e9deff/352b42?text=${encodeURIComponent(idea.title || '')}`}
                alt={idea.title} 
                className="w-full h-full object-cover" 
              />
            </div>
            
            {/* Title */}
            <h3 className="text-base font-medium mb-2 line-clamp-2">{idea.title}</h3>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {idea.description || ""}
            </p>
            
            {/* Duration & Category */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{formatDuration(idea.target_duration || '')}</span>
              </div>
              
              <div className="flex items-center gap-1 ml-2">
                <Badge variant="secondary" className="text-xs font-normal">
                  {idea.account || ''}
                </Badge>
              </div>
            </div>
            
            {/* Audience Info */}
            <div className="flex flex-col gap-1 mb-4">
              <div className="text-sm text-muted-foreground">
                {formatAudience() || ''}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end items-center">
              {idea.generated_script_link ? (
                <a 
                  href={idea.generated_script_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="text-xs flex items-center gap-1"
                    key={`script-button-${idea.id}-${idea.generated_script_link ? 'complete' : 'generating'}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Script
                  </Button>
                </a>
              ) : (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="text-xs flex items-center gap-1 opacity-50"
                  disabled
                  key={`script-button-${idea.id}-${idea.generated_script_link ? 'complete' : 'generating'}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Generating Script...
                </Button>
              )}
            </div>
          </>
        );
      }
    };

    return (
      <Card 
        key={`${idea.id}-${idea.generated_script_link || ''}-${idea.generated_thumbnail || ''}`} 
        className={`cursor-pointer hover:shadow-md transition-all overflow-hidden ${
          isGeneratingScript || isGeneratingIdea ? 'bg-blue-50/50' : 'bg-white'
        }`}
        draggable 
        onDragStart={() => onDragStart(idea.id)} 
        onClick={() => onEditIdea(idea)}
      >
        <CardContent className="p-4">
          {renderCardContent()}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-2 p-3 rounded-lg ${stageColor}`}>
        <IconRenderer iconName={iconName as any} className="h-5 w-5" />
        <h3 className="font-medium">{stage.label}</h3>
        <Badge variant="outline" className="ml-auto">
          {ideas.length} items
        </Badge>
      </div>
      
      <div 
        className={`space-y-3 min-h-[200px] p-2 rounded-lg border border-dashed ${containerBg}`}
        onDragOver={e => onDragOver(e, stage.id)} 
        onDrop={e => onDrop(e, stage.id)}
      >
        <ScrollArea className="h-[calc(100vh-330px)]">
          <div className="p-2 space-y-4">
            {ideas.map(idea => renderCard(idea))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default PipelineStage;
