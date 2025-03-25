import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const loadingMessages = [
  "Loading Content Engine...",
  "Preparing Your Dashboard...",
  "Loading Channel Profiles...",
  "Initializing Analytics...",
  "Setting Up Your Workspace...",
  "Loading Script Generator...",
  "Almost There..."
];

const LoadingScreen: React.FC = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Create a simpler message rotation that doesn't depend on progress
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prevIndex => {
        // Just cycle through all messages including "Almost There..."
        return (prevIndex + 1) % loadingMessages.length;
      });
    }, 2000); // Faster message rotation - every 2 seconds

    // Use a separate interval for progress to ensure smooth animation
    const progressInterval = setInterval(() => {
      setProgress(prevProgress => {
        // Faster progression for shorter loading times
        if (prevProgress < 40) return prevProgress + 1.2;
        if (prevProgress < 70) return prevProgress + 0.8;
        if (prevProgress < 85) return prevProgress + 0.5;
        if (prevProgress < 95) return prevProgress + 0.3;
        return prevProgress; // Cap at 95% until complete
      });
    }, 200); // Faster interval

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []); // Remove dependency on progress

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
      {/* Main loading animation - larger and more noticeable */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" 
             style={{ width: '120px', height: '120px', animationDuration: '3s' }} />
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" 
             style={{ width: '100px', height: '100px', left: '10px', top: '10px', animationDuration: '2s' }} />
        <Loader2 className="h-24 w-24 animate-spin text-primary relative" 
                style={{ animationDuration: '2.5s' }} />
      </div>
      
      {/* Loading message with consistent styling */}
      <div className="text-center max-w-sm px-4">
        <h2 className="text-2xl font-semibold mb-3">Boring Business</h2>
        <p className="text-xl text-primary font-medium animate-pulse" 
           style={{ animationDuration: '3s' }}>
          {loadingMessages[currentMessageIndex]}
        </p>
      </div>
      
      {/* Progress bar with realistic progress */}
      <div className="w-80 h-2 bg-muted rounded-full overflow-hidden mt-10">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Progress percentage */}
      <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}%</p>
    </div>
  );
};

export default LoadingScreen; 