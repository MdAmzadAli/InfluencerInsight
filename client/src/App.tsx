import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Auth from "@/pages/auth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import AdminPage from "@/pages/admin";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import PostSchedulingBoard from "@/components/post-scheduling-board";
import CompetitorPostsView from "@/components/competitor-posts-view";
import RefineIdea from "@/components/refine-idea";
import TipsSection from "@/components/tips-section";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContentState, ContentIdea } from "@/hooks/useContentState";
import { StreamingBanner } from "@/components/streaming-banner";

function Router() {
  const { user, isLoading } = useAuth();
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [showRefinePanel, setShowRefinePanel] = useState(false);
  const [refineIdea, setRefineIdea] = useState<ContentIdea | null>(null);
  const [showTips, setShowTips] = useState(false);
  const { state } = useContentState();
  
  // Parse competitors when user data changes
  useEffect(() => {
    if (user?.competitors) {
      try {
        let parsedCompetitors = [];
        if (typeof user.competitors === 'string') {
          parsedCompetitors = user.competitors.startsWith('[') ? JSON.parse(user.competitors) : user.competitors.split(',').filter(Boolean);
        } else {
          parsedCompetitors = Array.isArray(user.competitors) ? user.competitors : JSON.parse(user.competitors);
        }
        setCompetitors(parsedCompetitors);
        // Note: Competitor posts will only be fetched when user clicks "Competitor Analysis" button
      } catch (error) {
        console.error('Error parsing competitors:', error);
      }
    }
  }, [user?.competitors]);

  // Listen for refine panel events from sidebar and idea refine buttons
  useEffect(() => {
    const handleShowRefineIdeas = (event: any) => {
      // If event has detail with idea, use that idea; otherwise open without idea
      const ideaFromEvent = event.detail?.idea || null;
      setRefineIdea(ideaFromEvent);
      setShowRefinePanel(true);
    };

    window.addEventListener('showRefineIdeas', handleShowRefineIdeas);
    return () => window.removeEventListener('showRefineIdeas', handleShowRefineIdeas);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Admin route should be accessible without authentication
  if (window.location.pathname === '/admin') {
    return <AdminPage />;
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={Auth} />
        <Route path="/signup" component={Auth} />
        <Route path="/" component={Landing} />
        {/* Redirect all other routes to landing if not authenticated */}
        <Route>
          <Landing />
        </Route>
      </Switch>
    );
  }

  // Show refine panel if active
  if (showRefinePanel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <RefineIdea 
          idea={refineIdea} 
          onBack={() => {
            setShowRefinePanel(false);
            setRefineIdea(null);
          }} 
        />
      </div>
    );
  }

  // Show tips section if active
  if (showTips) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar 
          competitors={competitors}
          posts={posts}
          loadingPosts={loadingPosts}
        />
        <div className="flex pt-16">
          <Sidebar 
            competitors={competitors}
            posts={posts}
            loadingPosts={loadingPosts}
            onUsageClick={() => setShowTips(true)}
          />
          <main className="flex-1 p-4 md:p-6 max-w-full overflow-hidden">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tips & Guidelines</h1>
                <Button 
                  variant="outline" 
                  onClick={() => setShowTips(false)}
                  className="flex items-center gap-2"
                >
                  ← Back to Dashboard
                </Button>
              </div>
              <TipsSection />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 max-w-full overflow-x-hidden">
      <Navbar 
        competitors={competitors}
        posts={posts}
        loadingPosts={loadingPosts}
      />
      <div className="flex pt-16">
        <Sidebar 
          competitors={competitors}
          posts={posts}
          loadingPosts={loadingPosts}
          onUsageClick={() => setShowTips(true)}
        />
        <main className="flex-1 p-4 md:p-6 max-w-full overflow-hidden">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/generate" component={Dashboard} />
            <Route path="/saved" component={Dashboard} />
            <Route path="/create" component={Dashboard} />
            <Route path="/analytics" component={Dashboard} />
            <Route path="/manage-competitors" component={Dashboard} />
            <Route path="/settings" component={Dashboard} />
            <Route path="/schedule" component={PostSchedulingBoard} />
            <Route path="/competitors">
              <CompetitorPostsView posts={posts} isLoading={loadingPosts} />
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <StreamingBanner />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
