import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import ScheduleModal from "./schedule-modal";
import type { ContentIdea } from "@shared/schema";

interface GeneratedContent {
  headline: string;
  caption: string;
  hashtags: string;
  ideas: string;
}

export default function GenerateIdeas() {
  const [niche, setNiche] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<ContentIdea[]>([]);
  const [clearIdeas, setClearIdeas] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateNicheMutation = useMutation({
    mutationFn: async (data: { niche: string; competitors?: string }) => {
      const response = await apiRequest("PATCH", "/api/user/niche", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowOptions(true);
      toast({
        title: "Success",
        description: "Your niche has been updated successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update niche. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateContentMutation = useMutation({
    mutationFn: async (generationType: 'date' | 'competitor' | 'trending') => {
      const response = await apiRequest("POST", "/api/content/generate", {
        generationType,
        context: generationType
      });
      return response.json();
    },
    onSuccess: (data: ContentIdea[]) => {
      setGeneratedIdeas(prev => [...prev, ...data]);
      toast({
        title: "Success",
        description: "Content ideas generated successfully!",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      // Handle scraping failures specifically
      if (error.message?.includes("Instagram scraping failed") || error.message?.includes("SCRAPING_FAILED")) {
        toast({
          title: "Instagram Scraping Failed",
          description: "Could not get real Instagram data. Please check competitor usernames and try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveIdeaMutation = useMutation({
    mutationFn: async ({ ideaId, isSaved }: { ideaId: number; isSaved: boolean }) => {
      const response = await apiRequest("PATCH", `/api/content/ideas/${ideaId}/save`, { isSaved });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/ideas/saved"] });
      toast({
        title: "Success",
        description: "Idea saved successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save idea. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSetupSubmit = () => {
    if (!niche.trim()) {
      toast({
        title: "Error",
        description: "Please describe your Instagram niche.",
        variant: "destructive",
      });
      return;
    }

    updateNicheMutation.mutate({
      niche: niche.trim(),
      competitors: competitors.trim() || undefined
    });
  };

  const handleGenerateIdeas = (type: 'date' | 'competitor' | 'trending') => {
    generateContentMutation.mutate(type);
  };

  const handleSaveIdea = (idea: ContentIdea) => {
    saveIdeaMutation.mutate({ ideaId: idea.id, isSaved: !idea.isSaved });
  };

  const handleScheduleIdea = (idea: ContentIdea) => {
    setSelectedIdea(idea);
    setShowScheduleModal(true);
  };

  // Initialize with user's existing data
  useState(() => {
    if (user?.niche) {
      setNiche(user.niche);
      setCompetitors(user.competitors || "");
      setShowOptions(true);
    }
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Generate Content Ideas</h2>
        <p className="text-gray-600">AI-powered content suggestions tailored to your niche and audience</p>
      </div>

      {!showOptions ? (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Tell us about your Instagram</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="niche">What is your Instagram handle about? *</Label>
                <Textarea
                  id="niche"
                  placeholder="e.g., Travel photography, fitness tips, food recipes, lifestyle content..."
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="competitors">Competitor usernames (optional)</Label>
                <Input
                  id="competitors"
                  placeholder="@competitor1, @competitor2, @competitor3..."
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <Button 
                onClick={handleSetupSubmit}
                disabled={updateNicheMutation.isPending}
                className="instagram-gradient text-white hover:opacity-90"
              >
                {updateNicheMutation.isPending ? "Saving..." : "Continue to Ideas"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card 
              className="cursor-pointer hover:border-purple-500 transition-colors group"
              onClick={() => handleGenerateIdeas('date')}
            >
              <CardContent className="p-6 text-left">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <i className="fas fa-calendar-day text-blue-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Date Specific</h3>
                <p className="text-gray-600 text-sm">Ideas based on upcoming Indian holidays, festivals, and events</p>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:border-purple-500 transition-colors group"
              onClick={() => handleGenerateIdeas('competitor')}
            >
              <CardContent className="p-6 text-left">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <i className="fas fa-users text-green-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Competitor Analysis</h3>
                <p className="text-gray-600 text-sm">Analyze top posts from your competitors for inspiration</p>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:border-purple-500 transition-colors group"
              onClick={() => handleGenerateIdeas('trending')}
            >
              <CardContent className="p-6 text-left">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                  <i className="fas fa-fire text-red-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Trending Posts</h3>
                <p className="text-gray-600 text-sm">Discover what's trending in your niche right now</p>
              </CardContent>
            </Card>
          </div>

          {generateContentMutation.isPending && (
            <div className="text-center py-8">
              <div className="w-8 h-8 instagram-gradient rounded-lg animate-pulse mx-auto mb-4"></div>
              <p className="text-gray-600">Generating amazing content ideas for you...</p>
            </div>
          )}

          {generatedIdeas.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Generated Ideas ({generatedIdeas.length})</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setGeneratedIdeas([])}
                    className="flex items-center space-x-2"
                  >
                    <i className="fas fa-trash"></i>
                    <span>Clear All</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateIdeas('trending')}
                    className="flex items-center space-x-2"
                  >
                    <i className="fas fa-sync-alt"></i>
                    <span>Generate More</span>
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {generatedIdeas.map((idea) => (
                  <Card key={idea.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 flex-1">
                          {idea.headline}
                        </h4>
                        <button 
                          onClick={() => handleSaveIdea(idea)}
                          className={`ml-2 ${idea.isSaved ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                        >
                          <i className="fas fa-bookmark"></i>
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">CAPTION (20-40 words)</label>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{idea.caption}</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">HASHTAGS (5-10)</label>
                          <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded break-all">{idea.hashtags}</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">STRATEGY & SOURCE</label>
                          <p className="text-xs text-gray-600 bg-green-50 p-2 rounded whitespace-pre-line">{idea.ideas}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                        <Button 
                          onClick={() => handleScheduleIdea(idea)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm"
                        >
                          Schedule
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 text-sm"
                        >
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showScheduleModal && selectedIdea && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          idea={selectedIdea}
        />
      )}
    </div>
  );
}
