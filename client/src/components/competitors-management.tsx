import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function CompetitorsManagement() {
  const [newCompetitor, setNewCompetitor] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const competitors = user?.competitors ? user.competitors.split(',').filter(Boolean) : [];

  const updateCompetitorsMutation = useMutation({
    mutationFn: async (competitors: string[]) => {
      return apiRequest('PUT', '/api/user/competitors', { competitors: competitors.join(',') });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Competitors updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update competitors",
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

    if (competitors.length >= 5) {
      toast({
        title: "Limit Reached",
        description: "You can only add up to 5 competitors",
        variant: "destructive",
      });
      return;
    }

    const username = newCompetitor.trim().replace('@', '');
    
    if (competitors.includes(username)) {
      toast({
        title: "Already Added",
        description: "This competitor is already in your list",
        variant: "destructive",
      });
      return;
    }

    const updatedCompetitors = [...competitors, username];
    updateCompetitorsMutation.mutate(updatedCompetitors);
    setNewCompetitor("");
  };

  const removeCompetitor = (username: string) => {
    const updatedCompetitors = competitors.filter(comp => comp !== username);
    updateCompetitorsMutation.mutate(updatedCompetitors);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addCompetitor();
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Competitors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="@username"
            value={newCompetitor}
            onChange={(e) => setNewCompetitor(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={updateCompetitorsMutation.isPending}
            className="flex-1"
          />
          <Button
            onClick={addCompetitor}
            disabled={updateCompetitorsMutation.isPending || competitors.length >= 5}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {competitors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No competitors added yet
            </p>
          ) : (
            competitors.map((competitor) => (
              <div
                key={competitor}
                className="flex items-center justify-between p-2 rounded-lg border bg-muted/50"
              >
                <Badge variant="secondary" className="font-normal">
                  @{competitor}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCompetitor(competitor)}
                  disabled={updateCompetitorsMutation.isPending}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>

        {competitors.length > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            {competitors.length}/5 competitors added
          </div>
        )}
      </CardContent>
    </Card>
  );
}