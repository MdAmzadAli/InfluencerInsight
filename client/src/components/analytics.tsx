import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Users, 
  Calendar,
  Target,
  Sparkles,
  Activity
} from "lucide-react";

export default function Analytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');

  // Get content ideas data
  const { data: contentIdeas = [] } = useQuery({
    queryKey: ['/api/content-ideas'],
    enabled: !!user,
  });

  // Get scheduled posts data
  const { data: scheduledPosts = [] } = useQuery({
    queryKey: ['/api/posts/scheduled'],
    enabled: !!user,
  });

  // Mock engagement data for demonstration
  const engagementData = [
    { name: 'Mon', likes: 120, comments: 45, shares: 12 },
    { name: 'Tue', likes: 140, comments: 55, shares: 18 },
    { name: 'Wed', likes: 180, comments: 70, shares: 25 },
    { name: 'Thu', likes: 160, comments: 60, shares: 20 },
    { name: 'Fri', likes: 200, comments: 85, shares: 30 },
    { name: 'Sat', likes: 250, comments: 95, shares: 35 },
    { name: 'Sun', likes: 220, comments: 80, shares: 28 },
  ];

  const contentTypeData = [
    { name: 'Images', value: 45, color: '#8B5CF6' },
    { name: 'Carousels', value: 30, color: '#06B6D4' },
    { name: 'Videos', value: 15, color: '#10B981' },
    { name: 'Stories', value: 10, color: '#F59E0B' },
  ];

  const competitors = user?.competitors ? JSON.parse(user.competitors) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track your Instagram content performance and insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant={timeRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </Button>
          <Button 
            variant={timeRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </Button>
          <Button 
            variant={timeRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ideas Generated</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{contentIdeas.length}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{scheduledPosts.length}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>+8% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">4.2%</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>+0.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competitors Tracked</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{competitors.length}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Active monitoring</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Weekly Engagement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="likes" fill="#8B5CF6" />
                <Bar dataKey="comments" fill="#06B6D4" />
                <Bar dataKey="shares" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Content Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Content Type Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contentTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {contentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {contentTypeData.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>Top Performing Content Ideas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contentIdeas.slice(0, 5).map((idea: any, index: number) => (
              <div key={idea.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium truncate">{idea.headline}</h3>
                  <p className="text-sm text-gray-600 mt-1 truncate">{idea.caption}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {idea.generationType}
                    </Badge>
                    {idea.isSaved && (
                      <Badge variant="outline" className="text-xs">
                        Saved
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4" />
                    <span>{Math.floor(Math.random() * 200) + 50}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{Math.floor(Math.random() * 50) + 10}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Monthly Goals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Content Ideas Generated</span>
                <span className="text-sm text-gray-600">{contentIdeas.length}/50</span>
              </div>
              <Progress value={(contentIdeas.length / 50) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Posts Scheduled</span>
                <span className="text-sm text-gray-600">{scheduledPosts.length}/30</span>
              </div>
              <Progress value={(scheduledPosts.length / 30) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Competitor Analysis</span>
                <span className="text-sm text-gray-600">{competitors.length}/10</span>
              </div>
              <Progress value={(competitors.length / 10) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}