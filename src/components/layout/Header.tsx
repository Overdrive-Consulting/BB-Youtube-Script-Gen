import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from './Sidebar';

const Header: React.FC<{
  title?: string;
}> = ({
  title = "Dashboard"
}) => {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
    </header>
  );
};

export default Header;
