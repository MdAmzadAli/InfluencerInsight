# Instagram Content Generator

## Overview

A full-stack web application that generates viral Instagram content using AI. The platform allows users to create engaging captions, headlines, hashtags, and content ideas tailored to their specific niche, with features for content scheduling and management.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state and React hooks for local state
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom Instagram-themed gradient variables
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Middleware**: Custom logging, error handling, and authentication middleware
- **Database ORM**: Drizzle ORM for type-safe database operations

### Authentication System
- **Provider**: JWT (JSON Web Token) authentication
- **Token Management**: Client-side JWT tokens with secure HTTP-only storage
- **Security**: JWT tokens with expiration, secure authentication headers, and proper token validation

## Key Components

### AI Content Generation
- **Service**: Google Gemini API for content generation
- **Generation Types**:
  - Date-based content (holidays and trending topics)
  - Competitor analysis content
  - General trending content
- **Output**: Structured JSON with headlines, captions, hashtags, and content ideas

### Database Schema
- **Users Table**: Profile information, niche preferences, and competitor data
- **Content Ideas Table**: Generated content with save/unsave functionality
- **Scheduled Posts Table**: Post scheduling with repeat options
- **Indian Holidays Table**: Predefined holiday data for content inspiration
- **User Authentication**: JWT-based user authentication with secure token storage

### Content Management Features
- **Content Generation**: AI-powered content creation based on user niche
- **Content Saving**: Save favorite generated ideas for later use
- **Post Scheduling**: Schedule posts with date, time, and repeat options
- **Custom Post Creation**: Manual content creation with scheduling capabilities

## Data Flow

1. **User Authentication**: JWT-based authentication handles user login/logout with token persistence
2. **Profile Setup**: Users define their niche and competitors for personalized content
3. **Content Generation**: AI generates content based on user preferences and selected generation type
4. **Content Management**: Users can save ideas, create custom posts, and schedule content
5. **Data Persistence**: All user data, content, and schedules stored in PostgreSQL database

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL (serverless PostgreSQL)
- **AI Service**: Google Gemini API for content generation
- **Authentication**: JWT-based authentication
- **UI Components**: Radix UI primitives with shadcn/ui styling

### Development Tools
- **Database Management**: Drizzle Kit for migrations and schema management
- **Type Safety**: TypeScript with strict configuration
- **Build Process**: Vite for frontend bundling, esbuild for backend compilation
- **Code Quality**: ESLint and TypeScript compiler checks

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR and error overlay
- **Backend**: TSX for TypeScript execution with auto-restart
- **Database**: Connection to Neon PostgreSQL via environment variables

### Production Build
- **Frontend**: Static build output to `dist/public` directory
- **Backend**: Bundled Node.js application with external dependencies
- **Serving**: Express serves both API routes and static frontend files

### Environment Configuration
- **Required Variables**: `DATABASE_URL`, `GEMINI_API_KEY`, `APIFY_API_TOKEN`, `SESSION_SECRET`
- **Authentication**: JWT-based authentication with secure token management
- **Database**: Automatic schema pushing with Drizzle migrations

## Recent Changes

### July 17, 2025 - Admin Panel Token Analytics & User Tracking Complete
- **✅ Admin Token Analytics**: Integrated comprehensive user token usage tracking into admin panel (/admin route)
- **✅ User Usage Overview**: Added analytics dashboard showing total users, active users, daily token consumption, and idea generation
- **✅ Individual User Tracking**: Detailed per-user analytics including today's usage, total tokens, daily averages, and activity patterns
- **✅ Real-Time Token Monitoring**: Admin can track token consumption across all users with live updates
- **✅ Usage Trend Analysis**: Dashboard shows today/yesterday/7-day usage comparisons for operational insights
- **✅ User Activity Insights**: Track which users are most active, their niches, and consumption patterns
- **✅ Percentage-Based Display**: Token tracker shows usage as percentage (e.g., "85% remaining") instead of raw numbers
- **✅ Real-Time Token Tracking**: Enhanced token tracker with 5-second refresh intervals for immediate updates
- **✅ Refine Panel Integration**: Added token tracker to refine panel header for visibility during AI chat
- **✅ Budget Maintained**: Kept original 66K tokens/day limit for $0.02 daily budget as requested

