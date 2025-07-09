import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import GenerateIdeas from "@/components/generate-ideas";
import CreatePost from "@/components/create-post";
import SavedIdeas from "@/components/saved-ideas";
import PostScheduling from "@/components/post-scheduling";
import CompetitorsManagement from "@/components/competitors-management";
import CompetitorPostsView from "@/components/competitor-posts-view";

type Section = 'generateIdeas' | 'createPost' | 'savedIdeas' | 'scheduling' | 'competitorPosts';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<Section>('generateIdeas');
  const { user, isLoading, firebaseUser } = useAuth();
  const { toast } = useToast();

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
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed w-full top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 instagram-gradient rounded-lg flex items-center justify-center">
              <i className="fas fa-magic text-white text-sm"></i>
            </div>
            <h1 className="text-xl font-bold instagram-gradient-text">ContentCraft</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <i className="fas fa-bell"></i>
            </button>
            <div className="flex items-center space-x-2">
              {user.profileImageUrl && (
                <img 
                  src={user.profileImageUrl} 
                  alt="User Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col fixed h-full">
          <div className="p-6">
            <nav className="space-y-2">
              {sectionConfig.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <i className={`${section.icon} ${section.color}`}></i>
                  <span className="font-medium">{section.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Competitors Management */}
          <div className="p-6 border-t border-gray-200">
            <CompetitorsManagement />
          </div>
          
          {/* User's niche info */}
          <div className="mt-auto p-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fas fa-user-circle text-purple-600"></i>
                <span className="font-medium text-gray-700">Your Niche</span>
              </div>
              <p className="text-sm text-gray-600">
                {user.niche || "Not set"}
              </p>
              <button className="text-xs text-purple-600 hover:text-purple-700 mt-1">
                Change
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-80 overflow-y-auto">
          {activeSection === 'generateIdeas' && <GenerateIdeas />}
          {activeSection === 'createPost' && <CreatePost />}
          {activeSection === 'savedIdeas' && <SavedIdeas />}
          {activeSection === 'scheduling' && <PostScheduling />}
          {activeSection === 'competitorPosts' && <CompetitorPostsComponent />}
        </div>
      </div>
    </div>
  );
}
