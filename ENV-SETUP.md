# Environment Configuration Guide

This guide explains how to configure and use environment variables in the TasksMate frontend application.

## Environment Files

The application uses different environment files for different deployment environments:

- `.env.development` - Used for local development environment
- `.env.production` - Used for production builds
- `.env.example` - Example template showing available environment variables

## Available Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_APP_ENV | Current environment name | `development` or `production` |
| VITE_SUPABASE_URL | Supabase project URL | `https://your-project.supabase.co` |
| VITE_SUPABASE_ANON_KEY | Supabase anonymous API key | `eyJhbGciOiJIUzI1NiIsInR5c...` |
| VITE_SUPABASE_SERVICE_KEY | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5c...` |
| VITE_BASE_API_URL | Base URL for API calls | `https://api.tasksmate.com` |
| VITE_DEV_BASE_API_URL | Development API URL | `http://localhost:8000` |
| VITE_ENABLE_ANALYTICS | Enable analytics tracking | `true` or `false` |
| VITE_ENABLE_DEBUGGER | Enable debugging features | `true` or `false` |

## Setup Instructions

1. Create appropriate environment files:
   - Copy `.env.example` to `.env.development` for local development
   - Copy `.env.example` to `.env.production` for production builds

2. Update the values in each file to match your environment needs

## Running with Environment Files

The application has several scripts to run with different environments:

- `npm run dev:local` - Run development server using `.env.development`
- `npm run build:dev` - Build for development environment using `.env.development`
- `npm run build:prod` - Build for production environment using `.env.production`

## Accessing Environment Variables in Code

Environment variables are accessible through the centralized config module:

```typescript
import { env, isDevelopment, isProduction, getApiUrl } from '@/config/env';

// Access environment variables
const supabaseUrl = env.SUPABASE_URL;

// Check current environment
if (isDevelopment) {
  // Do development-specific things
}

// Get the appropriate API URL for current environment
const apiUrl = getApiUrl();
```

## Adding New Environment Variables

1. Add the variable to your `.env.development` and `.env.production` files
2. Update the `EnvConfig` interface in `/src/config/env.ts`
3. Add the variable to the `env` object in the same file
4. Use the variable in your code by importing from the config module
