# Hopaba - Service Request and Marketplace Platform

## Overview

Hopaba is a comprehensive service request and business marketplace platform that connects users with service providers and businesses. The application provides a two-sided marketplace where:

1. **Users** can browse businesses, post service requests, and communicate with service providers
2. **Service Providers** can list their services, respond to user requests, and manage client communications
3. **Businesses** can showcase their offerings, receive reviews, and build their online presence

The platform is built with modern web technologies and follows a responsive design approach to ensure a seamless experience across various devices.

## Tech Stack

- **Frontend**: React with TypeScript, Vite
- **UI Framework**: shadcn-ui components, Tailwind CSS
- **State Management**: React Query for server state, React Context for application state
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage for images and attachments
- **Routing**: React Router v6

## Core Features

### User Features

1. **Authentication**
   - Email/password registration and login
   - Social login with Google
   - CAPTCHA verification (can be disabled for development)
   - Session management and persistence

2. **Business Discovery**
   - Browse businesses by category
   - Filter by city, postal code, ratings, and more
   - Search functionality with text-based queries
   - View detailed business profiles with ratings and reviews

3. **Service Requests**
   - Post service requests with detailed specifications
   - Set budgets and timeframes
   - Track request status
   - Communicate with potential service providers
   - Close or delete requests when completed

4. **Messaging System**
   - Real-time messaging with service providers
   - Attachment support
   - Quotation requests and management
   - Message history and conversation tracking

5. **Profile Management**
   - Update personal details
   - View request history
   - Manage active conversations

### Service Provider Features

1. **Provider Dashboard**
   - View matching service requests
   - Respond to requests
   - Manage client communications
   - Track ongoing and completed services

2. **Business Profile**
   - Showcase services, images, and contact information
   - Display ratings and reviews
   - Highlight specialties and areas of expertise

3. **Communication Tools**
   - Send quotes and proposals to potential clients
   - Manage client conversations
   - Track message history

### Admin Features

1. **Admin Panel**
   - User management
   - Content moderation
   - System monitoring and analytics

## Application Architecture

### Directory Structure

- **src/**
  - **components/**: Reusable UI components
  - **contexts/**: React context providers for global state
  - **hooks/**: Custom React hooks for shared functionality
  - **integrations/**: Third-party service integrations (Supabase)
  - **lib/**: Utility libraries and helpers
  - **pages/**: Page components for each route
  - **services/**: API and service layer functions
  - **types/**: TypeScript type definitions
  - **utils/**: Utility functions

### Data Models

1. **User**
   - Authentication data
   - Profile information
   - Preferences

2. **ServiceRequest**
   - Request details (title, description)
   - Category and subcategory
   - Budget and timeframe
   - Location information
   - Status (open/closed)

3. **ServiceProvider**
   - Provider details
   - Service categories and subcategories
   - Associated user account

4. **Conversation**
   - Linked to a service request
   - Between a user and provider
   - Contains messages

5. **Message**
   - Content
   - Sender information
   - Timestamps
   - Read status
   - Optional attachments and quotation info

6. **Business**
   - Business details and contact information
   - Category and subcategory
   - Location data
   - Images
   - Rating and review data

## User Workflows

### Authentication Flow

1. **Registration**
   - User visits the signup page
   - Enters email, password, and completes CAPTCHA verification
   - Submits form to create an account
   - Receives verification email
   - Verifies email to activate account

2. **Login**
   - User visits login page
   - Enters credentials and completes CAPTCHA verification (if enabled)
   - System validates credentials
   - User is redirected to the home page upon successful login

### Service Request Flow

1. **Creating a Request**
   - User navigates to "Post Request" page
   - Fills out request details (title, description, category, etc.)
   - Sets budget and timeframe
   - Provides location information
   - Submits the request

2. **Request Matching**
   - System matches the request with service providers based on category and subcategory
   - Providers are notified of new matching requests

3. **Provider Communication**
   - Providers view the request details
   - Interested providers initiate conversations
   - User receives messages from providers
   - User and provider exchange information, quotes, etc.

4. **Request Completion**
   - User selects a provider
   - Service is delivered
   - User closes the request or marks it as completed
   - User can leave feedback about the provider

### Business Discovery Flow

1. **Browsing Businesses**
   - User navigates to the Shop page
   - Browses businesses by category or uses search
   - Applies filters for location, ratings, etc.
   - Views business listings

2. **Business Details**
   - User selects a business to view detailed information
   - Views business profile, images, services
   - Reads reviews and ratings
   - Can contact the business or leave a review

## Integration Points

### Supabase Integration

The application uses Supabase for:

1. **Authentication**
   - User registration and login
   - Session management
   - Password reset functionality

2. **Database**
   - Storage of all application data
   - Real-time updates using Supabase's realtime features
   - Complex queries using RPC functions

3. **Storage**
   - Image storage for business listings
   - File attachments for messages

### Third-Party Services

1. **hCaptcha**
   - CAPTCHA verification for authentication
   - Prevents automated spam accounts

2. **Mapbox** (potential integration)
   - Location visualization
   - Business discovery by location

## Development Guidelines

### Running the Application

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Disabling CAPTCHA for Development

For local development, you can disable the CAPTCHA verification by:
1. Setting `REQUIRE_CAPTCHA = false` in the Login and Signup components
2. This allows for easier testing of authentication flows

### Building for Production

1. Run `npm run build` to create an optimized production build
2. The build output will be in the `dist` directory
3. Deploy the contents of this directory to your hosting provider

## Conclusion

Hopaba provides a comprehensive platform for connecting users with service providers and businesses. Its modular architecture allows for easy extension and customization, while the React and Supabase foundation ensures a responsive, real-time experience for all users.

The application follows modern development practices with a clear separation of concerns, reusable components, and type-safe code, making it maintainable and scalable. 