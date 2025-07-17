import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageSquare, Zap } from 'lucide-react';

interface UsageData {
  generationsUsed: number;
  refineMessagesUsed: number;
  generationLimit: number;
  refineMessageLimit: number;
  date: string;
}

const UsageTracker: React.FC = () => {
  const { data: usage, isLoading, error } = useQuery<UsageData>({
    queryKey: ['/api/usage'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Usage Today
          </CardTitle>
          <CardDescription>Loading usage data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Usage Today
          </CardTitle>
          <CardDescription>Unable to load usage data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const generationPercentage = usage ? (usage.generationsUsed / usage.generationLimit) * 100 : 0;
  const refinePercentage = usage ? (usage.refineMessagesUsed / usage.refineMessageLimit) * 100 : 0;

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'destructive';
    if (percentage >= 80) return 'secondary';
    return 'default';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Usage Today
        </CardTitle>
        <CardDescription>Beta plan limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content Generations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Content Generation</span>
            </div>
            <Badge variant={getStatusColor(generationPercentage)}>
              {usage?.generationsUsed || 0}/{usage?.generationLimit || 2}
            </Badge>
          </div>
          <Progress value={generationPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {usage?.generationLimit - (usage?.generationsUsed || 0)} generations remaining
          </p>
        </div>

        {/* Refine Messages */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">AI Refine Chat</span>
            </div>
            <Badge variant={getStatusColor(refinePercentage)}>
              {usage?.refineMessagesUsed || 0}/{usage?.refineMessageLimit || 30}
            </Badge>
          </div>
          <Progress value={refinePercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {usage?.refineMessageLimit - (usage?.refineMessagesUsed || 0)} messages remaining this month
          </p>
        </div>

        {/* Reset info */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Content generations reset daily at midnight.
            Refine messages reset monthly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageTracker;