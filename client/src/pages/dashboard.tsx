import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import GenerateIdeas from "@/components/generate-ideas";
import CreatePost from "@/components/create-post";
import SavedIdeas from "@/components/saved-ideas";
import CompetitorsManagement from "@/components/competitors-management";
import RefineIdea from "@/components/refine-idea";
import { useContentState, ContentIdea } from "@/hooks/useContentState";
import Analytics from "@/components/analytics";

export default function Dashboard() {
  const [showRefinePanel, setShowRefinePanel] = useState(false);
  const [refineIdea, setRefineIdea] = useState<ContentIdea | null>(null);
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

  // Listen for refine panel events from sidebar
  useEffect(() => {
    const handleShowRefineIdeas = () => {
      // Get the first available idea from the content state
      if (state.generatedIdeas.length > 0) {
        setRefineIdea(state.generatedIdeas[0]);
        setShowRefinePanel(true);
      } else {
        toast({
          title: "No Ideas Available",
          description: "Generate some content ideas first to use the refine feature.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('showRefineIdeas', handleShowRefineIdeas);
    return () => window.removeEventListener('showRefineIdeas', handleShowRefineIdeas);
  }, [state.generatedIdeas, toast]);

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

  if (showRefinePanel && refineIdea) {
    return (
      <RefineIdea 
        idea={refineIdea} 
        onBack={() => {
          setShowRefinePanel(false);
          setRefineIdea(null);
        }} 
      />
    );
  }

  // Determine which component to render based on the current route
  const renderContent = () => {
    switch (location) {
      case '/':
        return <GenerateIdeas />;
      case '/generate':
        return <GenerateIdeas />;
      case '/saved':
        return <SavedIdeas />;
      case '/create':
        return <CreatePost />;
      case '/analytics':
        return <Analytics />;
      case '/manage-competitors':
        return <CompetitorsManagement />;
      default:
        return <GenerateIdeas />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {renderContent()}
    </div>
  );
}