import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, Users, Lightbulb, BookmarkPlus, Clock, ExternalLink, Copy, StopCircle, Sparkles } from 'lucide-react';
import ScheduleModal from "./schedule-modal";
import ContentEditor from "./content-editor";

import { useContentState, ContentIdea } from "@/hooks/useContentState";
import type { ContentIdea as SharedContentIdea } from "@shared/schema";

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
  const [clearIdeas, setClearIdeas] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<ContentIdea | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const [selectedGenerationType, setSelectedGenerationType] = useState<'date' | 'competitor' | 'trending'>('date');
  const [isMobile, setIsMobile] = useState(false);
  const [numberOfIdeas, setNumberOfIdeas] = useState(3);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { state, addGeneratedIdeas, setGenerating, saveIdea, clearGeneratedIdeas, separateIdeasAndLinks } = useContentState();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updateNicheMutation = useMutation({
    mutationFn: async (data: { niche: string; competitors?: string }) => {
      // If competitors are provided, use the PUT endpoint that handles both
      if (data.competitors && data.competitors.trim()) {
        const competitorsArray = data.competitors.split(',').map(c => c.trim().replace(/^@+/, '')).filter(Boolean);
        const response = await apiRequest("PUT", "/api/user/competitors", { 
          niche: data.niche, 
          competitors: competitorsArray 
        });
        return response.json();
      } else {
        // Otherwise, just update niche using PATCH
        const response = await apiRequest("PATCH", "/api/user/niche", { niche: data.niche });
        return response.json();
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowOptions(true);
      const hasCompetitors = variables.competitors && variables.competitors.trim();
      toast({
        title: "Success",
        description: hasCompetitors 
          ? "Your niche and competitors have been updated successfully!" 
          : "Your niche has been updated successfully!",
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

  const [streamingStatus, setStreamingStatus] = useState<{
    isStreaming: boolean;
    currentStep: string;
    progress: { current: number; total: number } | null;
  }>({
    isStreaming: false,
    currentStep: '',
    progress: null
  });
  
  const [streamingAbortController, setStreamingAbortController] = useState<AbortController | null>(null);
  
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    });
  };
  
  const stopGeneration = () => {
    if (streamingAbortController) {
      streamingAbortController.abort();
      setStreamingAbortController(null);
    }
    setGenerating(false);
    setStreamingStatus({
      isStreaming: false,
      currentStep: '',
      progress: null
    });
    toast({
      title: "Generation Stopped",
      description: "Content generation has been stopped",
    });
  };

  const generateContentWithStream = async (generationType: 'date' | 'competitor' | 'trending', numberOfIdeas: number = 3) => {
    setGenerating(true, generationType);
    setStreamingStatus({
      isStreaming: true,
      currentStep: 'Starting content generation...',
      progress: null
    });

    try {
      const abortController = new AbortController();
      setStreamingAbortController(abortController);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/content/generate/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          generationType,
          context: generationType,
          numberOfIdeas
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      const newIdeas: ContentIdea[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'status':
                  setStreamingStatus(prev => ({
                    ...prev,
                    currentStep: data.message
                  }));
                  break;
                  
                case 'progress':
                  setStreamingStatus(prev => ({
                    ...prev,
                    currentStep: data.message,
                    progress: { current: data.current, total: data.total }
                  }));
                  break;
                  
                case 'content':
                  // Add the new idea immediately to the UI using database ID
                  const newIdea = {
                    ...data.content,
                    generationType: generationType,
                    isSaved: false,
                    sourceUrl: data.sourceUrl || null
                  };
                  newIdeas.push(newIdea);
                  addGeneratedIdeas([newIdea], generationType);
                  break;
                  
                case 'complete':
                  setStreamingStatus(prev => ({
                    ...prev,
                    currentStep: data.message,
                    progress: null
                  }));
                  break;
                  
                case 'error':
                  console.error('Streaming error received:', data.message);
                  throw new Error(data.message);
              }
            } catch (err) {
              // If it's our intentional error (from error case), re-throw it
              if (err instanceof Error && (
                err.message.includes('No competitors added') ||
                err.message.includes('No trending posts available') ||
                err.message.includes('Cache warming timed out') ||
                err.message.includes('Instagram scraper not available')
              )) {
                throw err;
              }
              console.warn('Failed to parse SSE data:', err);
            }
          }
        }
      }

      toast({
        title: "Success",
        description: `Generated ${newIdeas.length} content ideas in real-time!`,
      });

    } catch (error) {
      console.error('Stream generation error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast({
          title: "Generation Stopped",
          description: "Content generation was cancelled",
        });
      } else {
        // Handle specific error messages
        const errorMessage = error instanceof Error ? error.message : "Failed to generate content";
        
        if (errorMessage.includes("No competitors added")) {
          toast({
            title: "No Competitors Added",
            description: "Please add competitors first in the Niche section to generate competitor analysis content.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } finally {
      setGenerating(false, generationType);
      setStreamingAbortController(null);
      setStreamingStatus({
        isStreaming: false,
        currentStep: '',
        progress: null
      });
    }
  };

  const generateContentMutation = useMutation({
    mutationFn: async ({ type, numberOfIdeas }: { type: 'date' | 'competitor' | 'trending'; numberOfIdeas: number }) => {
      return generateContentWithStream(type, numberOfIdeas);
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
      // Error handling is now done in the streaming function
    },
  });

  // Legacy mutation for fallback
  const generateContentLegacyMutation = useMutation({
    mutationFn: async (generationType: 'date' | 'competitor' | 'trending') => {
      setGenerating(true, generationType);
      const response = await apiRequest("POST", "/api/content/generate", {
        generationType,
        context: generationType
      });
      return response.json();
    },
    onSuccess: (data: ContentIdea[], variables: 'date' | 'competitor' | 'trending') => {
      if (clearIdeas) {
        clearGeneratedIdeas();
        setClearIdeas(false);
      }
      addGeneratedIdeas(data, variables);
      toast({
        title: "Success",
        description: `Generated ${data.length} content ideas using real Instagram data!`,
      });
    },
    onError: (error: any) => {
      setGenerating(false);
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
      
      // Handle Apify/Instagram data failures specifically
      if (error.message?.includes("Failed to fetch Instagram data") || 
          error.message?.includes("Apify API not configured") ||
          error.message?.includes("No competitor data available") ||
          error.message?.includes("No trending data available")) {
        toast({
          title: "Instagram Data Required",
          description: "Real Instagram data is required for content generation. Please check your settings and try again.",
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
      // Validate ID before making the request
      if (!Number.isInteger(ideaId) || ideaId > 2147483647 || ideaId < -2147483648) {
        throw new Error('Invalid idea ID. Please refresh the page and try again.');
      }
      
      const response = await apiRequest("PATCH", `/api/content/ideas/${ideaId}/save`, { isSaved });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/ideas/saved"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content/ideas"] });
      // Update the local state to reflect the saved status
      saveIdea(variables.ideaId, variables.isSaved);
      toast({
        title: "Success",
        description: `Idea ${variables.isSaved ? 'saved' : 'unsaved'} successfully!`,
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
      
      // Handle invalid ID error specifically
      if (error.message?.includes('Invalid idea ID')) {
        toast({
          title: "Invalid Content",
          description: "This content idea has an invalid ID. Please refresh the page and generate new ideas.",
          variant: "destructive",
        });
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
    generateContentMutation.mutate({ type, numberOfIdeas });
  };

  const handleSaveIdea = (idea: ContentIdea) => {
    saveIdeaMutation.mutate({ ideaId: idea.id, isSaved: !idea.isSaved });
  };

  const handleScheduleIdea = (idea: ContentIdea) => {
    setSelectedIdea(idea);
    setShowScheduleModal(true);
  };

  const handleRefineIdea = (idea: ContentIdea) => {
    // Dispatch custom event to App level with the specific idea
    const event = new CustomEvent('showRefineIdeas', { detail: { idea } });
    window.dispatchEvent(event);
  };

  const handleEditIdea = (idea: ContentIdea) => {
    setEditingIdea(idea);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setEditingIdea(null);
    setShowEditor(false);
  };

  const handleEditorSave = (updatedIdea: ContentIdea) => {
    // Update the local state with the edited idea
    const updatedIdeas = state.generatedIdeas.map(idea => 
      idea.id === updatedIdea.id ? updatedIdea : idea
    );
    
    // This would require updating the content state hook to support updating ideas
    // For now, we'll just close the editor and let the query invalidation handle the update
    setEditingIdea(null);
    setShowEditor(false);
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
          {isMobile ? (
            // Mobile version with selector and generate button
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="generation-type" className="text-base font-medium text-gray-900 mb-3 block">
                        Choose Generation Type
                      </Label>
                      <Select value={selectedGenerationType} onValueChange={(value: 'date' | 'competitor' | 'trending') => setSelectedGenerationType(value)}>
                        <SelectTrigger className="w-full h-12">
                          <SelectValue placeholder="Select generation type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <div>
                                <div className="font-medium">Date Specific</div>
                                <div className="text-sm text-gray-600">Ideas based on upcoming holidays & festivals</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="competitor">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-green-600" />
                              <div>
                                <div className="font-medium">Competitor Analysis</div>
                                <div className="text-sm text-gray-600">Analyze top posts from your competitors</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="trending">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="h-4 w-4 text-red-600" />
                              <div>
                                <div className="font-medium">Trending Posts</div>
                                <div className="text-sm text-gray-600">Discover what's trending in your niche</div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="number-of-ideas" className="text-base font-medium text-gray-900 mb-3 block">
                        Number of Ideas
                      </Label>
                      <Select value={numberOfIdeas.toString()} onValueChange={(value) => setNumberOfIdeas(parseInt(value))}>
                        <SelectTrigger className="w-full h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 idea</SelectItem>
                          <SelectItem value="2">2 ideas</SelectItem>
                          <SelectItem value="3">3 ideas</SelectItem>
                          <SelectItem value="4">4 ideas</SelectItem>
                          <SelectItem value="5">5 ideas</SelectItem>
                          <SelectItem value="6">6 ideas</SelectItem>
                          <SelectItem value="8">8 ideas</SelectItem>
                          <SelectItem value="10">10 ideas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleGenerateIdeas(selectedGenerationType)}
                    disabled={generateContentMutation.isPending || state.isGenerating}
                    className="w-full h-12 instagram-gradient text-white hover:opacity-90 flex items-center justify-center space-x-2 text-base font-medium"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span>
                      {generateContentMutation.isPending || state.isGenerating ? "Generating..." : "Generate Ideas"}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Desktop version with cards and number selector
            <div className="space-y-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Number of Ideas</h3>
                      <p className="text-sm text-gray-600">Choose how many ideas to generate</p>
                    </div>
                    <Select value={numberOfIdeas.toString()} onValueChange={(value) => setNumberOfIdeas(parseInt(value))}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 idea</SelectItem>
                        <SelectItem value="2">2 ideas</SelectItem>
                        <SelectItem value="3">3 ideas</SelectItem>
                        <SelectItem value="4">4 ideas</SelectItem>
                        <SelectItem value="5">5 ideas</SelectItem>
                        <SelectItem value="6">6 ideas</SelectItem>
                        <SelectItem value="8">8 ideas</SelectItem>
                        <SelectItem value="10">10 ideas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card 
                  className="cursor-pointer hover:border-purple-500 transition-colors group"
                  onClick={() => handleGenerateIdeas('date')}
                >
                  <CardContent className="p-6 text-left">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                      <Calendar className="h-6 w-6 text-blue-600" />
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
                      <Users className="h-6 w-6 text-green-600" />
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
                      <TrendingUp className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Trending Posts</h3>
                    <p className="text-gray-600 text-sm">Discover what's trending in your niche right now</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Real-time Streaming Progress */}
          {streamingStatus.isStreaming && (
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-blue-900">Real-time Generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {streamingStatus.progress && (
                      <Badge variant="outline" className="text-blue-700 bg-blue-100">
                        {streamingStatus.progress.current}/{streamingStatus.progress.total}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopGeneration}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <StopCircle className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-blue-700 mb-2">{streamingStatus.currentStep}</p>
                {streamingStatus.progress && (
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(streamingStatus.progress.current / streamingStatus.progress.total) * 100}%` 
                      }}
                    ></div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(generateContentMutation.isPending || state.isGenerating) && !streamingStatus.isStreaming && (
            <div className="text-center py-8">
              <div className="w-8 h-8 instagram-gradient rounded-lg animate-pulse mx-auto mb-4"></div>
              <p className="text-gray-600">Generating content ideas using real Instagram data...</p>
            </div>
          )}

          {state.generatedIdeas.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Generated Ideas ({state.generatedIdeas.length})</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => clearGeneratedIdeas()}
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
              
              {(() => {
                const renderIdeasWithDividers = () => {
                  const components = [];
                  let currentIndex = 0;
                  
                  for (let sessionIndex = 0; sessionIndex < state.generationSessions.length; sessionIndex++) {
                    const session = state.generationSessions[sessionIndex];
                    const sessionIdeas = state.generatedIdeas.slice(currentIndex, currentIndex + session.count);
                    
                    // Add divider panel (except for the first session)
                    if (sessionIndex > 0) {
                      components.push(
                        <div key={`divider-${sessionIndex}`} className="my-8">
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-4 bg-white text-gray-500 font-medium">
                                {session.type === 'date' && <Calendar className="inline h-4 w-4 mr-1" />}
                                {session.type === 'competitor' && <Users className="inline h-4 w-4 mr-1" />}
                                {session.type === 'trending' && <TrendingUp className="inline h-4 w-4 mr-1" />}
                                {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Ideas • {session.count} posts • {new Date(session.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Add ideas grid for this session
                    components.push(
                      <div key={`session-${sessionIndex}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sessionIdeas.map((idea) => {
                          // Use backend-separated fields if available, otherwise fall back to frontend parsing
                          const strategy = (idea as any).strategy || separateIdeasAndLinks(idea.ideas).strategy;
                          const sourceUrl = (idea as any).sourceUrl || idea.sourceUrl || separateIdeasAndLinks(idea.ideas).link;
                          
                          return (
                            <Card key={idea.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">
                                        {idea.headline || 'Untitled Idea'}
                                      </h4>
                                      <button 
                                        onClick={() => copyToClipboard(idea.headline || 'Untitled Idea', 'Headline')}
                                        className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {idea.generationType}
                                    </Badge>
                                  </div>
                                  <button 
                                    onClick={() => handleSaveIdea(idea)}
                                    className={`ml-2 ${idea.isSaved ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                                  >
                                    <i className="fas fa-bookmark"></i>
                                  </button>
                                </div>
                                
                                <div className="space-y-2">
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="block text-xs font-medium text-gray-500">CAPTION</label>
                                      <button 
                                        onClick={() => copyToClipboard(idea.caption, 'Caption')}
                                        className="text-gray-400 hover:text-gray-600"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded line-clamp-4">{idea.caption}</p>
                                  </div>
                                  
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="block text-xs font-medium text-gray-500">HASHTAGS</label>
                                      <button 
                                        onClick={() => copyToClipboard(idea.hashtags, 'Hashtags')}
                                        className="text-gray-400 hover:text-gray-600"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded break-all line-clamp-3">{idea.hashtags}</p>
                                  </div>
                                  
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="block text-xs font-medium text-gray-500">STRATEGY</label>
                                      <button 
                                        onClick={() => copyToClipboard(strategy, 'Strategy')}
                                        className="text-gray-400 hover:text-gray-600"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-gray-600 bg-green-50 p-2 rounded whitespace-pre-line line-clamp-4">{strategy}</p>
                                  </div>
                                  
                                  {sourceUrl && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">SOURCE</label>
                                      <a 
                                        href={sourceUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded flex items-center gap-1"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        View Instagram Post
                                      </a>
                                    </div>
                                  )}
                                </div>
                              
                                <div className="flex space-x-1 mt-3 pt-3 border-t border-gray-100">
                                  <Button 
                                    onClick={() => handleScheduleIdea(idea)}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs py-1"
                                  >
                                    Schedule
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    className="flex-1 text-xs py-1"
                                    onClick={() => handleRefineIdea(idea)}
                                  >
                                    Refine
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    className="flex-1 text-xs py-1"
                                    onClick={() => handleEditIdea(idea)}
                                  >
                                    Edit
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    );
                    
                    currentIndex += session.count;
                  }
                  
                  return components;
                };
                
                return renderIdeasWithDividers();
              })()}
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

      {showEditor && editingIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ContentEditor
            content={editingIdea}
            type="idea"
            onClose={handleEditorClose}
            onSave={handleEditorSave}
          />
        </div>
      )}
    </div>
  );
}
