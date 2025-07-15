import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Circle, 
  PlayCircle, 
  Eye,
  Trash2,
  ArrowRight,
  Users,
  MessageSquare,
  Heart,
  Edit3
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import ContentEditor from "./content-editor";
import type { ScheduledPost } from "@shared/schema";

export default function PostScheduling() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const { data: scheduledPosts = [], isLoading } = useQuery({
    queryKey: ["/api/posts/scheduled"],
    retry: false,
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest(`/api/posts/scheduled/${postId}`, { 
        method: "DELETE"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/scheduled"] });
      toast({
        title: "Success",
        description: "Scheduled post deleted successfully!",
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
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, status }: { postId: number; status: string }) => {
      const response = await apiRequest(`/api/posts/scheduled/${postId}`, { 
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/scheduled"] });
      toast({
        title: "Success",
        description: "Post status updated successfully!",
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
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeletePost = (postId: number) => {
    if (window.confirm("Are you sure you want to delete this scheduled post?")) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleUpdateStatus = (postId: number, status: string) => {
    updatePostMutation.mutate({ postId, status });
  };

  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setEditingPost(null);
    setShowEditor(false);
  };

  const handleEditorSave = (updatedPost: ScheduledPost) => {
    setEditingPost(null);
    setShowEditor(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPostTypeIcon = (isCustom: boolean) => {
    return isCustom ? 'fas fa-edit' : 'fas fa-magic';
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-8">
          <div className="w-8 h-8 instagram-gradient rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your scheduled posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Post Scheduling</h2>
        <p className="text-gray-600">Manage your scheduled posts and timing</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Scheduled Posts</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <i className="fas fa-calendar-week mr-2"></i>
                Calendar View
              </Button>
              <Button variant="outline" size="sm">
                <i className="fas fa-list mr-2"></i>
                List View
              </Button>
            </div>
          </div>

          {scheduledPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-calendar-alt text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scheduled Posts</h3>
              <p className="text-gray-600 mb-4">
                You haven't scheduled any posts yet. Create or generate content and schedule it for later!
              </p>
              <Button className="instagram-gradient text-white hover:opacity-90">
                Schedule Your First Post
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledPosts.map((post: ScheduledPost) => (
                <div 
                  key={post.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <i className={`${getPostTypeIcon(post.isCustom)} text-purple-600`}></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{post.headline}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-500">
                            {new Date(post.scheduledDate).toLocaleDateString()} at {new Date(post.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                            {post.status}
                          </span>
                          {post.isCustom && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Custom
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {post.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(post.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => handleEditPost(post)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-gray-400 hover:text-red-600"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </div>

                  {/* Expandable content preview */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">CAPTION PREVIEW</label>
                        <p className="text-gray-700 line-clamp-2">{post.caption}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">HASHTAGS</label>
                        <p className="text-blue-600 text-xs line-clamp-1">{post.hashtags}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showEditor && editingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ContentEditor
            content={editingPost}
            type="scheduled"
            onClose={handleEditorClose}
            onSave={handleEditorSave}
          />
        </div>
      )}
    </div>
  );
}
