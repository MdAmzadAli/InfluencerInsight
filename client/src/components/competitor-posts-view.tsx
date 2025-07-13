import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CompetitorPost {
  id: string;
  username: string;
  caption: string;
  hashtags: string[];
  likes?: number;
  comments?: number;
  imageUrl?: string;
  postUrl: string;
  profileUrl: string;
  timestamp: Date;
}

interface CompetitorPostsViewProps {
  posts: CompetitorPost[];
  isLoading?: boolean;
}

export default function CompetitorPostsView({ posts, isLoading }: CompetitorPostsViewProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) {
      return '0';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Competitor Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Competitor Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No competitor posts found. Add competitors to analyze their top-performing content.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Top Competitor Posts
          <Badge variant="secondary">{posts.length} posts</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
        {posts.map((post, index) => (
          <div key={post.id} className="border rounded-lg p-4 space-y-3">
            {/* Header with competitor info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">#{index + 1}</Badge>
                <a 
                  href={post.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 hover:text-blue-800"
                >
                  @{post.username}
                </a>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {formatNumber(post.likes)}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {formatNumber(post.comments)}
                </div>
              </div>
            </div>

            {/* Post image */}
            {post.imageUrl && (
              <div className="aspect-square max-w-sm mx-auto">
                <img 
                  src={post.imageUrl} 
                  alt="Post content"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}

            {/* Caption */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Caption:</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(post.caption, "Caption")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                {post.caption}
              </p>
            </div>

            {/* Hashtags */}
            {post.hashtags.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Hashtags:</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(post.hashtags.join(' '), "Hashtags")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {post.hashtags.slice(0, 10).map((hashtag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {hashtag}
                    </Badge>
                  ))}
                  {post.hashtags.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{post.hashtags.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(post.postUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Post
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}