import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Settings, Save } from "lucide-react";

export default function UserSettings() {
  const [niche, setNiche] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [isEditingNiche, setIsEditingNiche] = useState(false);
  const [isEditingCompetitors, setIsEditingCompetitors] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const updateNicheMutation = useMutation({
    mutationFn: async (data: { niche: string }) => {
      const response = await apiRequest("PATCH", "/api/user/niche", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditingNiche(false);
      toast({
        title: "Success",
        description: "Your niche has been updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update niche. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateCompetitorsMutation = useMutation({
    mutationFn: async (data: { niche: string; competitors: string }) => {
      const response = await apiRequest("PUT", "/api/user/competitors", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditingCompetitors(false);
      toast({
        title: "Success",
        description: "Your competitors have been updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update competitors. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveNiche = () => {
    if (!niche.trim()) {
      toast({
        title: "Error",
        description: "Please enter a niche",
        variant: "destructive",
      });
      return;
    }
    updateNicheMutation.mutate({ niche: niche.trim() });
  };

  const handleSaveCompetitors = () => {
    if (!competitors.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one competitor",
        variant: "destructive",
      });
      return;
    }
    updateCompetitorsMutation.mutate({ 
      niche: user?.niche || "", 
      competitors: competitors.trim() 
    });
  };

  const startEditingNiche = () => {
    setNiche(user?.niche || "");
    setIsEditingNiche(true);
  };

  const startEditingCompetitors = () => {
    // Parse competitors from JSON string
    try {
      const competitorsArray = user?.competitors ? JSON.parse(user.competitors) : [];
      setCompetitors(competitorsArray.join(", "));
    } catch (e) {
      setCompetitors("");
    }
    setIsEditingCompetitors(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Niche</p>
              {isEditingNiche ? (
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="Enter your niche (e.g., fitness, cooking, tech)"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveNiche}
                    disabled={updateNicheMutation.isPending}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingNiche(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <p className="font-medium">{user?.niche || "Not set"}</p>
                  <Button
                    variant="outline"
                    onClick={startEditingNiche}
                    size="sm"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Competitors</p>
              <p className="text-xs text-gray-500 mb-2">Instagram usernames separated by commas</p>
              {isEditingCompetitors ? (
                <div className="space-y-2">
                  <Input
                    value={competitors}
                    onChange={(e) => setCompetitors(e.target.value)}
                    placeholder="Enter competitors (e.g., @user1, @user2, @user3)"
                    className="flex-1"
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveCompetitors}
                      disabled={updateCompetitorsMutation.isPending}
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingCompetitors(false)}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <div className="flex-1">
                    {user?.competitors ? (
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(user.competitors).map((competitor: string, index: number) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            @{competitor}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="font-medium text-gray-500">No competitors set</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={startEditingCompetitors}
                    size="sm"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}