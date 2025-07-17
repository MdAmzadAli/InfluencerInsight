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
  Lightbulb,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useQuery } from '@tanstack/react-query';


interface SidebarProps {
  competitors: string[];
  posts: any[];
  loadingPosts: boolean;
  onUsageClick?: () => void;
}

function QuickStatsContent({ competitors }: { competitors: string[] }) {
  const { data: contentIdeas = [] } = useQuery({
    queryKey: ['/api/content/ideas'],
  });

  const { data: scheduledPosts = [] } = useQuery({
    queryKey: ['/api/schedule/posts'],
  });

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Ideas Generated</span>
        <Badge variant="outline">{contentIdeas.length}</Badge>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Posts Scheduled</span>
        <Badge variant="outline">{scheduledPosts.length}</Badge>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Competitors</span>
        <Badge variant="outline">{competitors.length}</Badge>
      </div>
    </div>
  );
}

export function Sidebar({ competitors, posts, loadingPosts, onUsageClick }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dashboardExpanded, setDashboardExpanded] = useState(true);
  const [location] = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Niche', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/generate' && location === '/') {
      // Default to generate ideas when on root dashboard
      return true;
    }
    return location === href;
  };

  const dashboardOptions = [
    { name: 'Generate Ideas', href: '/generate' },
    { name: 'Saved Ideas', href: '/saved' },
    { name: 'Create Post', href: '/create' },
    { name: 'Manage Competitors', href: '/manage-competitors' },
  ];

  return (
    <div className={cn(
      "hidden md:flex bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col transition-all duration-300 h-screen sticky top-16",
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
          const isDashboard = item.href === '/';
          
          if (isDashboard && !collapsed) {
            return (
              <div key={item.name} className="space-y-1">
                <Collapsible open={dashboardExpanded} onOpenChange={setDashboardExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant={isActive(item.href) ? "default" : "ghost"}
                      className="w-full justify-between"
                    >
                      <div className="flex items-center">
                        <Icon className="h-4 w-4" />
                        <span className="ml-2">{item.name}</span>
                      </div>
                      {dashboardExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1">
                    <div className="ml-4 pl-4 border-l border-gray-200 dark:border-gray-700 space-y-1">
                      {dashboardOptions.map((option) => (
                        <Link key={option.name} href={option.href}>
                          <Button
                            variant={isActive(option.href) ? "default" : "ghost"}
                            size="sm"
                            className="w-full justify-start text-sm"
                          >
                            {option.name}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          }
          
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
        
        {/* Usage Button */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            collapsed && "justify-center px-0"
          )}
          onClick={onUsageClick}
        >
          <BarChart3 className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Usage</span>}
        </Button>
      </nav>

      {!collapsed && (
        <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
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

          {/* Refine Ideas Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                Refine Ideas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => {
                  // This will be handled by the parent component
                  const event = new CustomEvent('showRefineIdeas');
                  window.dispatchEvent(event);
                }}
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                Open Refine Panel
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Refine and improve your generated ideas with AI assistance
              </p>
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
              <QuickStatsContent competitors={competitors} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}