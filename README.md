# Development Setup

This project has a React frontend (client) and Node.js backend (server) with Firebase authentication and Neon PostgreSQL database.

## Prerequisites

1. **Database Setup**: You need to set up a Neon PostgreSQL database
   - Go to [Neon Console](https://console.neon.tech/)
   - Create a new project and database
   - Copy the connection string

2. **Environment Variables**: Set up your environment variables
   - In Replit: Go to Secrets tab and add `DATABASE_URL` with your Neon connection string
   - Locally: Create a `.env` file based on `.env.example`

## Running the Application

### Frontend (Client)
```bash
cd client
npm install
npm run dev
```

### Backend (Server)
```bash
# From root directory
npm install
npm run dev
```

## Important Notes

- The application will start even without DATABASE_URL set, but database functionality will be disabled
- Make sure to set up your Neon database and add the DATABASE_URL to your environment variables
- The frontend runs on a different port than the backend
- Firebase authentication is configured in the client-side code

## Environment Variables Required

- `DATABASE_URL`: Your Neon PostgreSQL connection string
- Firebase configuration variables (if using Firebase auth)