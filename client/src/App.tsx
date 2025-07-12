import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Auth from "@/pages/auth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import PostSchedulingBoard from "@/components/post-scheduling-board";
import CompetitorPostsView from "@/components/competitor-posts-view";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

function Router() {
  const { user, isLoading } = useAuth();
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  
  // Fetch competitor posts when user has competitors
  useEffect(() => {
    if (user?.competitors) {
      try {
        const parsedCompetitors = JSON.parse(user.competitors);
        setCompetitors(parsedCompetitors);
        
        // Fetch posts for competitors
        if (parsedCompetitors.length > 0) {
          setLoadingPosts(true);
          const token = localStorage.getItem('authToken');
          fetch('/api/competitors/top-posts', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
          .then(res => res.json())
          .then(data => {
            setPosts(data);
            setLoadingPosts(false);
          })
          .catch(err => {
            console.error('Error fetching competitor posts:', err);
            setLoadingPosts(false);
          });
        }
      } catch (error) {
        console.error('Error parsing competitors:', error);
      }
    }
  }, [user?.competitors]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={Auth} />
        <Route path="/signup" component={Auth} />
        <Route path="/" component={Landing} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar 
          competitors={competitors}
          posts={posts}
          loadingPosts={loadingPosts}
        />
        <main className="flex-1 p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
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
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