### July 17, 2025 - Competitor Refresh 24-Hour Restriction Fix Complete
- **✅ Server-Side Validation**: Added 24-hour restriction check to competitor refresh API endpoint
- **✅ Client-Side UI**: Disabled refresh button when 24-hour restriction is active
- **✅ Consistent Behavior**: Refresh function now matches add/remove competitor restrictions
- **✅ Error Handling**: Proper error messages shown when attempting to refresh within 24 hours
- **✅ Button State**: Refresh button visually disabled when restriction is active
- **✅ Security**: Server-side validation prevents bypassing client-side restrictions

### July 17, 2025 - Gemini API 503 Error Retry Logic Fix Complete
- **✅ Retry Logic Implementation**: Added comprehensive retry logic for all Gemini API calls with exponential backoff
- **✅ 503 Error Handling**: Specifically handles "model is overloaded" errors with automatic retry attempts
- **✅ Exponential Backoff**: Implements 2s, 4s, 8s delay pattern for robust error recovery
- **✅ Multiple Function Coverage**: Added retry logic to generateInstagramContentWithGemini, optimizeHashtagsWithGemini, and generateStrategyFromContent
- **✅ Fallback Strategy**: Maintains fallback content generation when all retry attempts fail
- **✅ Improved Reliability**: Competitor analysis now works consistently even during high API load periods

### July 17, 2025 - User-Friendly Error Messages & Button Disabling Complete
- **✅ User-Friendly Error Messages**: Replaced technical HTTP status codes (429, 500, 401) with clear, understandable messages
- **✅ Token Exhaustion Handling**: Changed "Daily token limit reached" to "Not enough tokens remaining today"
- **✅ Server Error Messages**: Replaced "HTTP error! status: 500" with "Our servers are having issues. Please try again in a few minutes"
- **✅ Session Error Messages**: Improved "Unauthorized" to "Session Expired. Please log in again to continue"
- **✅ Button Disabling**: All generation buttons (date-specific, competitor, trending) automatically disable when tokens exhausted
- **✅ Refine Panel Disabling**: AI chat input and send button disable when no tokens remaining
- **✅ Visual Feedback**: Cards show reduced opacity and "cursor-not-allowed" when tokens exhausted
- **✅ Helpful Placeholders**: Refine panel shows "Not enough tokens remaining today" message in input field
- **✅ Mobile Support**: Token-based button disabling works on both desktop and mobile interfaces

### July 17, 2025 - Refine Panel HTML Formatting Enhancement Complete
- **✅ HTML Formatting**: Modified AI responses to use proper HTML tags instead of markdown asterisks
- **✅ Bold Text**: Converted **text** to <strong>text</strong> for proper bold display
- **✅ Italic Text**: Converted *text* to <em>text</em> for proper italic display  
- **✅ Server-Side Instructions**: Updated Gemini prompts to generate HTML-formatted responses
- **✅ Client-Side Processing**: Added formatMessage function to handle HTML rendering
- **✅ Safe HTML Rendering**: Implemented dangerouslySetInnerHTML for proper formatting display
- **✅ Enhanced Readability**: AI responses now display with proper formatting for better user experience

### July 17, 2025 - Streaming Generation Navigation Fix Complete
- **✅ Navigation Issue Fixed**: Resolved streaming generation interruption when users navigate away from page during content generation
- **✅ Proper Cleanup Logic**: Added useEffect cleanup to abort streaming connections when component unmounts
- **✅ Auto-Recovery System**: Implemented 10-second auto-recovery to reset stuck generation states
- **✅ Enhanced Error Handling**: Added network error detection and connection loss handling
- **✅ Improved UI States**: Replaced confusing square loader with clear "Reconnecting to Generation" message
- **✅ Reference-Based Cleanup**: Fixed circular dependency issue with streamingAbortController using useRef
- **✅ User Experience**: Users can now safely navigate during generation without UI getting stuck in loading state

