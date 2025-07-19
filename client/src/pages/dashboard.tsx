import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import GenerateIdeas from "@/components/generate-ideas";
import CreatePost from "@/components/create-post";
import SavedIdeas from "@/components/saved-ideas";
import CompetitorsManagement from "@/components/competitors-management";
import { useContentState } from "@/hooks/useContentState";
import Analytics from "@/components/analytics";
import UserSettings from "@/components/user-settings";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const { state } = useContentState();
  const [location] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Please sign in",
        description: "Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = '/api/login';
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 instagram-gradient rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Determine which component to render based on the current route
  // Default to Generate Ideas when on root dashboard
  const renderContent = () => {
    // Check URL parameters for specific tabs
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    // Handle specific tab parameter
    if (tab === 'generate') {
      return <GenerateIdeas />;
    }
    
    switch (location) {
      case '/':
      case '/generate':
      case '/dashboard':
        return <GenerateIdeas />;
      case '/saved':
        return <SavedIdeas />;
      case '/create':
        return <CreatePost />;
      case '/analytics':
        return <Analytics />;
      case '/manage-competitors':
        return <CompetitorsManagement />;
      case '/settings':
        return <UserSettings />;
      default:
        return <GenerateIdeas />;
    }
  };

  return (
    <div className="w-full md:max-w-7xl md:mx-auto">
      {renderContent()}
    </div>
  );
}