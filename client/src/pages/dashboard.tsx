import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import GenerateIdeas from "@/components/generate-ideas";
import CreatePost from "@/components/create-post";
import SavedIdeas from "@/components/saved-ideas";
import PostSchedulingBoard from "@/components/post-scheduling-board";
import CompetitorsManagement from "@/components/competitors-management";
import CompetitorPostsView from "@/components/competitor-posts-view";
import UserSettings from "@/components/user-settings";
import RefineIdea from "@/components/refine-idea";
import { useContentState, ContentIdea } from "@/hooks/useContentState";

type Section = 'generateIdeas' | 'createPost' | 'savedIdeas' | 'scheduling' | 'competitorPosts' | 'competitors' | 'settings';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<Section>('generateIdeas');
  const [showRefinePanel, setShowRefinePanel] = useState(false);
  const [refineIdea, setRefineIdea] = useState<ContentIdea | null>(null);
  const { user, isLoading, firebaseUser } = useAuth();
  const { toast } = useToast();
  const { state } = useContentState();

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

  const CompetitorPostsComponent = () => {
    const { data: competitorData, isLoading: postsLoading } = useQuery({
      queryKey: ["/api/competitors/top-posts"],
      enabled: !!user?.competitors,
    });

    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Top Competitor Posts
            </h1>
            <p className="text-gray-600">
              Analyze your competitors' best-performing content to inspire your strategy
            </p>
          </div>
          <CompetitorPostsView 
            posts={competitorData?.posts || []} 
            isLoading={postsLoading}
          />
        </div>
      </div>
    );
  };

  const handleLogout = async () => {
    try {
      window.location.href = '/api/logout';
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const sectionConfig = [
    {
      id: 'generateIdeas' as const,
      icon: 'fas fa-lightbulb',
      label: 'Generate Ideas',
      color: 'text-purple-600'
    },
    {
      id: 'createPost' as const,
      icon: 'fas fa-plus-circle',
      label: 'Create Post',
      color: 'text-green-600'
    },
    {
      id: 'savedIdeas' as const,
      icon: 'fas fa-bookmark',
      label: 'Saved Ideas',
      color: 'text-yellow-600'
    },
    {
      id: 'scheduling' as const,
      icon: 'fas fa-calendar-alt',
      label: 'Post Scheduling',
      color: 'text-blue-600'
    },
    {
      id: 'competitorPosts' as const,
      icon: 'fas fa-chart-bar',
      label: 'Competitor Posts',
      color: 'text-orange-600'
    },
    {
      id: 'competitors' as const,
      icon: 'fas fa-users',
      label: 'Manage Competitors',
      color: 'text-indigo-600'
    },
    {
      id: 'settings' as const,
      icon: 'fas fa-cog',
      label: 'Settings',
      color: 'text-gray-600'
    }
  ];

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

  return (
    <div className="space-y-6">
      {/* Content tabs */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {sectionConfig.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <i className={`${section.icon} ${section.color}`}></i>
              <span className="font-medium">{section.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="mt-6">
          {activeSection === 'generateIdeas' && <GenerateIdeas />}
          {activeSection === 'createPost' && <CreatePost />}
          {activeSection === 'savedIdeas' && <SavedIdeas />}
          {activeSection === 'scheduling' && <PostSchedulingBoard />}
          {activeSection === 'competitorPosts' && <CompetitorPostsComponent />}
          {activeSection === 'competitors' && <CompetitorsManagement />}
          {activeSection === 'settings' && <UserSettings />}
        </div>
      </div>
    </div>
  );
}
