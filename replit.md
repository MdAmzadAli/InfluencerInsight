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