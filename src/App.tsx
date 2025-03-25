import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import ChannelProfiles from './pages/ChannelProfiles';
import UrlTracking from './pages/UrlTracking';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { setupStorage } from './utils/setupStorage';
import ChannelsAnalytics from './pages/analytics/Channels';
import VideosAnalytics from './pages/analytics/Videos';
import Overview from './pages/analytics/Overview';
import './App.css';

const queryClient = new QueryClient();

// Setup component that runs once when the app loads
const SetupComponent = () => {
  useEffect(() => {
    setupStorage().catch(console.error);
  }, []);
  
  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <SetupComponent />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="account" element={<Account />} />
              <Route path="channels" element={<ChannelProfiles />} />
              <Route path="urls" element={<UrlTracking />} />
              <Route path="analytics/overview" element={<Overview />} />
              <Route path="analytics/channels" element={<ChannelsAnalytics />} />
              <Route path="analytics/videos" element={<VideosAnalytics />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
