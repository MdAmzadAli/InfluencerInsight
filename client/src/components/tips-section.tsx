import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Lightbulb, 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Target,
  Coins,
  AlertCircle
} from "lucide-react";

export default function TipsSection() {
  return (
    <div className="space-y-6">
      {/* Daily Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-blue-600" />
            Daily Usage System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Usage Resets</span>
                <Badge variant="secondary">Daily at midnight</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Track Usage</span>
                <Badge variant="secondary">Real-time updates</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <strong>Approximate Usage Per Generation:</strong>
              </div>
              <div className="text-xs space-y-1">
                <div>• Date-specific content: ~5% of daily limit</div>
                <div>• Competitor analysis: ~8% of daily limit</div>
                <div>• Trending posts: ~8% of daily limit</div>
                <div>• AI refinement: ~3% per message</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Generation Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            Content Generation Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">Date-Specific Content (Most Efficient)</h4>
                <p className="text-xs text-muted-foreground">
                  Uses approximately 5% of your daily limit. Perfect for holidays, festivals, and trending dates.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">Competitor Analysis</h4>
                <p className="text-xs text-muted-foreground">
                  Analyzes your competitors' top posts. Add all 3 competitors for maximum variety.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <TrendingUp className="h-4 w-4 text-purple-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">Trending Posts</h4>
                <p className="text-xs text-muted-foreground">
                  Analyzes current trending content in your niche for viral potential.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Usage Restrictions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Niche changes: Once every 6 hours</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Competitor changes: Once every 24 hours</span>
            </div>
            
            <Separator />
            
            <div className="text-xs text-muted-foreground">
              <strong>Why these restrictions?</strong> They ensure optimal AI performance by allowing 
              proper cache warming and preventing excessive API calls.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Maximizing Your Output
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="text-sm">
              <strong>Smart Usage Strategy:</strong>
            </div>
            
            <div className="space-y-2 text-xs">
              <div>• Start with date-specific content (~5% usage) for quick ideas</div>
              <div>• Use competitor analysis when you need targeted inspiration</div>
              <div>• Save trending analysis for when you want viral potential</div>
              <div>• Use AI refinement sparingly - save usage for generation</div>
            </div>
            
            <Separator />
            
            <div className="text-sm">
              <strong>Best Practices:</strong>
            </div>
            
            <div className="space-y-2 text-xs">
              <div>• Add all 3 competitors for maximum content variety</div>
              <div>• Generate multiple ideas at once for efficient usage</div>
              <div>• Save your best ideas for future reference</div>
              <div>• Use the scheduling feature to plan content in advance</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}