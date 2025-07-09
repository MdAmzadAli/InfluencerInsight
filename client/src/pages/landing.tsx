import { Button } from "@/components/ui/button";
import { login } from "@/lib/firebase";

export default function Landing() {
  const handleLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 instagram-gradient rounded-lg flex items-center justify-center">
                <i className="fas fa-magic text-white text-sm"></i>
              </div>
              <h1 className="text-2xl font-bold instagram-gradient-text">ContentCraft</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900 font-medium">Features</button>
              <button className="text-gray-600 hover:text-gray-900 font-medium">Pricing</button>
              <button className="text-gray-600 hover:text-gray-900 font-medium">About</button>
              <Button onClick={handleLogin} className="bg-gray-900 text-white hover:bg-gray-800">
                Login
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
                onClick={handleLogin} 
                className="instagram-gradient text-white px-8 py-4 text-lg font-semibold hover:opacity-90"
              >
                Start Creating Free
              </Button>
              <Button 
                variant="secondary" 
                className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 text-lg font-semibold hover:bg-white/20 border border-white/20"
              >
                Watch Demo
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 instagram-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-lightbulb text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Ideas</h3>
              <p className="text-gray-600">AI generates trending content ideas based on your niche and competitors.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 instagram-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-hashtag text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Optimized Hashtags</h3>
              <p className="text-gray-600">Algorithm-optimized hashtags to maximize your reach and engagement.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 instagram-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-calendar-alt text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
              <p className="text-gray-600">Schedule posts for optimal engagement times with automated notifications.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 instagram-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-chart-line text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Trend Analysis</h3>
              <p className="text-gray-600">Stay ahead with real-time trending content in your industry.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