### July 17, 2025 - Mobile Navbar Width Fix Complete
- **✅ Mobile Layout Issue**: Fixed navbar width shrinking issue when content is generated on mobile devices
- **✅ Responsive Design**: Modified navbar container to use full width on mobile (removed max-w-7xl constraint for mobile)
- **✅ Consistent UI**: Navbar now maintains full width across all mobile states regardless of content generation status
- **✅ Desktop Preservation**: Maintained desktop layout with max-width container for optimal viewing on larger screens

### July 17, 2025 - Final Migration to Replit Environment Complete
- **✅ Complete Migration**: Successfully migrated Instagram Content Generator from Replit Agent to full Replit environment
- **✅ PostgreSQL Database**: Created and configured database with all required Prisma schema tables
- **✅ API Keys Integration**: Added APIFY_API_TOKEN and GEMINI_API_KEY environment variables for full functionality
- **✅ Dependencies Working**: All packages including tsx, Node.js 20, and project dependencies verified and working
- **✅ Server Running**: Application successfully running on port 5000 with database connection and notification scheduler
- **✅ Security Practices**: Maintained proper client/server separation and robust security practices
- **✅ Migration Complete**: Project fully operational and ready for continued development and deployment

### July 17, 2025 - Migration to Replit Environment Complete
- **✅ Project Migration**: Successfully migrated Instagram Content Generator from Replit Agent to Replit environment
- **✅ Database Setup**: Created PostgreSQL database and pushed Prisma schema with all required tables
- **✅ Environment Configuration**: Added DATABASE_URL, APIFY_API_TOKEN, and GEMINI_API_KEY for full functionality
- **✅ Dependencies Verified**: All packages including tsx, Node.js 20, and project dependencies working correctly
- **✅ Application Running**: Server successfully running on port 5000 with database connection and notification scheduler
- **✅ Security Implementation**: Maintained proper client/server separation and robust security practices throughout migration
- **✅ API Integration**: Both Apify and Gemini APIs properly configured and authenticated
- **✅ Migration Complete**: Ready for continued development and deployment

### July 17, 2025 - Previous Migration to Replit Environment Complete
- **✅ Project Migration**: Successfully migrated Instagram Content Generator from Replit Agent to Replit environment
- **✅ Database Setup**: Created PostgreSQL database and pushed Prisma schema with all required tables
- **✅ Environment Configuration**: Added DATABASE_URL, APIFY_API_TOKEN, and GEMINI_API_KEY for full functionality
- **✅ Dependencies Verified**: All packages including tsx, Node.js 20, and project dependencies working correctly
- **✅ Application Running**: Server successfully running on port 5000 with database connection and notification scheduler
- **✅ Security Implementation**: Maintained proper client/server separation and robust security practices throughout migration
- **✅ API Integration**: Both Apify and Gemini APIs properly configured and authenticated
- **✅ Migration Complete**: Ready for continued development and deployment

### July 17, 2025 - Budget-Optimized Token System for $0.02/Day Launch
- **✅ Gemini 2.5 Flash Cost Analysis**: Researched and optimized for $0.02 daily budget using most cost-effective Gemini model
- **✅ 66K Daily Token Limit**: Set optimal token allocation (66,000 tokens/day) to maximize $0.02 budget efficiency
- **✅ Realistic Token Costs**: Updated consumption rates based on actual Gemini API usage patterns:
  - Date-specific content: 3,000 tokens per idea (~22 ideas/day maximum)
  - Competitor/Trending analysis: 5,000 tokens per idea (~13 ideas/day maximum)
  - AI refinement: 2,000 tokens per message (~33 chats/day maximum)
- **✅ Removed Ideas Tracking**: Eliminated separate "ideas remaining" display, focusing purely on token-based economy
- **✅ Complete Feature Disabling**: All generation buttons and refine functionality disabled when tokens exhausted
- **✅ Enhanced UI Feedback**: Visual disabled states and clear error messages when token limit reached
- **✅ Token-Only Interface**: Simplified tracker showing "66K tokens/day" with K-format display for readability
- **✅ Cost-Controlled Beta**: System now enforces strict $0.02/day budget with complete feature lockout when exceeded
- **✅ Production Ready**: Token system optimized for sustainable beta launch with predictable daily costs

