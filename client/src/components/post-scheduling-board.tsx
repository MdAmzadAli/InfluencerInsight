import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ExternalLink,
  Hash,
  Lightbulb
} from "lucide-react";
import { format } from "date-fns";
import type { ScheduledPost } from "@shared/schema";

export default function PostSchedulingBoard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [selectedColumn, setSelectedColumn] = useState('scheduled');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: scheduledPosts = [], isLoading } = useQuery({
    queryKey: ["/api/posts/scheduled"],
    retry: false,
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
        description: "Failed to update post status. Please try again.",
        variant: "destructive",
      });
    },
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
    const status = post.status || 'scheduled';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(post);
    return acc;
  }, {} as Record<string, ScheduledPost[]>);

  const columns = [
    {
      id: 'scheduled',
      title: 'Scheduled',
      icon: Circle,
      color: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-700',
      badgeColor: 'bg-gray-500',
      description: 'Posts scheduled for publishing'
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
        <>
          {/* Mobile View - Column Selector */}
          {isMobile && (
            <div className="mb-6">
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => {
                    const posts = groupedPosts[column.id] || [];
                    const Icon = column.icon;
                    return (
                      <SelectItem key={column.id} value={column.id}>
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span>{column.title}</span>
                          <Badge className="ml-auto bg-gray-500 text-white">
                            {posts.length}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mobile View - Selected Column Posts */}
          {isMobile ? (
            <div className="space-y-4">
              {(() => {
                const selectedColumnData = columns.find(c => c.id === selectedColumn);
                const posts = groupedPosts[selectedColumn] || [];
                
                if (posts.length === 0) {
                  return (
                    <Card className="p-8 text-center">
                      <CardContent>
                        <div className="text-gray-400 mb-4">
                          {selectedColumnData?.icon && (() => {
                            const Icon = selectedColumnData.icon;
                            return <Icon className="h-12 w-12 mx-auto" />;
                          })()}
                        </div>
                        <p className="text-gray-500 text-lg mb-2">
                          No posts in {selectedColumnData?.title.toLowerCase()}
                        </p>
                      </CardContent>
                    </Card>
                  );
                }
                
                return posts.map((post: ScheduledPost) => (
                  <Card key={post.id} className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      {/* Post Header - Clickable to view details */}
                      <div className="cursor-pointer" onClick={() => setSelectedPost(post)}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-gray-900 line-clamp-2 hover:text-purple-600">
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
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPost(post);
                              }}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePost(post.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Actions - Separate from post detail click */}
                      <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mr-2 py-1">Move to:</div>
                        {columns.map((targetColumn) => {
                          if (targetColumn.id === selectedColumn) return null;
                          const TargetIcon = targetColumn.icon;
                          return (
                            <Button
                              key={targetColumn.id}
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                movePost(post.id, targetColumn.id);
                              }}
                              className="text-xs py-1 px-2 hover:bg-purple-50"
                              disabled={updatePostMutation.isPending}
                            >
                              <TargetIcon className="h-3 w-3 mr-1" />
                              {targetColumn.title}
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>
          ) : (
            /* Desktop View - Column Grid with wider posts */
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
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
                    
                    <div className="flex-1 space-y-4 min-h-96">
                      {posts.map((post: ScheduledPost) => (
                        <Card key={post.id} className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            {/* Post Header - Clickable to view details */}
                            <div className="cursor-pointer" onClick={() => setSelectedPost(post)}>
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h4 className="text-base font-semibold text-gray-900 line-clamp-2 hover:text-purple-600 mb-2">
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
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPost(post);
                                    }}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deletePost(post.id);
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Progress Actions - Separate from post detail click */}
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                              <div className="text-xs text-gray-500 mr-2 py-1">Move to:</div>
                              {columns.map((targetColumn) => {
                                if (targetColumn.id === column.id) return null;
                                const TargetIcon = targetColumn.icon;
                                return (
                                  <Button
                                    key={targetColumn.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      movePost(post.id, targetColumn.id);
                                    }}
                                    className="text-xs py-1 px-3 hover:bg-purple-50"
                                    disabled={updatePostMutation.isPending}
                                  >
                                    <TargetIcon className="h-3 w-3 mr-1" />
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
        </>
      )}
      
      {/* Post Detail Modal */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedPost?.headline}</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {selectedPost?.isCustom ? 'Custom' : 'AI Generated'}
                </Badge>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {selectedPost && format(new Date(selectedPost.scheduledDate), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Headline</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selectedPost.headline, 'Headline')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedPost.headline}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Caption</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selectedPost.caption, 'Caption')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                  {selectedPost.caption}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Hash className="h-5 w-5 mr-1" />
                    Hashtags
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selectedPost.hashtags, 'Hashtags')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <p className="text-blue-600 bg-blue-50 p-3 rounded-lg">
                  {selectedPost.hashtags}
                </p>
              </div>
              
              {selectedPost.ideas && (
                <>
                  <Separator />
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Lightbulb className="h-5 w-5 mr-1" />
                        Strategy & Ideas
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(selectedPost.ideas || '', 'Ideas')}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg whitespace-pre-wrap">
                      {selectedPost.ideas}
                    </p>
                  </div>
                </>
              )}
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <p>Status: <span className="font-medium">{selectedPost.status || 'TODO'}</span></p>
                  <p>Created: {format(new Date(selectedPost.scheduledDate), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      deletePost(selectedPost.id);
                      setSelectedPost(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}