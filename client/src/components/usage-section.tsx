import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageSquare, Zap, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UsageData {
  generationsUsed: number;
  refineMessagesUsed: number;
  generationLimit: number;
  refineMessageLimit: number;
  date: string;
  resetAt?: string;
}

const UsageSection: React.FC = () => {
  const { data: usage, isLoading, error, refetch } = useQuery<UsageData>({
    queryKey: ['/api/usage'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-2xl font-bold">Usage Overview</h2>
          <Badge variant="outline">Loading...</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Content Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-2 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                AI Refine Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-2 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-2xl font-bold">Usage Overview</h2>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Unable to load usage data. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const generationPercentage = usage ? (usage.generationsUsed / usage.generationLimit) * 100 : 0;
  const refinePercentage = usage ? (usage.refineMessagesUsed / usage.refineMessageLimit) * 100 : 0;

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'destructive';
    if (percentage >= 80) return 'secondary';
    return 'default';
  };

  const getStatusVariant = (percentage: number) => {
    if (percentage >= 100) return 'destructive';
    if (percentage >= 80) return 'secondary';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-2xl font-bold">Usage Overview</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Beta Plan
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Content Generation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Content Generation
            </CardTitle>
            <CardDescription>
              Daily limit for AI-powered content creation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sessions Used</span>
              <Badge variant={getStatusVariant(generationPercentage)}>
                {usage?.generationsUsed || 0}/{usage?.generationLimit || 2}
              </Badge>
            </div>
            <Progress value={generationPercentage} className="h-3" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                {usage?.generationLimit - (usage?.generationsUsed || 0)} sessions remaining today
              </p>
              <p>Each session can generate up to 10 ideas</p>
              <p className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Resets daily at midnight
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Refine Chat Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              AI Refine Chat
            </CardTitle>
            <CardDescription>
              Monthly limit for AI content refinement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Messages Used</span>
              <Badge variant={getStatusVariant(refinePercentage)}>
                {usage?.refineMessagesUsed || 0}/{usage?.refineMessageLimit || 30}
              </Badge>
            </div>
            <Progress value={refinePercentage} className="h-3" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                {usage?.refineMessageLimit - (usage?.refineMessagesUsed || 0)} messages remaining this month
              </p>
              <p>Get AI help to improve your content</p>
              <p className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Resets monthly
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            Beta Plan Details
          </CardTitle>
          <CardDescription>
            Your current plan limitations and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Daily Limits</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 2 content generation sessions</li>
                <li>• Up to 10 ideas per session</li>
                <li>• Competitor changes: 1 per 24 hours</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Monthly Limits</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 30 AI refine chat messages</li>
                <li>• Unlimited content scheduling</li>
                <li>• Unlimited content saving</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Tips</CardTitle>
          <CardDescription>
            Make the most of your beta plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <p>Use content generation strategically - each session can create up to 10 ideas</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <p>Save your best ideas to avoid regenerating similar content</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <p>Use AI refine chat to improve existing content rather than generating new ones</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <p>Schedule your content in advance to maintain consistency</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageSection;