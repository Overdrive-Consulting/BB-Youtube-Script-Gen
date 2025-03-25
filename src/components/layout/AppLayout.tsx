import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar, { useSidebar } from './Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { checkSupabaseConnection, checkChannelTables } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const pageTitle = {
  '/': 'Dashboard',
  '/urls': 'URL Tracking',
  '/channels': 'My YouTube Channels',
  '/account': 'Account Settings',
  '/analytics/overview': 'Overview',
  '/analytics/channels': 'Channels Analytics',
  '/analytics/videos': 'Videos Analytics'
};

const AppLayout: React.FC = () => {
  const location = useLocation();
  const title = pageTitle[location.pathname as keyof typeof pageTitle] || 'Dashboard';
  
  useEffect(() => {
    // Check Supabase connection when app loads
    const checkConnection = async () => {
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        toast.error('Failed to connect to database', {
          description: 'Please check your internet connection and try again.'
        });
      } else {
        console.log('Supabase connected successfully');
        
        // If we're on the channels page, check the related tables
        if (location.pathname === '/channels') {
          const tableResults = await checkChannelTables();
          console.log('Channel tables check from AppLayout:', tableResults);
          
          // Show a detailed log of found accounts_settings data
          if (tableResults.accountsSettings.data && tableResults.accountsSettings.data.length > 0) {
            console.log('Found accounts_settings entries:', tableResults.accountsSettings.data);
          }
          
          // Show a toast if there are issues
          if (tableResults.channels.error || tableResults.accountsSettings.error || tableResults.audienceProfiles.error) {
            toast.error('Issue accessing channel data', {
              description: 'There might be permission issues with the database tables.'
            });
          }
        }
      }
    };
    
    checkConnection();
  }, [location.pathname]);
  
  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <MainContent title={title} />
    </div>
  );
};

// Separate component to use the sidebar context
const MainContent: React.FC<{ title: string }> = ({ title }) => {
  const { collapsed } = useSidebar();
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
      <Header title={title} />
      
      <div className="flex-1 overflow-auto w-full px-12 py-8">
        <Outlet />
      </div>
      
      <Toaster position="top-right" />
    </main>
  );
};

export default AppLayout;
