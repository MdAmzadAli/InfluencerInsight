import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    setLocation('/login');
  };

  const handleSignup = () => {
    setLocation('/signup');
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 instagram-gradient rounded-lg flex items-center justify-center">
                <i className="fas fa-magic text-white text-sm"></i>
              </div>
              <h1 className="text-xl md:text-2xl font-bold instagram-gradient-text">InstaGenIdeas</h1>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900 font-medium">Features</button>
              <button className="text-gray-600 hover:text-gray-900 font-medium">Pricing</button>
              <Button onClick={handleLogin} variant="ghost" className="text-gray-600 hover:text-gray-900">
                Login
              </Button>
              <Button onClick={handleSignup} className="bg-gray-900 text-white hover:bg-gray-800">
                Sign Up
              </Button>
            </div>
            {/* Mobile menu */}
            <div className="md:hidden flex items-center space-x-2">
              <Button onClick={handleLogin} variant="ghost" size="sm" className="text-gray-600">
                Login
              </Button>
              <Button onClick={handleSignup} size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-900/20" 
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Generate Viral Instagram Content
              <span className="instagram-gradient-text block">In Seconds</span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
              AI-powered content ideas, captions, and hashtags optimized for Instagram's algorithm. 
              From trending posts to competitor analysis - we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleSignup} 
                className="instagram-gradient text-white px-8 py-4 text-lg font-semibold hover:opacity-90"
              >
                Start Creating Free
              </Button>
              <Button 
                onClick={handleLogin}
                variant="secondary" 
                className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 text-lg font-semibold hover:bg-white/20 border border-white/20"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need to Grow</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">From content generation to scheduling, we provide all the tools to boost your Instagram presence.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center group p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-16 h-16 instagram-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-lightbulb text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Content Generation</h3>
              <p className="text-gray-600 mb-3">Generate viral content ideas, captions, and hashtags using advanced AI powered by Google Gemini.</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Date-specific content ideas</li>
                <li>• Competitor analysis content</li>
                <li>• Trending topic suggestions</li>
              </ul>
            </div>
            
            <div className="text-center group p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-16 h-16 instagram-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-users text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Competitor Analysis</h3>
              <p className="text-gray-600 mb-3">Analyze up to 3 competitors' content to generate better performing posts and stay ahead of trends.</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Real Instagram data scraping</li>
                <li>• Content performance insights</li>
                <li>• Competitor strategy analysis</li>
              </ul>
            </div>
            
            <div className="text-center group p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-16 h-16 instagram-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-calendar-alt text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Content Scheduling</h3>
              <p className="text-gray-600 mb-3">Schedule posts with custom dates, times, and repeat options. Get automated notifications.</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Custom scheduling options</li>
                <li>• Repeat scheduling patterns</li>
                <li>• Email notifications</li>
              </ul>
            </div>
            
            <div className="text-center group p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-16 h-16 instagram-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-edit text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Content Refinement</h3>
              <p className="text-gray-600 mb-3">Real-time AI chat expert to refine and optimize your content for maximum engagement.</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Real-time streaming chat</li>
                <li>• Content optimization tips</li>
                <li>• Growth strategy advice</li>
              </ul>
            </div>
            
            <div className="text-center group p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-16 h-16 instagram-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-save text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Content Management</h3>
              <p className="text-gray-600 mb-3">Save favorite ideas, create custom posts, and manage your content library efficiently.</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Save/unsave content ideas</li>
                <li>• Custom post creation</li>
                <li>• Content editing tools</li>
              </ul>
            </div>
            
            <div className="text-center group p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-16 h-16 instagram-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-mobile-alt text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Mobile Optimized</h3>
              <p className="text-gray-600 mb-3">Fully responsive design optimized for mobile-first experience with touch-friendly interface.</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Mobile-first design</li>
                <li>• Touch-optimized interface</li>
                <li>• Cross-device sync</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How InstaGenIdeas Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Get viral content ideas in 3 simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center relative">
              <div className="w-20 h-20 instagram-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Setup Your Profile</h3>
              <p className="text-gray-600 text-lg">Tell us about your Instagram niche and add up to 3 competitor accounts with public profiles.</p>
              <div className="hidden md:block absolute top-10 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"></div>
            </div>
            
            <div className="text-center relative">
              <div className="w-20 h-20 instagram-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Generate Content</h3>
              <p className="text-gray-600 text-lg">Choose from date-specific ideas, competitor analysis, or trending content. AI analyzes real Instagram data.</p>
              <div className="hidden md:block absolute top-10 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"></div>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 instagram-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Post & Grow</h3>
              <p className="text-gray-600 text-lg">Use generated captions, hashtags, and content ideas. Schedule posts and get notifications when it's time to post.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold instagram-gradient-text mb-2">66K+</div>
              <div className="text-gray-600">Daily Tokens</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold instagram-gradient-text mb-2">3</div>
              <div className="text-gray-600">Competitor Analysis</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold instagram-gradient-text mb-2">AI</div>
              <div className="text-gray-600">Powered by Gemini</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold instagram-gradient-text mb-2">24/7</div>
              <div className="text-gray-600">Content Generation</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Create Viral Content?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join creators who are already using InstaGenIdeas to grow their Instagram presence with AI-powered content generation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleSignup} 
              className="instagram-gradient text-white px-10 py-4 text-lg font-semibold hover:opacity-90"
            >
              Get Started Free
            </Button>
            <Button 
              onClick={handleLogin}
              variant="outline" 
              className="border-gray-600 text-gray-300 px-10 py-4 text-lg font-semibold hover:bg-gray-800 hover:text-white"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 instagram-gradient rounded-lg flex items-center justify-center">
                <i className="fas fa-magic text-white text-sm"></i>
              </div>
              <h3 className="text-xl font-bold instagram-gradient-text">InstaGenIdeas</h3>
            </div>
            <div className="text-gray-400 text-center md:text-right">
              <p>&copy; 2025 InstaGenIdeas. All rights reserved.</p>
              <p className="text-sm mt-1">AI-powered Instagram content generation platform</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
