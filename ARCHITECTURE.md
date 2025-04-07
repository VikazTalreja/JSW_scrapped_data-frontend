# JSW Steel Projects - Technical Architecture

## System Overview

The JSW Steel Projects application follows a modern web architecture with a clear separation of concerns between frontend and backend components.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                          │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌───────────────────┐   │
│  │  UI Layer   │◄───┤  State      │◄───┤  API Integration  │   │
│  │  (React)    │    │  Management │    │  (Fetch API)      │   │
│  └─────────────┘    └─────────────┘    └───────────────────┘   │
│         ▲                  ▲                    ▲               │
│         │                  │                    │               │
│  ┌─────────────┐    ┌─────────────┐    ┌───────────────────┐   │
│  │  Styling    │    │  Business   │    │  Data Processing  │   │
│  │  (Tailwind) │    │  Logic      │    │  & Normalization  │   │
│  └─────────────┘    └─────────────┘    └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                           ▲
                           │
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Services                            │
│                                                                 │
│  ┌───────────────────┐    ┌───────────────────┐                │
│  │  Projects API     │    │  Pipeline Status  │                │
│  │  (Render.com)     │    │  API (Render.com) │                │
│  └───────────────────┘    └───────────────────┘                │
│           ▲                           ▲                         │
│           │                           │                         │
│  ┌───────────────────┐    ┌───────────────────┐                │
│  │  Data Pipeline    │    │  local Storage    │                │
│  │  (Local/Cloud)    │    │  (for now temp)   │                │
│  └───────────────────┘    └───────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

The application is built as a single-page application with multiple functional components:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Main Application                            │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌───────────────────┐   │
│  │  Navigation │    │  Search &    │    │  Project Table    │   │
│  │  Bar        │    │  Filters     │    │  with Pagination  │   │
│  └─────────────┘    └─────────────┘    └───────────────────┘   │
│         ▲                  ▲                    ▲               │
│         │                  │                    │               │
│  ┌─────────────┐    ┌─────────────┐    ┌───────────────────┐   │
│  │  Chatbot    │    │  Pipeline   │    │  Project Details  │   │
│  │  Interface  │    │  Controls   │    │  (Expandable)     │   │
│  └─────────────┘    └─────────────┘    └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

The application follows a unidirectional data flow pattern:

1. **Data Fetching**: API calls retrieve project data
2. **State Updates**: React state is updated with the fetched data
3. **Filtering/Sorting**: Data is processed based on user inputs
4. **Rendering**: UI components render the processed data
5. **User Interaction**: User actions trigger state updates, restarting the cycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  API Call   │────►│  State      │────►│  Filtering  │────►│  Rendering  │
│             │     │  Update     │     │  & Sorting  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       ▲                                                   │
       │                                                   │
       └───────────────────────────────────────────────────┘
                     User Interaction
```

## State Management

The application uses React's built-in state management with hooks:

```
┌─────────────────────────────────────────────────────────────────┐
│                      State Management                           │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌───────────────────┐   │
│  │  Project    │    │  Filter     │    │  UI State         │   │
│  │  Data       │    │  State      │    │  (Loading, etc.)  │   │
│  └─────────────┘    └─────────────┘    └───────────────────┘   │
│         ▲                  ▲                    ▲               │
│         │                  │                    │               │
│  ┌─────────────┐    ┌─────────────┐    ┌───────────────────┐   │
│  │  useEffect  │    │  useEffect  │    │  useEffect        │   │
│  │  Hooks      │    │  Hooks      │    │  Hooks            │   │
│  └─────────────┘    └─────────────┘    └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## API Integration

The application integrates with multiple backend services:

```
┌─────────────────────────────────────────────────────────────────┐
│                      API Integration                            │
│                                                                 │
│  ┌───────────────────┐    ┌───────────────────┐                │
│  │  Projects API     │    │  Error Handling   │                │
│  │  - GET /api/projects │  │  - Try/Catch     │                │
│  │  - JSON parsing   │    │  - User alerts    │                │
│  └───────────────────┘    └───────────────────┘                │
│           ▲                           ▲                         │
│           │                           │                         │
│  ┌───────────────────┐    ┌───────────────────┐                │
│  │  Pipeline API     │    │  Data Sanitization│                │
│  │  - Status check   │    │  - NaN handling   │                │
│  │  - Run pipeline   │    │  - Type conversion│                │
│  └───────────────────┘    └───────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

## Responsive Design Strategy

The application uses a mobile-first approach with responsive breakpoints:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Mobile     │     │  Tablet     │     │  Desktop    │     │  Large      │
│  (<640px)   │     │  (640-768px)│     │  (768-1024px)│     │  (>1024px) │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      ▲                   ▲                   ▲                   ▲
      │                   │                   │                   │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Truncated  │     │  Adjusted   │     │  Full       │     │  Expanded   │
│  Content    │     │  Layout     │     │  Layout     │     │  Layout     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Performance Considerations

The application implements several performance optimizations:

1. **Pagination**: Limits the number of rendered items
2. **Lazy Loading**: Loads data only when needed
3. **Memoization**: Prevents unnecessary re-renders
4. **Debounced Search**: Reduces API calls during typing
5. **Optimized Filtering**: Efficient filtering algorithms

## Security Considerations

The application follows these security practices:

1. **Input Sanitization**: Prevents XSS attacks
2. **Error Handling**: Prevents information leakage
3. **HTTPS**: Secure communication with backend
4. **Content Security Policy**: Restricts resource loading

## Deployment Architecture

The application can be deployed using various strategies:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Deployment Options                          │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌───────────────────┐   │
│  │  Vercel     │    │  Netlify     │    │  AWS Amplify      │   │
│  │  (Recommended)│  │             │    │                    │   │
│  └─────────────┘    └─────────────┘    └───────────────────┘   │
│         ▲                  ▲                    ▲               │
│         │                  │                    │               │
│  ┌─────────────┐    ┌─────────────┐    ┌───────────────────┐   │
│  │  CI/CD      │    │  Environment│    │  Monitoring       │   │
│  │  Pipeline   │    │  Variables  │    │  & Analytics      │   │
│  └─────────────┘    └─────────────┘    └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Future Architecture Considerations

For future scalability, consider:

1. **State Management Library**: Redux or Zustand for complex state
2. **API Client**: React Query for better data fetching
3. **Component Library**: More structured component organization
4. **Testing Framework**: Jest and React Testing Library
5. **Internationalization**: i18n for multiple languages
6. **Accessibility**: ARIA attributes and keyboard navigation 