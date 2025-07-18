import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send } from "lucide-react";

export function EmailTest() {
  const [email, setEmail] = useState('');
  const [emailType, setEmailType] = useState('test');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendTestEmail = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to test",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type: emailType }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Email Sent!",
          description: `Test email sent successfully to ${email}`,
        });
      } else {
        toast({
          title: "Email Failed",
          description: data.message || "Failed to send test email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Test
        </CardTitle>
        <CardDescription>
          Test email functionality with Brevo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="emailType" className="text-sm font-medium">
            Email Type
          </label>
          <Select value={emailType} onValueChange={setEmailType}>
            <SelectTrigger>
              <SelectValue placeholder="Select email type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="test">Test Email</SelectItem>
              <SelectItem value="welcome">Welcome Email</SelectItem>
              <SelectItem value="reminder">Post Reminder</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={sendTestEmail} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Test Email
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}