# JSW Steel Projects - Qualified News Application

## Overview

This application is a web-based dashboard for JSW Steel to track and manage qualified project leads. It provides a user-friendly interface for viewing, filtering, and analyzing project opportunities, with an integrated AI-powered chatbot for personalized recommendations.

## Table of Contents

1. [Features](#features)
2. [Technical Architecture](#technical-architecture)
3. [Project Structure](#project-structure)
4. [Key Components](#key-components)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [UI Components](#ui-components)
8. [Chatbot Functionality](#chatbot-functionality)
9. [Filtering and Sorting](#filtering-and-sorting)
10. [Project Type Normalization](#project-type-normalization)
11. [Responsive Design](#responsive-design)
12. [Development Setup](#development-setup)
13. [Troubleshooting](#troubleshooting)

## Features

- **Project Dashboard**: View and manage qualified project leads
- **Advanced Filtering**: Filter projects by priority, project type, and search terms
- **Sorting Options**: Sort projects by priority or date
- **Expandable Details**: View detailed project information with expandable rows
- **AI-Powered Chatbot**: Get personalized project recommendations based on your role and interests
- **Pipeline Management**: Run and monitor the data pipeline
- **Responsive Design**: Works on desktop and mobile devices

## Technical Architecture

The application is built using:

- **Next.js**: React framework for server-rendered applications
- **React**: JavaScript library for building user interfaces
- **Material-UI**: React components for consistent design
- **Tailwind CSS**: Utility-first CSS framework for styling
- **React Icons**: Icon library for UI elements
- **React Markdown**: For rendering markdown content in the chatbot

## Project Structure

```
next-app/
├── app/
│   ├── page.js           # Main application page
│   ├── layout.js         # Application layout
│   └── globals.css       # Global styles
├── public/               # Static assets
├── package.json          # Dependencies and scripts
└── README.md             # Documentation
```

## Key Components

### Main Application (page.js)

The main application is a single-page React component that manages the entire UI and functionality. It includes:

- Project data fetching and management
- Filtering and sorting logic
- Chatbot functionality
- UI rendering

### State Management

The application uses React's useState and useEffect hooks for state management:

- **Project Data**: `projects`, `filteredProjects`
- **Filtering**: `searchTerm`, `priorityFilter`, `projectTypeFilter`, `sortBy`
- **UI State**: `currentPage`, `isLoading`, `isPipelineRunning`
- **Chatbot State**: `isChatOpen`, `userContext`, `userCompany`, `selectedTags`, `chatStage`, `messages`

## API Integration

The application integrates with two main API endpoints:

1. **Projects API**: `https://meresu-jsw-backend.onrender.com/api/projects`
   - Fetches project data
   - Handles special JSON values (NaN, Infinity)

2. **Pipeline Status API**: `https://meresu-jsw-backend.onrender.com/api/pipeline_status`
   - Checks if the data pipeline is running
   - Triggers project refresh when pipeline completes

3. **Pipeline Run API**: `http://127.0.0.1:5000`
   - Triggers the data pipeline to run

## UI Components

### Material-UI Components

- **ThemeProvider**: Custom theme with gray color palette
- **TextField**: Search input and form fields
- **Select/MenuItem**: Dropdown filters
- **Button**: Action buttons
- **Paper**: Card containers
- **Avatar**: User avatars in the chatbot
- **IconButton**: Icon-only buttons
- **Tooltip**: Hover tooltips

### Custom Components

- **Project Table**: Displays project data with expandable rows
- **Pagination**: Navigation between pages of projects
- **Chatbot Interface**: AI-powered recommendation system
- **Loading Indicators**: Spinners for async operations

## Chatbot Functionality

The chatbot provides a guided experience for getting personalized project recommendations:

1. **Role Selection**: User enters their role in the company
2. **Company Information**: User provides company and industry details
3. **Project Type Selection**: User selects project types of interest
4. **Interactive Chat**: User can ask specific questions about projects

The chatbot uses a combination of:
- Local recommendation logic based on user profile
- Project type matching
- Priority-based filtering
- Contract value analysis

## Filtering and Sorting

The application provides comprehensive filtering and sorting capabilities:

### Search Filter
- Searches across project title, company, and location
- Case-insensitive matching

### Priority Filter
- Filter by High, Medium, or Low priority

### Project Type Filter
- Filter by specific project types
- Uses normalized project type matching

### Sorting Options
- Priority (High to Low or Low to High)
- Date (Newest First or Oldest First)

## Project Type Normalization

The application includes a robust project type normalization system:

```javascript
const normalizeType = (type) => {
  if (!type || type.trim() === '') return null;
  
  // Normalize case (Title Case) and trim whitespace
  type = type.trim().toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  // Standardize common variations
  if (type.includes('Metro')) return 'Metro';
  if (type.includes('Railway') || type.includes('Rail')) return 'Railway';
  if (type.includes('Highway') || type.includes('Road')) return 'Highway/Road';
  if (type.includes('Port')) return 'Transportation - Port';
  if (type.includes('Airport')) return 'Airport';
  if (type.includes('Manufacturing') && type.includes('Cement')) return 'Manufacturing - Cement';
  if (type.includes('Manufacturing') && type.includes('Steel')) return 'Manufacturing - Steel';
  if (type.includes('Manufacturing')) return 'Manufacturing';
  if (type.includes('Power') || type.includes('Energy')) return 'Energy & Power';
  if (type.includes('Infrastructure')) return 'Infrastructure';
  
  return type;
};
```

This ensures consistent categorization of projects regardless of how the type is entered in the data.

## Responsive Design

The application is fully responsive with:

- Mobile-first design approach
- Responsive grid layouts
- Truncation for small screens
- Collapsible elements
- Touch-friendly controls

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   cd next-app
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Troubleshooting

### Common Issues

1. **Pipeline Connection Error**
   - Ensure the backend server is running
   - Check network connectivity
   - Verify the API endpoint URLs

2. **Project Data Not Loading**
   - Check browser console for errors
   - Verify API response format
   - Ensure the backend is properly configured

3. **Chatbot Not Responding**
   - Check if the user has completed all required steps
   - Verify that project data is loaded
   - Check for JavaScript errors in the console

### ESLint Errors

If you encounter ESLint errors:

1. **Missing Dependencies in useEffect**
   - Add missing dependencies to the dependency array
   - Consider using useCallback for functions used in useEffect

2. **Unescaped Entities**
   - Replace apostrophes with `&apos;` in JSX
   - Use proper HTML entities for special characters

## Future Enhancements

Potential improvements for future development:

1. **Authentication System**: Add user login and role-based access
2. **Project Details Page**: Create dedicated pages for each project
3. **Export Functionality**: Allow exporting project data to CSV/Excel
4. **Advanced Analytics**: Add charts and visualizations for project data
5. **Real-time Updates**: Implement WebSocket for live data updates
6. **Enhanced AI Recommendations**: Integrate with more sophisticated AI models

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
#   J S W _ s c r a p p e d _ d a t a - f r o n t e n d 
 
 