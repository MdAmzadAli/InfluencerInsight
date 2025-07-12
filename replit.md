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
- **Provider**: Replit Auth (OIDC-based authentication)
- **Session Management**: Express sessions with PostgreSQL storage
- **Security**: HTTP-only cookies, CSRF protection, and secure session configuration

## Key Components

### AI Content Generation
- **Service**: OpenAI GPT-4o integration for content generation
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
- **Sessions Table**: Authentication session storage (required for Replit Auth)

### Content Management Features
- **Content Generation**: AI-powered content creation based on user niche
- **Content Saving**: Save favorite generated ideas for later use
- **Post Scheduling**: Schedule posts with date, time, and repeat options
- **Custom Post Creation**: Manual content creation with scheduling capabilities

## Data Flow

1. **User Authentication**: Replit Auth handles user login/logout with session persistence
2. **Profile Setup**: Users define their niche and competitors for personalized content
3. **Content Generation**: AI generates content based on user preferences and selected generation type
4. **Content Management**: Users can save ideas, create custom posts, and schedule content
5. **Data Persistence**: All user data, content, and schedules stored in PostgreSQL database

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL (serverless PostgreSQL)
- **AI Service**: OpenAI API for content generation
- **Authentication**: Replit Auth service
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
- **Required Variables**: `DATABASE_URL`, `OPENAI_API_KEY`, `SESSION_SECRET`, `REPL_ID`
- **Authentication**: Replit domains and OIDC configuration
- **Database**: Automatic schema pushing with Drizzle migrations

## Recent Changes

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