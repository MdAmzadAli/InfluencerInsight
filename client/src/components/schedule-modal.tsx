import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RatingPopup, useRatingPopup } from "@/components/rating-popup";
import type { ContentIdea } from "@shared/schema";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea?: ContentIdea;
  customPost?: {
    headline: string;
    caption: string;
    hashtags: string;
    ideas: string;
  };
}

export default function ScheduleModal({ isOpen, onClose, idea, customPost }: ScheduleModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isOpen: ratingOpen, setIsOpen: setRatingOpen, showRating, context, title, description } = useRatingPopup();

  const schedulePostMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      const response = await apiRequest("/api/posts/schedule", {
        method: "POST",
        body: JSON.stringify(scheduleData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/scheduled"] });
      toast({
        title: "Success",
        description: "Post scheduled successfully!",
      });
      onClose();
      
      // Show rating popup after successful scheduling
      setTimeout(() => {
        showRating(
          'post_scheduled',
          'How was your scheduling experience?',
          'We would love to hear your feedback on scheduling posts!'
        );
      }, 500);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to schedule post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSchedule = () => {
    if (!date || !time) {
      toast({
        title: "Error",
        description: "Please select both date and time.",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time
    const scheduledDate = new Date(`${date}T${time}`);
    
    if (scheduledDate <= new Date()) {
      toast({
        title: "Error",
        description: "Please select a future date and time.",
        variant: "destructive",
      });
      return;
    }

    const postData = {
      headline: idea?.headline || customPost?.headline || "",
      caption: idea?.caption || customPost?.caption || "",
      hashtags: idea?.hashtags || customPost?.hashtags || "",
      ideas: idea?.ideas || customPost?.ideas || "",
      scheduledDate: scheduledDate.toISOString(),
      isCustom: !idea,
      contentIdeaId: idea?.id || null,
      status: "scheduled"
    };

    schedulePostMutation.mutate(postData);
  };

  // Set default date and time to tomorrow at 9 AM
  useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
    setTime("09:00");
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="schedule-date">Date</Label>
            <Input
              id="schedule-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="schedule-time">Time</Label>
            <Input
              id="schedule-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-2"
            />
          </div>
          


          {/* Post preview */}
          <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
            <div className="text-sm">
              <div className="font-medium text-gray-900 mb-2">
                {idea?.headline || customPost?.headline}
              </div>
              <div className="text-gray-600 text-xs line-clamp-3">
                {idea?.caption || customPost?.caption}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-4 mt-6">
          <Button 
            onClick={handleSchedule}
            disabled={schedulePostMutation.isPending}
            className="flex-1 instagram-gradient text-white hover:opacity-90"
          >
            {schedulePostMutation.isPending ? "Scheduling..." : "Schedule Post"}
          </Button>
          <Button 
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
      
      <RatingPopup
        open={ratingOpen}
        onOpenChange={setRatingOpen}
        context={context}
        title={title}
        description={description}
      />
    </Dialog>
  );
}