### July 14, 2025 - Universal Content Editing System Complete
- **✅ Content Editor Component**: Created reusable ContentEditor modal with real-time streaming editing
- **✅ API Integration**: Added PUT /api/content-ideas/:id endpoint for content updates
- **✅ Database Support**: Enhanced storage methods for content idea updates
- **✅ Universal Edit Buttons**: Added edit functionality to all content sections:
  - Generate Ideas: Edit button on every generated content card
  - Saved Ideas: Edit button on saved content cards
  - Post Scheduling: Edit button on scheduled posts
  - Refine Panel: Edit Content button in AI expert chat header
- **✅ Seamless Experience**: Users can now edit content anywhere in the app with instant updates
- **✅ Real-time Updates**: Content changes reflect immediately across all components
- **✅ Professional UI**: Consistent edit button styling with Lucide Edit3 icon throughout app

### July 14, 2025 - Refine Panel Enhancement & UI Optimization Complete
- **✅ Refine Panel Connection**: Connected sidebar refine panel to navigation system
- **✅ Standalone Refine Functionality**: Refine panel now works without requiring existing ideas
- **✅ Conditional UI Rendering**: Original content panel only shows when refining specific ideas
- **✅ Dual Access Modes**: Sidebar opens standalone AI expert, idea buttons open targeted refinement
- **✅ Navigation Cleanup**: Hidden Analytics and main Competitors sections while keeping Manage Competitors accessible
- **✅ Enhanced User Experience**: AI expert chat now available directly from sidebar for instant content consultation
- **✅ Error Resolution**: Fixed null reference errors when accessing refine panel without ideas
- **✅ Niche Management**: Changed "Settings" to "Niche" in sidebar with dedicated niche management interface
- **✅ User Experience**: Focused niche page with clear editing capabilities and visual feedback
- **✅ Smart Cache Rewarming**: Automatic cache clearing and rewarming when niche or competitors change
- **✅ Optimized Performance**: User-specific cache management prevents stale data after profile updates
- **✅ Competitor Addition Fix**: Fixed new user competitor adding by using correct API endpoint
- **✅ UI Cleanup**: Removed Profile and Settings from user dropdown menu
- **✅ Authentication Security**: Protected all routes - unauthenticated users redirected to landing page
- **✅ Logout Enhancement**: Logout now properly redirects to landing page and clears session

### July 14, 2025 - Dashboard UI Enhancement & Bug Fixes Complete
- **✅ Generate Ideas Default**: Dashboard now defaults to "Generate Ideas" tab when accessing dashboard page
- **✅ Sidebar Navigation**: Updated sidebar to highlight "Generate Ideas" as active when on root dashboard
- **✅ Enhanced User Experience**: Streamlined navigation with clear visual indication of current section

### July 14, 2025 - Migration & Critical Bug Fixes Complete
- **✅ Project Migration**: Successfully migrated Instagram Content Generator from Replit Agent to Replit environment
- **✅ Database Setup**: Created PostgreSQL database and pushed Prisma schema with all required tables
- **✅ Dependencies Installation**: All packages installed correctly including tsx, Node.js 20, and all project dependencies
- **✅ Environment Variables**: Configured DATABASE_URL, APIFY_API_TOKEN, and GEMINI_API_KEY for full functionality
- **✅ Application Running**: Server successfully running on port 5000 with database connection and notification scheduler
- **✅ Security Enhancements**: Proper client/server separation maintained throughout migration
- **✅ Competitor Analysis Validation**: Fixed competitor generation to show proper error when no competitors are added
- **✅ Database Field Fix**: Removed updatedAt field reference causing crashes during content generation
- **✅ Error Handling**: Improved error messages and validation throughout the content generation process
- **✅ Content Idea Saving Fix**: Fixed temporary ID generation that was too large for database INT4 field
- **✅ Competitor Analysis Toast**: Fixed error toast display for competitor analysis validation

