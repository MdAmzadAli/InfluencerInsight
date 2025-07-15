import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Edit3, 
  Save, 
  X, 
  Copy, 
  Calendar,
  Bookmark,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import type { ContentIdea, ScheduledPost } from "@shared/schema";

interface ContentEditorProps {
  content: ContentIdea | ScheduledPost;
  type: 'idea' | 'scheduled';
  onClose?: () => void;
  onSave?: (content: ContentIdea | ScheduledPost) => void;
}

export default function ContentEditor({ content, type, onClose, onSave }: ContentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [headline, setHeadline] = useState(content.headline);
  const [caption, setCaption] = useState(content.caption);
  const [hashtags, setHashtags] = useState(content.hashtags);
  const [ideas, setIdeas] = useState('ideas' in content ? content.ideas : '');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateContentMutation = useMutation({
    mutationFn: async (updates: Partial<ContentIdea | ScheduledPost>) => {
      const endpoint = type === 'idea' 
        ? `/api/content/ideas/${content.id}` 
        : `/api/posts/scheduled/${content.id}`;
      
      const response = await apiRequest(endpoint, {
        method: "PATCH",
        body: JSON.stringify(updates)
      });
      return response.json();
    },
    onSuccess: (updatedContent) => {
      // Invalidate relevant queries
      if (type === 'idea') {
        queryClient.invalidateQueries({ queryKey: ["/api/content/ideas"] });
        queryClient.invalidateQueries({ queryKey: ["/api/content/ideas/saved"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/posts/scheduled"] });
      }
      
      setIsEditing(false);
      onSave?.(updatedContent);
      
      toast({
        title: "Success",
        description: "Content updated successfully!",
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
        description: "Failed to update content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const updates = {
      headline,
      caption,
      hashtags,
      ...(type === 'idea' && { ideas })
    };
    
    updateContentMutation.mutate(updates);
  };

  const handleCancel = () => {
    setHeadline(content.headline);
    setCaption(content.caption);
    setHashtags(content.hashtags);
    setIdeas('ideas' in content ? content.ideas : '');
    setIsEditing(false);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    });
  };

  const separateIdeasAndLinks = (ideas: string) => {
    const sourceMatch = ideas.match(/Source:\s*(https?:\/\/[^\s]+)/i);
    
    if (sourceMatch) {
      const link = sourceMatch[1];
      const strategy = ideas.replace(/Source:\s*https?:\/\/[^\s]+/i, '').trim();
      return { strategy, link };
    }
    
    return { strategy: ideas, link: '' };
  };

  const { strategy, link } = type === 'idea' ? separateIdeasAndLinks(ideas) : { strategy: '', link: '' };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isEditing ? "Edit Content" : "Content Details"}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Content metadata */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {'generationType' in content && (
            <Badge variant="outline">{content.generationType}</Badge>
          )}
          {'scheduledDate' in content && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(content.scheduledDate), 'PPP')}</span>
            </div>
          )}
          {'isSaved' in content && content.isSaved && (
            <div className="flex items-center space-x-1">
              <Bookmark className="h-4 w-4 text-yellow-500" />
              <span>Saved</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Headline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Headline
          </label>
          {isEditing ? (
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Enter headline..."
              className="w-full"
            />
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-900 font-medium">{headline}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(headline, "Headline")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Caption
          </label>
          {isEditing ? (
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Enter caption..."
              rows={4}
              className="w-full"
            />
          ) : (
            <div className="flex items-start justify-between">
              <p className="text-gray-900 flex-1 whitespace-pre-wrap">{caption}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(caption, "Caption")}
                className="ml-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Hashtags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hashtags
          </label>
          {isEditing ? (
            <Textarea
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="Enter hashtags..."
              rows={2}
              className="w-full"
            />
          ) : (
            <div className="flex items-start justify-between">
              <p className="text-blue-600 flex-1 break-all">{hashtags}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(hashtags, "Hashtags")}
                className="ml-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Ideas/Strategy - only for content ideas */}
        {type === 'idea' && (
          <>
            <Separator />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strategy
              </label>
              {isEditing ? (
                <Textarea
                  value={ideas}
                  onChange={(e) => setIdeas(e.target.value)}
                  placeholder="Enter strategy..."
                  rows={3}
                  className="w-full"
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="text-gray-900 flex-1 whitespace-pre-wrap">{strategy}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(strategy, "Strategy")}
                      className="ml-2"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {link && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <ExternalLink className="h-4 w-4" />
                      <a 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View source inspiration
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Action buttons when editing */}
        {isEditing && (
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={updateContentMutation.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateContentMutation.isPending}
              className="instagram-gradient text-white hover:opacity-90"
            >
              <Save className="h-4 w-4 mr-1" />
              {updateContentMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}