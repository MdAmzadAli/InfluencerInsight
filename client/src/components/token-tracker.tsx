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
  ideas: {
    canGenerate: boolean;
    ideasRemaining: number;
    ideasGenerated: number;
    dailyLimit: number;
  };
}

export default function TokenTracker() {
  const { data: status, isLoading } = useQuery<TokenStatus>({
    queryKey: ['/api/user/tokens'],
    refetchInterval: 30000, // Refresh every 30 seconds
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
  const ideasPercentage = (status.ideas.ideasGenerated / status.ideas.dailyLimit) * 100;

  return (
    <div className="space-y-3">
      {/* Tokens Tracker */}
      <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {status.tokens.tokensRemaining}
              </span>
              <span className="text-xs text-muted-foreground">/ {status.tokens.dailyLimit} tokens</span>
            </div>
            <Progress 
              value={tokenPercentage} 
              className="h-1.5 w-20"
            />
          </div>
        </div>
        
        {status.tokens.tokensRemaining <= 10 && (
          <Badge variant="destructive" className="text-xs">
            Low
          </Badge>
        )}
      </div>

      {/* Ideas Tracker */}
      <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-green-600 dark:text-green-400" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                {status.ideas.ideasRemaining}
              </span>
              <span className="text-xs text-muted-foreground">/ {status.ideas.dailyLimit} ideas</span>
            </div>
            <Progress 
              value={ideasPercentage} 
              className="h-1.5 w-20"
            />
          </div>
        </div>
        
        {status.ideas.ideasRemaining <= 3 && (
          <Badge variant="destructive" className="text-xs">
            Low
          </Badge>
        )}
      </div>
    </div>
  );
}