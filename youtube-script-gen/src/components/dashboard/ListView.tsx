
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PIPELINE_STAGES, ScriptIdea } from '@/types/scriptPipeline';
import { PenLine, Trash2, Wand2, ExternalLink } from 'lucide-react';
import IconRenderer from '@/components/IconRenderer';

interface ListViewProps {
  scriptIdeas: ScriptIdea[];
  onEditIdea: (idea: ScriptIdea) => void;
  onDeleteInitiate: (id: string, event: React.MouseEvent) => void;
  onGenerateScript: (idea: ScriptIdea, event: React.MouseEvent) => void;
}

const ListView: React.FC<ListViewProps> = ({
  scriptIdeas,
  onEditIdea,
  onDeleteInitiate,
  onGenerateScript
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Script Ideas</CardTitle>
        <CardDescription>View and manage all your script ideas in one place</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scriptIdeas.map(idea => {
            const stage = PIPELINE_STAGES.find(s => s.dbStatus === idea.status);
            const iconName = stage?.id === 'idea' ? 'PenLine' : 
                          stage?.id === 'generated' ? 'Sparkles' : 
                          stage?.id === 'reviewed' ? 'CheckCircle' : 'Clock';
            const stageColor = stage?.id === 'idea' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                              stage?.id === 'generated' ? 'bg-purple-50 text-purple-600 border-purple-200' : 
                              stage?.id === 'reviewed' ? 'bg-green-50 text-green-600 border-green-200' : 
                              'bg-amber-50 text-amber-600 border-amber-200';
            
            return (
              <div 
                key={idea.id} 
                className="flex items-start p-4 border rounded-lg gap-4 cursor-pointer hover:bg-gray-50" 
                onClick={() => onEditIdea(idea)}
              >
                {idea.generated_thumbnail_prompt ? (
                  <div className="w-24 h-16 rounded overflow-hidden">
                    <img 
                      src={`https://placehold.co/600x400/e9deff/352b42?text=${encodeURIComponent(idea.title || '')}`} 
                      alt={idea.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <div className="w-24 h-16 bg-muted rounded flex items-center justify-center">
                    <PenLine className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex-1">
                  <h4 className="font-medium">{idea.title}</h4>
                  
                  {/* Content Generated status - show specific fields */}
                  {idea.status === 'Content Generated' ? (
                    <div className="space-y-1">
                      {idea.generated_title && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Script Title:</span> {idea.generated_title}
                        </p>
                      )}
                      
                      {idea.generated_script_link && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <span className="font-medium">Script:</span>
                          <a 
                            href={idea.generated_script_link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={e => e.stopPropagation()} 
                            className="text-blue-500 hover:text-blue-700 inline-flex items-center"
                          >
                            View <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </p>
                      )}
                      
                      {idea.video_type && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Video Type:</span> {idea.video_type}
                        </p>
                      )}
                      
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Duration:</span> {idea.target_duration}
                      </p>
                      
                      {idea.account && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Account:</span> {idea.account}
                        </p>
                      )}
                      
                      {idea.target_audiences && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Target Audience:</span> {idea.target_audiences}
                        </p>
                      )}
                      
                      {idea.publish_date && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Created:</span> {idea.publish_date}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {idea.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs font-normal">
                          {idea.target_duration}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-normal">
                          {idea.account}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {stage && (
                    <Badge className={`${stageColor} flex items-center gap-1`}>
                      <IconRenderer iconName={iconName as any} className="h-3 w-3" />
                      {stage.label}
                    </Badge>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700" 
                      onClick={e => onDeleteInitiate(idea.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    
                    {idea.status === 'Idea Submitted' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={e => onGenerateScript(idea, e)} 
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                      >
                        <Wand2 className="h-3 w-3" />
                        Generate Script
                      </Button>
                    )}
                  </div>
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
