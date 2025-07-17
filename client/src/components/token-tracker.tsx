import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Coins, Lightbulb } from "lucide-react";

interface TokenStatus {
  tokens: {
    canUse: boolean;
    tokensRemaining: number;
    tokensUsed: number;
    dailyLimit: number;
  };
}

export default function TokenTracker() {
  const { data: status, isLoading } = useQuery<TokenStatus>({
    queryKey: ['/api/user/tokens'],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  if (isLoading || !status) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
        <div className="h-4 w-4 animate-pulse bg-muted rounded" />
        <div className="h-3 w-16 animate-pulse bg-muted rounded" />
      </div>
    );
  }

  const tokenPercentage = (status.tokens.tokensUsed / status.tokens.dailyLimit) * 100;
  const usagePercentage = Math.round(tokenPercentage);
  const remainingPercentage = Math.round(100 - tokenPercentage);

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border">
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {remainingPercentage}%
            </span>
            <span className="text-xs text-muted-foreground">remaining</span>
          </div>
          <Progress 
            value={tokenPercentage} 
            className="h-1.5 w-20"
          />
        </div>
      </div>
      
      {status.tokens.tokensRemaining <= 3000 && (
        <Badge variant="destructive" className="text-xs">
          Low
        </Badge>
      )}
    </div>
  );
}