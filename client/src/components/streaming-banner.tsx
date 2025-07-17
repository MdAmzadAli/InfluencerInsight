import { useState, useEffect } from "react";
import { useContentState } from "@/hooks/useContentState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StopCircle, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function StreamingBanner() {
  const { state, endStreamingSession } = useContentState();
  const { toast } = useToast();
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (state.streamingSession.isActive && state.streamingSession.startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.streamingSession.startTime!) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.streamingSession.isActive, state.streamingSession.startTime]);

  const stopGeneration = () => {
    endStreamingSession();
    toast({
      title: "Generation Stopped",
      description: "Background content generation has been stopped",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!state.streamingSession.isActive) {
    return null;
  }

  return (
    <Card className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-50 border-blue-200 shadow-lg max-w-md w-full mx-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
              <span className="text-sm font-medium text-blue-900">
                Generating Content
              </span>
            </div>
            <Badge variant="outline" className="text-blue-700 bg-blue-100">
              {state.streamingSession.generationType}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600">
              {formatTime(elapsedTime)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={stopGeneration}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-7 px-2"
            >
              <StopCircle className="h-3 w-3 mr-1" />
              Stop
            </Button>
          </div>
        </div>
        <p className="text-xs text-blue-700 mt-2 truncate">
          {state.streamingSession.currentProgress}
        </p>
      </CardContent>
    </Card>
  );
}