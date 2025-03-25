import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  fields: { label: string; key: string }[];
  title: string;
}

const DetailsSidebar: React.FC<DetailsSidebarProps> = ({
  isOpen,
  onClose,
  data,
  fields,
  title,
}) => {
  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-[400px] bg-background shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="absolute inset-0 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b bg-background">
            <h3 className="font-semibold text-lg">{title}</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </p>
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm break-words">
                      {data[field.key] !== undefined && data[field.key] !== null
                        ? String(data[field.key])
                        : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export default DetailsSidebar; 