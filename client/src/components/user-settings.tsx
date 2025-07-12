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
  const [isEditing, setIsEditing] = useState(false);
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
      setIsEditing(false);
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

  const startEditing = () => {
    setNiche(user?.niche || "");
    setIsEditing(true);
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={user?.firstName || ""}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="niche">Your Niche</Label>
            <div className="flex space-x-2 mt-2">
              {isEditing ? (
                <>
                  <Input
                    id="niche"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="Enter your niche (e.g., fitness, cooking, fashion)"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveNiche}
                    disabled={updateNicheMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1 px-3 py-2 bg-gray-50 rounded-md border">
                    {user?.niche || "Not set"}
                  </div>
                  <Button onClick={startEditing} variant="outline">
                    Edit
                  </Button>
                </>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Your niche helps us generate more relevant content for your audience.
            </p>
          </div>

          <Separator />

          <div>
            <Label>Competitors</Label>
            <div className="mt-2 p-3 bg-gray-50 rounded-md border">
              {user?.competitors ? (
                <div className="flex flex-wrap gap-2">
                  {user.competitors.split(',').filter(Boolean).map((competitor, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      @{competitor}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-600">No competitors added</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Manage your competitors in the "Manage Competitors" section.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}