### July 15, 2025 - Migration Complete & Custom Post Scheduling Fixed
- **✅ Migration Complete**: Successfully migrated Instagram Content Generator from Replit Agent to Replit environment
- **✅ Database Setup**: Created PostgreSQL database and pushed Prisma schema with all required tables
- **✅ Dependencies Installation**: All packages installed correctly including tsx, Node.js 20, and all project dependencies
- **✅ Environment Variables**: Configured DATABASE_URL, APIFY_API_TOKEN, and GEMINI_API_KEY for full functionality
- **✅ Application Running**: Server successfully running on port 5000 with database connection and notification scheduler
- **✅ Security Enhancements**: Proper client/server separation maintained throughout migration
- **✅ Custom Post Scheduling Fix**: Fixed custom post creation workflow to save posts as content ideas first, then schedule them
- **✅ Database Flow**: Custom posts now properly save to database before scheduling, preventing "All fields are required" error
- **✅ UI Integration**: Schedule modal now handles both existing ideas and custom posts seamlessly

### July 14, 2025 - Migration & Background Task Optimization Complete
- **✅ Project Migration**: Successfully migrated Instagram Content Generator from Replit Agent to Replit environment
- **✅ Database Setup**: Created PostgreSQL database and pushed Prisma schema with all required tables
- **✅ Dependencies Installation**: All packages installed correctly including tsx, Node.js 20, and all project dependencies
- **✅ Environment Variables**: Configured DATABASE_URL, APIFY_API_TOKEN, and GEMINI_API_KEY for full functionality
- **✅ Application Running**: Server successfully running on port 5000 with database connection and notification scheduler
- **✅ Security Enhancements**: Proper client/server separation maintained throughout migration
- **✅ UI Cleanup**: Removed niche field from signup form per user request for streamlined registration
- **✅ Background Task Implementation**: Implemented non-blocking cache warming using setImmediate and background tasks
- **✅ Request Isolation**: API requests no longer block while cache warming is in progress
- **✅ Smart Fallback Strategy**: System uses cached data when ready, waits briefly for cache (3s max), then fetches fresh data immediately
- **✅ Main Thread Protection**: Cache warming runs in background without blocking content generation or other API calls

### July 14, 2025 - Comprehensive Cache Warming & Single API Call System
- **✅ Cache Warming on Startup**: Implemented automatic cache warming for both competitor and trending posts when user logs in
- **✅ Intelligent Cache Management**: System checks cache status and warms competitor/trending posts based on user's niche and competitors
- **✅ Wait-for-Cache System**: API calls wait for cache warming to complete instead of making duplicate calls or throwing errors
- **✅ Post Rotation Logic**: When user requests more ideas than available posts (e.g., 10 ideas from 8 posts), system rotates posts intelligently
- **✅ Instagram URL Validation**: Ensures all competitor and trending responses have valid Instagram URLs before sending to frontend
- **✅ Fixed Automatic API Calls**: Removed auto-fetch of competitor posts on app startup - now only occurs when user clicks generation buttons
- **✅ Apify Response Parsing**: Fixed trending posts parsing to handle `[{"topPosts":[]}]` format correctly
- **✅ Single API Call Workflow**: Truly single API call per generation type with proper cache utilization and waiting mechanisms

### July 13, 2025 - JWT Authentication Migration Complete
- **✅ Replit Auth Removal**: Completely removed Replit Auth and all session-based authentication
- **✅ JWT Implementation**: Implemented secure JWT-based authentication throughout the application
- **✅ Token Management**: Client-side JWT tokens with secure storage and validation
- **✅ API Route Protection**: All protected routes now use JWT authentication middleware
- **✅ Authentication Flow**: Login/register endpoints return JWT tokens for seamless user experience
- **✅ Clean Architecture**: Removed all passport, session, and OIDC dependencies
- **✅ Security Enhancement**: Improved security with token-based authentication and proper error handling

### July 12, 2025 - Migration to Replit Environment Complete
- **✅ Migration Completed**: Successfully migrated project from Replit Agent to Replit environment
- **✅ Database Setup**: Created and configured PostgreSQL database with proper Prisma schema
- **✅ API Keys Integration**: Added APIFY_API_TOKEN and GEMINI_API_KEY environment variables
- **✅ Gemini API Fixed**: Resolved API initialization issues causing competitor analysis failures
- **✅ Apify Timeout Issues Fixed**: Increased request timeouts to prevent long-running Instagram scraping from timing out
- **✅ Real Instagram Data**: Apify scraper now working with authentic Instagram data
- **✅ Authentication System**: Fixed authentication with proper storage layer methods
- **✅ Project Structure**: All dependencies installed and working correctly
- **✅ Security Best Practices**: Proper client/server separation and environment variable management
- **✅ Frontend Display Fixes**: Fixed new ideas appearing at top, improved responsive layout, and Instagram source links
- **✅ Landing Page Implementation**: Added proper landing page with login/signup navigation
- **✅ Authentication Flow**: Registration and login working correctly with JWT tokens
- **✅ Database Migration**: Successfully migrated from Drizzle to Prisma ORM

