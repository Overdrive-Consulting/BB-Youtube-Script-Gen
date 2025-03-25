import React from 'react';
import { PIPELINE_STAGES } from '@/types/scriptPipeline';
import { Badge } from '@/components/ui/badge';
import IconRenderer from '@/components/IconRenderer';

export interface ListViewFiltersProps {
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
}

export const ListViewFilters: React.FC<ListViewFiltersProps> = ({
  selectedStatus,
  onStatusChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Badge
        variant={selectedStatus === null ? "secondary" : "outline"}
        className="cursor-pointer hover:bg-secondary/80 transition-colors px-4 py-2"
        onClick={() => onStatusChange(null)}
      >
        All
      </Badge>
      {PIPELINE_STAGES.map((stage) => {
        const isSelected = selectedStatus === stage.dbStatus;
        const iconName = stage.id === 'idea' ? 'PenLine' : 
                        stage.id === 'generated' ? 'Sparkles' : 
                        stage.id === 'reviewed' ? 'CheckCircle' : 'Clock';
        const stageColor = isSelected
          ? stage.id === 'idea'
            ? 'bg-green-100 hover:bg-green-200 text-green-700'
            : stage.id === 'generated'
            ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            : stage.id === 'reviewed'
            ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
            : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
          : 'hover:bg-gray-100';

        return (
          <Badge
            key={stage.id}
            variant={isSelected ? "secondary" : "outline"}
            className={`cursor-pointer transition-colors px-4 py-2 ${stageColor}`}
            onClick={() => onStatusChange(stage.dbStatus)}
          >
            <div className="flex items-center gap-2">
              <IconRenderer iconName={iconName as any} className="h-3.5 w-3.5" />
              {stage.label}
            </div>
          </Badge>
        );
      })}
    </div>
  );
};

export default ListViewFilters; 