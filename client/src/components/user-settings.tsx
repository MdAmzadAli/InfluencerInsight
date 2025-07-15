import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Edit3, Save, X } from "lucide-react";

export default function UserSettings() {
  const [niche, setNiche] = useState("");
  const [isEditingNiche, setIsEditingNiche] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Initialize niche value when user data loads
  useEffect(() => {
    if (user?.niche) {
      setNiche(user.niche);
    }
  }, [user]);

  const updateNicheMutation = useMutation({
    mutationFn: async (data: { niche: string }) => {
      const response = await apiRequest("/api/user/niche", {
        method: "PATCH",
        body: JSON.stringify(data)
      });
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

  const handleCancelEdit = () => {
    setNiche(user?.niche || "");
    setIsEditingNiche(false);
  };

  const startEditingNiche = () => {
    setIsEditingNiche(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Target className="h-8 w-8 text-purple-600" />
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Your Niche
          </h2>
          <p className="text-gray-600">Define your content focus area for personalized AI-generated ideas</p>
        </div>
      </div>

      <Card className="border-2 border-purple-100">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <Target className="h-5 w-5" />
            <span>Content Niche</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {isEditingNiche ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="niche" className="text-base font-medium text-gray-700">
                  Your Content Niche
                </Label>
                <Input
                  id="niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g., travel photography, fitness coaching, cooking recipes, tech reviews"
                  className="mt-2 text-base"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-1">
                  This helps our AI generate content ideas specifically tailored to your audience and expertise.
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleSaveNiche}
                  disabled={updateNicheMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateNicheMutation.isPending ? "Saving..." : "Save Niche"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={updateNicheMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium text-gray-700">Current Niche</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                  {user?.niche ? (
                    <p className="text-lg font-medium text-gray-900">{user.niche}</p>
                  ) : (
                    <p className="text-gray-500 italic">No niche set yet. Click edit to define your content focus.</p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={startEditingNiche}
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {user?.niche ? "Edit Niche" : "Set Your Niche"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="text-center text-sm text-gray-500">
        <p>Your niche helps our AI generate more targeted and relevant content ideas for your audience.</p>
      </div>
    </div>
  );
}