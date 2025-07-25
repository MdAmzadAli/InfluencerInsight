import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Users, RefreshCw, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CompetitorsManagement() {
  const [newCompetitor, setNewCompetitor] = useState("");
  const [pendingCompetitors, setPendingCompetitors] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data: eligibility } = useQuery({
    queryKey: ["/api/user/competitors/eligibility"],
    refetchOnWindowFocus: false,
  });

  const savedCompetitors = user?.competitors ? 
    (typeof user.competitors === 'string' ? 
      (user.competitors.startsWith('[') ? JSON.parse(user.competitors) : user.competitors.split(',').filter(Boolean)) : 
      (Array.isArray(user.competitors) ? user.competitors : JSON.parse(user.competitors))
    ) : [];
  
  const allCompetitors = [...savedCompetitors, ...pendingCompetitors];
  const hasChanges = pendingCompetitors.length > 0;

  const updateCompetitorsMutation = useMutation({
    mutationFn: async (competitors: string[]) => {
      return apiRequest('PUT', '/api/user/competitors-only', {
        niche: user?.niche || 'general', 
        competitors: competitors 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/competitors/eligibility"] });
      setPendingCompetitors([]);
      toast({
        title: "Success",
        description: "Competitors saved successfully",
      });
    },
    onError: (error) => {
      let errorMessage = "Unable to save competitors right now. Please try again in a few minutes.";
      
      // Handle specific error types with user-friendly messages
      if (error.message?.includes("24 hours")) {
        errorMessage = `You can only change competitors once per 24 hours. Please wait and try again later.`;
      } else if (error.message?.includes("competitor")) {
        errorMessage = "Unable to update competitors. Please check your entries and try again.";
      }
      
      toast({
        title: "Cannot Save Competitors",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const refreshCompetitorsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/user/competitors/refresh', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/competitors/eligibility"] });
      toast({
        title: "Success",
        description: "Competitor data refreshed successfully",
      });
    },
    onError: (error) => {
      let errorMessage = "Unable to refresh competitor data right now. Please try again later.";
      
      // Handle specific error types with user-friendly messages  
      if (error.message?.includes("24 hours")) {
        const match = error.message.match(/wait (\d+) more hours/);
        const hours = match ? match[1] : "24";
        errorMessage = `You can refresh competitors again in ${hours} hours. Please wait and try again later.`;
      }
      
      toast({
        title: "Cannot Refresh Competitors", 
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const addCompetitor = () => {
    if (!newCompetitor.trim()) {
      toast({
        title: "Error",
        description: "Please enter a competitor username",
        variant: "destructive",
      });
      return;
    }

    // Only apply eligibility restriction if user already has saved competitors
    if (!eligibility?.canChange && savedCompetitors.length > 0) {
      const hours = eligibility?.hoursRemaining || 24;
      toast({
        title: "Cannot Change Competitors",
        description: `You can change competitors again in ${hours} hours. Please wait and try again later.`,
        variant: "destructive",
      });
      return;
    }

    if (allCompetitors.length >= 3) {
      toast({
        title: "Limit Reached",
        description: "You can only add up to 3 competitors for optimal content analysis",
        variant: "destructive",
      });
      return;
    }

    const username = newCompetitor.trim().replace(/^@+/, '');
    
    if (allCompetitors.includes(username)) {
      toast({
        title: "Already Added",
        description: "This competitor is already in your list",
        variant: "destructive",
      });
      return;
    }

    setPendingCompetitors([...pendingCompetitors, username]);
    setNewCompetitor("");
  };

  const saveCompetitors = () => {
    if (hasChanges) {
      updateCompetitorsMutation.mutate(allCompetitors);
      // Cache warming is now handled automatically by the backend
    }
  };

  const refreshCompetitors = () => {
    if (!eligibility?.canChange) {
      const hours = eligibility?.hoursRemaining || 24;
      toast({
        title: "Cannot Refresh Competitors",
        description: `You can refresh competitors again in ${hours} hours. Please wait and try again later.`,
        variant: "destructive",
      });
      return;
    }
    
    if (savedCompetitors.length === 0) {
      toast({
        title: "No Competitors Added",
        description: "Please add and save competitors first before refreshing",
        variant: "destructive",
      });
      return;
    }
    refreshCompetitorsMutation.mutate();
  };

  const removeCompetitor = (username: string) => {
    // Check if it's a pending competitor or saved competitor
    if (pendingCompetitors.includes(username)) {
      // Pending competitors can always be removed
      setPendingCompetitors(pendingCompetitors.filter(comp => comp !== username));
    } else {
      // For saved competitors, check eligibility restriction
      if (!eligibility?.canChange) {
        const hours = eligibility?.hoursRemaining || 24;
        toast({
          title: "Cannot Change Competitors",
          description: `You can change competitors again in ${hours} hours. Please wait and try again later.`,
          variant: "destructive",
        });
        return;
      }
      
      // For saved competitors, we need to update immediately
      const updatedCompetitors = savedCompetitors.filter(comp => comp !== username);
      updateCompetitorsMutation.mutate(updatedCompetitors);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addCompetitor();
    }
  };

  return (
    <TooltipProvider>
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Competitors
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  <strong>Add max 3 competitors with public profiles only.</strong> 
                  Add all competitors first, then click "Refresh Competitors" to analyze their posts.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4">
        {!eligibility?.canChange && savedCompetitors.length > 0 && (
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>24-hour restriction:</strong> You can only change competitors once per 24 hours. 
            Please wait {eligibility?.hoursRemaining} more hours.
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            placeholder="@username"
            value={newCompetitor}
            onChange={(e) => setNewCompetitor(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={updateCompetitorsMutation.isPending || (!eligibility?.canChange && savedCompetitors.length > 0)}
            className="flex-1"
          />
          <Button
            onClick={addCompetitor}
            disabled={updateCompetitorsMutation.isPending || allCompetitors.length >= 3 || (!eligibility?.canChange && savedCompetitors.length > 0)}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {hasChanges && (
          <div className="flex gap-2">
            <Button
              onClick={saveCompetitors}
              disabled={updateCompetitorsMutation.isPending}
              className="flex-1"
              variant="outline"
            >
              {updateCompetitorsMutation.isPending ? "Saving..." : "Save & Refresh"}
            </Button>
          </div>
        )}

        {savedCompetitors.length > 0 && !hasChanges && (
          <div className="flex gap-2">
            <Button
              onClick={refreshCompetitors}
              disabled={refreshCompetitorsMutation.isPending || !eligibility?.canChange}
              className="flex-1"
              variant="outline"
            >
              {refreshCompetitorsMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Competitors
                </>
              )}
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {allCompetitors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No competitors added yet
            </p>
          ) : (
            <>
              {savedCompetitors.map((competitor) => (
                <div
                  key={competitor}
                  className="flex items-center justify-between p-2 rounded-lg border bg-green-50 dark:bg-green-900/20"
                >
                  <Badge variant="secondary" className="font-normal bg-green-100 dark:bg-green-800">
                    @{competitor}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCompetitor(competitor)}
                    disabled={updateCompetitorsMutation.isPending || !eligibility?.canChange}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {pendingCompetitors.map((competitor) => (
                <div
                  key={competitor}
                  className="flex items-center justify-between p-2 rounded-lg border bg-amber-50 dark:bg-amber-900/20"
                >
                  <Badge variant="outline" className="font-normal bg-amber-100 dark:bg-amber-800">
                    @{competitor} (pending)
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCompetitor(competitor)}
                    disabled={updateCompetitorsMutation.isPending || !eligibility?.canChange}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </>
          )}
        </div>

        {allCompetitors.length > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            {allCompetitors.length}/3 competitors added
            {hasChanges && (
              <span className="text-amber-600 dark:text-amber-400 ml-2">
                • {pendingCompetitors.length} pending save
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}