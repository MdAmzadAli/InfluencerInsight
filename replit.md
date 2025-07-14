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

### July 14, 2025 - Trending Posts Cache System & Competitor Display Fix
- **✅ Enhanced Trending Posts Algorithm**: Modified trending posts to fetch 20-30 posts from Apify, cache them for 24 hours, then randomly select requested number for each generation
- **✅ Trending Posts Cache Manager**: Added dedicated cache system for trending posts by niche with automatic expiration
- **✅ Competitor Display Fix**: Fixed competitor username display showing malformed data like `@["\"jackmorris\""]` instead of `@jackmorris`
- **✅ Competitor Deletion Issue**: Fixed deletion functionality that wasn't working properly on first attempt
- **✅ Enhanced Cache System**: Extended cache manager to support both competitor posts and trending posts with unified cleanup

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