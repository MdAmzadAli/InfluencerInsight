import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Circle, 
  PlayCircle, 
  Eye,
  Trash2,
  ArrowRight,
  Copy,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import type { ScheduledPost } from "@shared/schema";

export default function PostSchedulingBoard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scheduledPosts = [], isLoading } = useQuery({
    queryKey: ["/api/posts/scheduled"],
    retry: false,
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, status }: { postId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/posts/scheduled/${postId}`, { status });
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
        description: "Failed to update post status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest("DELETE", `/api/posts/scheduled/${postId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/scheduled"] });
      toast({
        title: "Success",
        description: "Post deleted successfully!",
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

  // Group posts by status
  const groupedPosts = scheduledPosts.reduce((acc, post) => {
    const status = post.status || 'TODO';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(post);
    return acc;
  }, {} as Record<string, ScheduledPost[]>);

  const columns = [
    {
      id: 'TODO',
      title: 'To Do',
      icon: Circle,
      color: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-700',
      badgeColor: 'bg-gray-500',
      description: 'Posts ready to be worked on'
    },
    {
      id: 'IN_PROGRESS',
      title: 'In Progress',
      icon: PlayCircle,
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
      badgeColor: 'bg-blue-500',
      description: 'Posts currently being prepared'
    },
    {
      id: 'IN_REVIEW',
      title: 'In Review',
      icon: Eye,
      color: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-700',
      badgeColor: 'bg-yellow-500',
      description: 'Posts under review'
    },
    {
      id: 'DONE',
      title: 'Done',
      icon: CheckCircle,
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
      badgeColor: 'bg-green-500',
      description: 'Posts completed/published'
    },
  ];

  const movePost = (postId: number, newStatus: string) => {
    updatePostMutation.mutate({ postId, status: newStatus });
  };

  const deletePost = (postId: number) => {
    if (window.confirm("Are you sure you want to delete this scheduled post?")) {
      deletePostMutation.mutate(postId);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600 mb-4"></div>
          <p className="text-gray-600">Loading scheduled posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <Calendar className="h-6 w-6 mr-2" />
          Post Scheduling Board
        </h1>
        <p className="text-gray-600">
          Manage your Instagram posts like a Jira board - click buttons to move posts between statuses
        </p>
      </div>

      {scheduledPosts.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent>
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg mb-2">No scheduled posts yet!</p>
            <p className="text-gray-400 text-sm">
              Schedule your first post from the Generate Ideas or Create Post sections.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => {
            const posts = groupedPosts[column.id] || [];
            const Icon = column.icon;
            
            return (
              <div key={column.id} className="flex flex-col">
                <Card className={`${column.color} border-2 mb-4`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-sm flex items-center ${column.textColor}`}>
                      <Icon className="h-4 w-4 mr-2" />
                      {column.title}
                      <Badge className={`ml-auto ${column.badgeColor} text-white`}>
                        {posts.length}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-gray-600 mt-1">
                      {column.description}
                    </p>
                  </CardHeader>
                </Card>
                
                <div className="flex-1 space-y-3 min-h-96">
                  {posts.map((post: ScheduledPost) => (
                    <Card key={post.id} className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
                              {post.headline}
                            </h4>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {post.isCustom ? 'Custom' : 'AI Generated'}
                              </Badge>
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(new Date(post.scheduledDate), 'MMM d, h:mm a')}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePost(post.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-medium text-gray-500">CAPTION</label>
                              <button 
                                onClick={() => copyToClipboard(post.caption, 'Caption')}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded line-clamp-2">
                              {post.caption}
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-medium text-gray-500">HASHTAGS</label>
                              <button 
                                onClick={() => copyToClipboard(post.hashtags, 'Hashtags')}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded line-clamp-1">
                              {post.hashtags}
                            </p>
                          </div>
                        </div>
                      
                        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100">
                          {columns.map((targetColumn) => {
                            if (targetColumn.id === column.id) return null;
                            return (
                              <Button
                                key={targetColumn.id}
                                variant="outline"
                                size="sm"
                                onClick={() => movePost(post.id, targetColumn.id)}
                                className="text-xs py-1 px-2"
                                disabled={updatePostMutation.isPending}
                              >
                                <ArrowRight className="h-3 w-3 mr-1" />
                                {targetColumn.title}
                              </Button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {posts.length === 0 && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <p className="text-gray-500 text-sm">
                        No posts in {column.title.toLowerCase()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}