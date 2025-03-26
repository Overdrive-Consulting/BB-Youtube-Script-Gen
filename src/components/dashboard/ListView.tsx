import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PIPELINE_STAGES, ScriptIdea } from '@/types/scriptPipeline';
import { PenLine, Trash2, Wand2, ExternalLink, Clock, Loader2 } from 'lucide-react';
import IconRenderer from '@/components/IconRenderer';
import ListViewFilters from './ListViewFilters';

interface ListViewProps {
  scriptIdeas: ScriptIdea[];
  onEditIdea: (idea: ScriptIdea) => void;
  onDeleteInitiate: (id: string, event: React.MouseEvent) => void;
  onGenerateScript: (idea: ScriptIdea, event: React.MouseEvent) => void;
  generatingScripts?: Set<string>;
  generatingIdeas?: {
    pending: boolean;
    toastId?: string;
  };
}

const ListView: React.FC<ListViewProps> = ({
  scriptIdeas,
  onEditIdea,
  onDeleteInitiate,
  onGenerateScript,
  generatingScripts = new Set(),
  generatingIdeas = { pending: false }
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const filteredIdeas = selectedStatus
    ? scriptIdeas.filter(idea => idea.status === selectedStatus)
    : scriptIdeas;

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Script Ideas</CardTitle>
        <CardDescription>View and manage all your script ideas in one place</CardDescription>
      </CardHeader>
      <CardContent>
        <ListViewFilters
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />
        <div className="space-y-4">
          {filteredIdeas.map(idea => {
            const stage = PIPELINE_STAGES.find(s => s.dbStatus === idea.status);
            const isGeneratingScript = generatingScripts.has(idea.id);
            const isGeneratingIdea = generatingIdeas.pending && idea.status === 'Idea Generation';
            const iconName = stage?.id === 'idea' ? 'PenLine' : 
                          stage?.id === 'generated' ? 'Sparkles' : 
                          stage?.id === 'reviewed' ? 'CheckCircle' : 'Clock';
            const stageColor = stage?.id === 'idea' ? 'bg-green-50 text-green-600 border-green-200' : 
                              stage?.id === 'generated' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                              stage?.id === 'reviewed' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                              'bg-purple-50 text-purple-600 border-purple-200';
            
            return (
              <div 
                key={idea.id} 
                className="flex items-start p-4 border rounded-lg gap-6 cursor-pointer hover:bg-gray-50" 
                onClick={() => onEditIdea(idea)}
              >
                {/* Thumbnail Section */}
                <div className="w-40 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={idea.generated_thumbnail || `https://placehold.co/600x400/e9deff/352b42?text=${encodeURIComponent(idea.title || '')}`}
                    alt={idea.title} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                
                {/* Content Section */}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h4 className="font-medium text-lg line-clamp-1 mb-2">
                    {idea.status === 'Content Generated' || idea.status === 'Reviewed' || idea.status === 'Scheduled' 
                      ? idea.generated_title || idea.title
                      : idea.title
                    }
                  </h4>
                  
                  {/* Essential Info - Always visible */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {idea.target_duration}
                      </div>
                      <Badge variant="outline" className="text-xs font-normal">
                        {idea.account}
                      </Badge>
                    </div>
                    
                    {/* Status Badge */}
                    {stage && (
                      <Badge 
                        className={`${isGeneratingScript || isGeneratingIdea ? 'bg-blue-100 text-blue-700' : ''} 
                          ${
                            stage.id === 'idea' ? 'bg-green-50 text-green-600 border-green-200' : 
                            stage.id === 'generated' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                            stage.id === 'reviewed' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                            'bg-purple-50 text-purple-600 border-purple-200'
                          } flex items-center gap-1 w-fit`}
                      >
                        {isGeneratingScript || isGeneratingIdea ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {isGeneratingScript ? 'Generating Script...' : 'Generating Idea...'}
                          </>
                        ) : (
                          <>
                            <IconRenderer iconName={iconName as any} className="h-3 w-3" />
                            {stage.label}
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Actions Section */}
                <div className="flex flex-col items-end justify-between h-24">
                  {/* Delete Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-red-500 hover:text-red-700 px-2" 
                    onClick={e => onDeleteInitiate(idea.id, e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  
                  {/* Generate/View Script Button */}
                  <div className="flex items-center">
                    {idea.status === 'Idea Submitted' ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={e => onGenerateScript(idea, e)} 
                        className="text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3"
                        disabled={isGeneratingScript}
                      >
                        {isGeneratingScript ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {isGeneratingScript ? 'Generating...' : 'Generate Script'}
                      </Button>
                    ) : idea.generated_script_link ? (
                      <a 
                        href={idea.generated_script_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                      >
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-black-600 hover:text-blue-800 bg-blue-100/50 hover:bg-blue-100/80 px-3"
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          View Script
                        </Button>
                      </a>
                    ) : null}
                  </div>
                  
                  {/* Empty div for spacing */}
                  <div></div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ListView; 