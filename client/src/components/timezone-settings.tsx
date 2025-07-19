import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Clock, Globe } from "lucide-react";

const COMMON_TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST/AEDT)" },
];

export default function TimezoneSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const [selectedTimezone, setSelectedTimezone] = useState(user?.timezone || 'UTC');

  const updateTimezoneMutation = useMutation({
    mutationFn: async (timezone: string) => {
      return apiRequest('PUT', '/api/user/timezone', { timezone });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Timezone updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update timezone. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (selectedTimezone !== user?.timezone) {
      updateTimezoneMutation.mutate(selectedTimezone);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleString("en-US", {
      timeZone: selectedTimezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const hasChanges = selectedTimezone !== user?.timezone;

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Timezone Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timezone">Your Timezone</Label>
          <Select
            value={selectedTimezone}
            onValueChange={setSelectedTimezone}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your timezone" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>Current time: {getCurrentTime()}</span>
        </div>

        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={updateTimezoneMutation.isPending}
            className="w-full"
            variant="outline"
          >
            {updateTimezoneMutation.isPending ? "Saving..." : "Save Timezone"}
          </Button>
        )}

        <div className="text-xs text-muted-foreground">
          <p>
            Your timezone is automatically detected when you sign up. 
            All scheduled posts and notifications will be shown in your local time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}