### July 12, 2025 - Advanced Streaming Content Refinement System
- **✅ Expert Chatbot Implementation**: Built powerful AI-powered Instagram content expert chatbot
- **✅ Real-time Streaming Responses**: Implemented Server-Sent Events (SSE) for instant AI responses
- **✅ Gemini-Only Integration**: Removed all OpenAI dependencies, using only Google Gemini API throughout
- **✅ Enhanced UI Design**: Modern chat interface with user/bot avatars and real-time streaming display
- **✅ Context-Aware Conversations**: AI remembers conversation history and original content context
- **✅ Instagram Growth Expertise**: AI specialized in viral content strategies, engagement optimization, and trending tactics
- **✅ Fast Response Times**: Optimized streaming for near-instant response delivery
- **✅ Professional Chat Interface**: Split-panel design with original content reference and expert consultation
- **✅ Authentication Fixes**: Fixed JWT token type conversion, token storage key mismatch in both backend and frontend, and user authentication flow
- **✅ Content Generation Working**: Streaming API now properly authenticates and starts fetching Instagram data
- **✅ Complete Issue Resolution**: Fixed all four critical issues:
  1. Settings section now opens properly in dashboard sidebar
  2. Content generation fully functional for all types (date-specific, competitor analysis, trending)
  3. Competitor management API fixed with proper niche + competitors payload
  4. Mobile responsive sidebar with overlay, hamburger menu, and transparent background

### July 12, 2025 - Real-time Streaming Content Generation
- **✅ Real-time Streaming API**: Added Server-Sent Events (SSE) for real-time content generation updates
- **✅ Post-by-Post Processing**: Each Instagram post is now processed individually and results streamed to frontend
- **✅ Live Progress Tracking**: Real-time progress bar showing current post being analyzed (e.g., "3/10 posts")
- **✅ Immediate Result Display**: Generated content appears in UI instantly as each post is processed
- **✅ Enhanced User Experience**: Users see live status updates and progress instead of waiting for bulk processing
- **✅ Single Post Content Generation**: New Gemini function to generate content from individual Instagram posts
- **✅ Streaming Progress UI**: Blue progress card with spinner, step descriptions, and completion percentage
- **✅ API Key Configuration**: Successfully configured APIFY_API_TOKEN and GEMINI_API_KEY environment variables
- **✅ Optimized Apify API Calls**: Competitor analysis makes single API call for all competitors using directUrls parameter
- **✅ Enhanced Logging**: Added detailed logging for API calls and post distribution per competitor

### July 13, 2025 - Responsive UI Optimization & Complete Navigation System
- **✅ Responsive Navigation System**: Implemented mobile-first navigation with proper hamburger menu for mobile/tablet
- **✅ Unified Sidebar Experience**: Desktop sidebar now matches mobile hamburger menu content with all features
- **✅ Dashboard Button Fix**: Dashboard button now properly expands/collapses sub-options without content shifting
- **✅ Complete Feature Integration**: All navigation buttons now connect to their respective functionality
- **✅ Analytics Dashboard**: Added comprehensive analytics page with charts, KPIs, and performance tracking
- **✅ Mobile Optimization**: Proper responsive breakpoints (mobile <768px, tablet <1024px, desktop ≥1024px)
- **✅ Removed Duplicate Sidebar**: Eliminated second sidebar from dashboard component causing layout conflicts
- **✅ Enhanced Mobile Menu**: Mobile hamburger menu now includes all desktop sidebar features including dashboard sub-options
- **✅ Proper Route Management**: All sidebar links now properly route to their respective components
- **✅ Progress Component**: Added missing UI components for better user experience
- **✅ Mobile Generate Ideas**: Added mobile-specific selector interface with dropdown for generation types and single generate button
- **✅ Responsive Generation UI**: Desktop maintains card-based selection, mobile uses streamlined dropdown selector
- **✅ UI Component Creation**: Added missing Sheet, Collapsible, and Progress components for complete UI functionality

