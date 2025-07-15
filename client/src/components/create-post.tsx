import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import ScheduleModal from "./schedule-modal";

interface CustomPost {
  headline: string;
  caption: string;
  hashtags: string;
  ideas: string;
}

export default function CreatePost() {
  const [post, setPost] = useState<CustomPost>({
    headline: "",
    caption: "",
    hashtags: "",
    ideas: ""
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const schedulePostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const response = await apiRequest("POST", "/api/posts/schedule", postData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post scheduled successfully!",
      });
      setShowScheduleModal(false);
      // Reset form
      setPost({
        headline: "",
        caption: "",
        hashtags: "",
        ideas: ""
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
        description: "Failed to schedule post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof CustomPost, value: string) => {
    setPost(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSchedulePost = () => {
    if (!post.headline.trim() || !post.caption.trim()) {
      toast({
        title: "Error",
        description: "Please fill in at least the headline and caption.",
        variant: "destructive",
      });
      return;
    }

    setShowScheduleModal(true);
  };

  const saveIdeaMutation = useMutation({
    mutationFn: async (ideaData: CustomPost) => {
      const response = await apiRequest("POST", "/api/content/ideas", ideaData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Idea saved successfully!",
      });
      // Invalidate and refetch content ideas to update saved ideas section
      queryClient.invalidateQueries({ queryKey: ['/api/content/ideas'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content/ideas/saved'] });
      // Reset form
      setPost({
        headline: "",
        caption: "",
        hashtags: "",
        ideas: ""
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

  const handleSaveIdea = () => {
    if (!post.headline.trim() || !post.caption.trim()) {
      toast({
        title: "Error",
        description: "Please fill in at least the headline and caption.",
        variant: "destructive",
      });
      return;
    }

    saveIdeaMutation.mutate(post);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Custom Post</h2>
        <p className="text-gray-600">Manually create your Instagram content with custom inputs</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                placeholder="Catchy headline for your post..."
                value={post.headline}
                onChange={(e) => handleInputChange('headline', e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Write your engaging caption here..."
                value={post.caption}
                onChange={(e) => handleInputChange('caption', e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="hashtags">Hashtags</Label>
              <Textarea
                id="hashtags"
                placeholder="#hashtag1 #hashtag2 #hashtag3..."
                value={post.hashtags}
                onChange={(e) => handleInputChange('hashtags', e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="ideas">Content Ideas</Label>
              <Textarea
                id="ideas"
                placeholder="Additional content ideas and suggestions..."
                value={post.ideas}
                onChange={(e) => handleInputChange('ideas', e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
            
            <div className="flex space-x-4">
              <Button 
                onClick={handleSchedulePost}
                className="instagram-gradient text-white hover:opacity-90"
              >
                Schedule Post
              </Button>
              <Button 
                onClick={handleSaveIdea}
                variant="outline"
                disabled={saveIdeaMutation.isPending}
              >
                {saveIdeaMutation.isPending ? "Saving..." : "Save Idea"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showScheduleModal && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          customPost={post}
        />
      )}
    </div>
  );
}
