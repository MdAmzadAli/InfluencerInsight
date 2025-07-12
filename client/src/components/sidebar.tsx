import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  Calendar, 
  Users, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SidebarProps {
  competitors: string[];
  posts: any[];
  loadingPosts: boolean;
}

export function Sidebar({ competitors, posts, loadingPosts }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Competitors', href: '/competitors', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => location === href;

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="px-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive(item.href) ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && <span className="ml-2">{item.name}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="flex-1 px-4 py-4 space-y-4">
          {/* Competitors Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Competitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {competitors.length > 0 ? (
                <div className="space-y-2">
                  {competitors.slice(0, 3).map((competitor, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">@{competitor}</span>
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    </div>
                  ))}
                  {competitors.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{competitors.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No competitors added</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Posts Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Recent Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPosts ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-2">
                  {posts.slice(0, 3).map((post, index) => (
                    <div key={index} className="text-sm">
                      <p className="font-medium truncate">@{post.ownerUsername}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {post.caption?.slice(0, 50)}...
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-pink-600">❤️ {post.likesCount}</span>
                        <span className="text-xs text-blue-600">💬 {post.commentsCount}</span>
                      </div>
                    </div>
                  ))}
                  {posts.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{posts.length - 3} more posts
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No posts available</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ideas Generated</span>
                  <Badge variant="outline">24</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Posts Scheduled</span>
                  <Badge variant="outline">8</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Competitors</span>
                  <Badge variant="outline">{competitors.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}