### July 12, 2025 - Enhanced Content Generation & UI Improvements
- **✅ Dynamic Content Generation**: Modified Gemini to generate as many ideas as input posts from Apify scraper
- **✅ Selective Image Analysis**: Image analysis now only processes posts with type="Image" for better performance
- **✅ Timer Fallback Strategy**: Added fallback strategy generation using hashtags and caption when initial strategy is too short
- **✅ Dividing Panels**: Added visual dividers between different generation session types in the frontend
- **✅ Generation Session Tracking**: Frontend now tracks and displays generation sessions with timestamps and counts
- **✅ Stacked Results**: Generated ideas now accumulate and stack on previous results instead of replacing them
- **✅ Project Migration**: Successfully migrated project from Replit Agent to Replit environment with database setup

### July 12, 2025 - Apify Integration & Enhanced Image Analysis
- **✅ Apify Instagram Scraper Integration**: Added real-time Instagram data fetching using Apify API
- **✅ Enhanced Image Analysis**: Gemini AI now analyzes Instagram images for better content context
- **✅ Real Instagram Data Pipeline**: Integrated trending posts and competitor analysis with authentic data
- **✅ Multimodal Content Generation**: AI now considers visual elements when generating content
- **✅ API Integration Testing**: Added testing endpoint for Apify integration verification
- **✅ Environment Configuration**: Added APIFY_API_TOKEN support for production deployment
- **✅ Database Migration**: Successfully migrated from Agent to Replit environment
- **✅ PostgreSQL Setup**: Configured and initialized database with proper schema

### July 09, 2025 - AI Integration & Content Format Optimization
- **✅ Gemini AI Integration**: Added Google Gemini as primary AI service for content generation with OpenAI as fallback
- **✅ Removed All Mock Data**: Eliminated all placeholder/mock data throughout the application - now requires real API keys
- **✅ Real-time Notifications**: Implemented post scheduling notifications with node-cron for automated reminders
- **✅ Enhanced Content Generation**: Improved AI prompts for better Instagram content with competitor analysis integration
- **✅ Database Connection**: Fixed PostgreSQL connection issues and ensured proper database health checks
- **✅ Hashtag Optimization**: Added Gemini-powered hashtag optimization with fallback to OpenAI
- **✅ Content Format Optimization**: Refined content generation to specific requirements:
  - Captions: 20-40 words exactly
  - Hashtags: 5-10 relevant hashtags per post
  - Ideas: Max 50 words with strategy explanation
- **✅ Instagram Source Attribution**: Added post URL sources for competitor and trending analysis
- **✅ Frontend State Persistence**: Generated ideas accumulate and persist across page navigation
- **✅ Double @ Symbol Fix**: Resolved competitor username formatting issues
- **✅ Real Instagram Scraper**: Created robust scraper with multiple methods for authentic data extraction
- **✅ Strategy Enhancement**: Enhanced "ideas" field to include detailed 40-50 word execution strategies
- **✅ Mandatory Real Data**: Removed all fallbacks to mock data - real Instagram scraping is now required
- **🔧 Error Handling**: Added comprehensive error handling for AI services and database operations
- **🔧 API Key Requirements**: Made API keys mandatory for all AI-powered features

### Technical Architecture Updates
- **Authentication**: Firebase client-side auth with server-side token verification
- **Database**: Custom Neon PostgreSQL connection with WebSocket support
- **API Security**: Bearer token authentication for all protected endpoints
- **Instagram Analysis**: Combines posts from all competitors, ranks by engagement, provides detailed insights
- **UI/UX**: Enhanced left sidebar with competitors management and competitor posts preview

## Changelog

```
Changelog:
- July 08, 2025. Initial setup
- July 09, 2025. Major feature implementation - competitors management, Firebase auth, custom database, enhanced Instagram scraper
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```