import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Star, MessageSquare, Shield, Mail, Calendar, User, TrendingUp } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Feedback, Rating } from '@/shared/schema';

const otpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  otp: z.string().optional(),
});

type OTPFormData = z.infer<typeof otpSchema>;

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const form = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email: '',
      otp: '',
    },
  });

  // Check if user is already authenticated
  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const sendOTP = useMutation({
    mutationFn: async (email: string) => {
      console.log('Sending OTP for:', email);
      return apiRequest('POST', '/api/admin/send-otp', { email });
    },
    onSuccess: (data) => {
      console.log('OTP sent successfully:', data);
      toast({
        title: "OTP sent!",
        description: "Check the server console for the verification code.",
      });
      setShowOTPForm(true);
      setEmail(form.getValues('email'));
    },
    onError: (error: any) => {
      console.error('OTP send error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyOTP = useMutation({
    mutationFn: async (data: OTPFormData) => {
      return apiRequest('POST', '/api/admin/verify-otp', data);
    },
    onSuccess: () => {
      toast({
        title: "Access granted!",
        description: "Welcome to the admin portal.",
      });
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
    },
    onError: (error: any) => {
      toast({
        title: "Invalid OTP",
        description: "Please check your code and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OTPFormData) => {
    console.log('🚀 Form submitted with data:', data);
    console.log('🚀 showOTPForm:', showOTPForm);
    console.log('🚀 Form errors:', form.formState.errors);
    if (!showOTPForm) {
      console.log('🚀 Sending OTP...');
      sendOTP.mutate(data.email);
    } else {
      console.log('🚀 Verifying OTP...');
      verifyOTP.mutate(data);
    }
  };

  const { data: feedbackData, isLoading: feedbackLoading } = useQuery({
    queryKey: ['/api/admin/feedback'],
    enabled: isAuthenticated,
  });

  const { data: ratingsData, isLoading: ratingsLoading } = useQuery({
    queryKey: ['/api/admin/ratings'],
    enabled: isAuthenticated,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/admin/analytics'],
    enabled: isAuthenticated,
  });

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
    toast({
      title: "Logged out",
      description: "You have been logged out of the admin portal.",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Admin Portal Access</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin@example.com"
                          {...field}
                          disabled={showOTPForm}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showOTPForm && (
                  <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OTP Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 6-digit code"
                            {...field}
                            maxLength={6}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={sendOTP.isPending || verifyOTP.isPending}
                  onClick={() => console.log('🔥 Button clicked!')}
                >
                  {sendOTP.isPending || verifyOTP.isPending ? (
                    "Processing..."
                  ) : showOTPForm ? (
                    "Verify OTP"
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Portal</h1>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Feedback</p>
                  <p className="text-2xl font-bold">
                    {feedbackData?.length || 0}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Ratings</p>
                  <p className="text-2xl font-bold">
                    {ratingsData?.length || 0}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <p className="text-2xl font-bold">
                    {ratingsData?.length > 0 
                      ? (ratingsData.reduce((acc: number, rating: Rating) => acc + rating.rating, 0) / ratingsData.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="feedback" className="space-y-4">
          <TabsList>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
          </TabsList>

          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>User Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {feedbackLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbackData?.map((feedback: Feedback) => (
                        <TableRow key={feedback.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {feedback.userId || 'Anonymous'}
                            </div>
                          </TableCell>
                          <TableCell>{feedback.email || 'Not provided'}</TableCell>
                          <TableCell>
                            {feedback.category && (
                              <Badge variant={
                                feedback.category === 'bug' ? 'destructive' :
                                feedback.category === 'feature' ? 'secondary' :
                                'default'
                              }>
                                {feedback.category}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {feedback.message}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ratings">
            <Card>
              <CardHeader>
                <CardTitle>User Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                {ratingsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Context</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ratingsData?.map((rating: Rating) => (
                        <TableRow key={rating.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {rating.userId}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= rating.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-sm text-muted-foreground">
                                ({rating.rating}/5)
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {rating.context || 'general'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {rating.comment || 'No comment'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(rating.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}