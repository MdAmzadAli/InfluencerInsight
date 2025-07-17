import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Instagram, User, LogOut, Settings, Sparkles, Menu, Home, Calendar, Users } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FeedbackForm } from '@/components/feedback-form';
import TokenTracker from './token-tracker';
import { useState } from 'react';

interface NavbarProps {
  competitors?: string[];
  posts?: any[];
  loadingPosts?: boolean;
}

export function Navbar({ competitors = [], posts = [], loadingPosts = false }: NavbarProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const dashboardOptions = [
    { name: 'Generate Ideas', href: '/generate' },
    { name: 'Saved Ideas', href: '/saved' },
    { name: 'Create Post', href: '/create' },
    { name: 'Manage Competitors', href: '/manage-competitors' },
  ];

  const isActive = (href: string) => location === href;

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 fixed top-0 left-0 right-0 z-50 w-screen">
      <div className="w-full md:max-w-7xl md:mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Instagram className="h-6 w-6 text-pink-600" />
                      <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Content AI
                    </span>
                  </div>
                </div>
                
                <nav className="flex-1 px-6 py-4 space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isDashboard = item.href === '/';
                    
                    if (isDashboard) {
                      return (
                        <div key={item.name} className="space-y-1">
                          <Link href={item.href}>
                            <Button
                              variant={isActive(item.href) ? "default" : "ghost"}
                              className="w-full justify-start"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Icon className="h-4 w-4 mr-3" />
                              {item.name}
                            </Button>
                          </Link>
                          <div className="ml-4 pl-4 border-l border-gray-200 dark:border-gray-600 space-y-1">
                            {dashboardOptions.map((option) => (
                              <Link key={option.name} href={option.href}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-sm"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  {option.name}
                                </Button>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <Link key={item.name} href={item.href}>
                        <Button
                          variant={isActive(item.href) ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="h-4 w-4 mr-3" />
                          {item.name}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>
                
                {/* Mobile Quick Stats */}
                <div className="p-6 border-t">
                  <div className="space-y-4">
                    {/* Token Tracker for Mobile */}
                    <div className="mb-4">
                      <TokenTracker />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Competitors</span>
                      <span className="text-sm font-medium">{competitors.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Recent Posts</span>
                      <span className="text-sm font-medium">{posts.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative">
              <Instagram className="h-8 w-8 text-pink-600" />
              <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Instagram Content AI
            </span>
            <span className="sm:hidden text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Content AI
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {/* Token Tracker - Desktop Only */}
          <div className="hidden lg:block">
            <TokenTracker />
          </div>
          
          <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <span>Welcome back,</span>
            <span className="font-medium">{user?.firstName || user?.email}</span>
          </div>
          
          <FeedbackForm />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="#" alt={user?.firstName || 'User'} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user?.firstName && (
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                  )}
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuItem className="cursor-pointer" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}