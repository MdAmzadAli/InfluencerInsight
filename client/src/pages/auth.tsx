import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Instagram, Sparkles, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { OTPSignup } from '@/components/otp-signup';

export default function Auth() {
  const { login, register, loginError, registerError, isLoggingIn, isRegistering } = useAuth();
  const [location, setLocation] = useLocation();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    email: '', 
    password: '', 
    firstName: '', 
    lastName: ''
  });
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'code' | 'reset'>('email');
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    code: '',
    newPassword: ''
  });
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState<string | null>(null);

  const isSignupPage = location === '/signup';
  const defaultTab = isSignupPage ? 'register' : 'login';

  const handleBackToHome = () => {
    setLocation('/');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-detect user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    register({
      ...registerData,
      timezone: userTimezone
    });
  };

  // Forgot password handlers
  const handleForgotPasswordEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordError(null);
    setForgotPasswordSuccess(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordData.email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setForgotPasswordSuccess(data.message);
      setForgotPasswordStep('code');
    } catch (error: any) {
      setForgotPasswordError(error.message);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordError(null);
    setForgotPasswordSuccess(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotPasswordData.email,
          code: forgotPasswordData.code,
          newPassword: forgotPasswordData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setForgotPasswordSuccess('Password reset successfully! You can now login with your new password.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordStep('email');
        setForgotPasswordData({ email: '', code: '', newPassword: '' });
        setForgotPasswordError(null);
        setForgotPasswordSuccess(null);
      }, 2000);
    } catch (error: any) {
      setForgotPasswordError(error.message);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Button
              onClick={handleBackToHome}
              variant="ghost"
              size="sm"
              className="absolute left-4 top-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="relative">
              <Instagram className="h-12 w-12 text-pink-600" />
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
            </div>
          </div>
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            InstaGenIdeas
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Generate viral Instagram content with AI-powered insights
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to your account to continue generating content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  {loginError && (
                    <Alert variant="destructive">
                      <AlertDescription>{loginError.message}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoggingIn}>
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <Button 
                      type="button" 
                      variant="link" 
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot your password?
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <OTPSignup />
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reset Password</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordStep('email');
                    setForgotPasswordData({ email: '', code: '', newPassword: '' });
                    setForgotPasswordError(null);
                    setForgotPasswordSuccess(null);
                  }}
                >
                  ✕
                </Button>
              </div>
              <CardDescription>
                {forgotPasswordStep === 'email' && "Enter your email to receive a reset code"}
                {forgotPasswordStep === 'code' && "Enter the verification code sent to your email"}
                {forgotPasswordStep === 'reset' && "Enter your new password"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Email */}
              {forgotPasswordStep === 'email' && (
                <form onSubmit={handleForgotPasswordEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email Address</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="your@email.com"
                      value={forgotPasswordData.email}
                      onChange={(e) => setForgotPasswordData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  {forgotPasswordError && (
                    <Alert variant="destructive">
                      <AlertDescription>{forgotPasswordError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {forgotPasswordSuccess && (
                    <Alert>
                      <AlertDescription>{forgotPasswordSuccess}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={forgotPasswordLoading}>
                    {forgotPasswordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Code'
                    )}
                  </Button>
                </form>
              )}

              {/* Step 2: Code Verification */}
              {forgotPasswordStep === 'code' && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setForgotPasswordSuccess(null); // Clear the success message when moving to next step
                  setForgotPasswordStep('reset');
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-code">Verification Code</Label>
                    <Input
                      id="reset-code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={forgotPasswordData.code}
                      onChange={(e) => setForgotPasswordData(prev => ({ ...prev, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      className="text-center text-lg tracking-widest"
                      maxLength={6}
                      required
                    />
                  </div>
                  
                  {forgotPasswordError && (
                    <Alert variant="destructive">
                      <AlertDescription>{forgotPasswordError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {forgotPasswordSuccess && (
                    <Alert>
                      <AlertDescription>{forgotPasswordSuccess}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={forgotPasswordData.code.length !== 6}>
                    Continue
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="link" 
                    className="w-full text-sm"
                    onClick={() => setForgotPasswordStep('email')}
                  >
                    Send New Code
                  </Button>
                </form>
              )}

              {/* Step 3: New Password */}
              {forgotPasswordStep === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter your new password"
                      value={forgotPasswordData.newPassword}
                      onChange={(e) => setForgotPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                    />
                  </div>
                  
                  {forgotPasswordError && (
                    <Alert variant="destructive">
                      <AlertDescription>{forgotPasswordError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {forgotPasswordSuccess && (
                    <Alert>
                      <AlertDescription>{forgotPasswordSuccess}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={forgotPasswordLoading}>
                    {forgotPasswordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}