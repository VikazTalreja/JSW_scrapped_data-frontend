# JSW Steel Projects - Pipeline Flowchart

## Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                      DATA ACQUISITION PIPELINE                              │
│                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  search_news_with_crawl4ai()                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. Configure crawler settings                                          │ │
│  │ 2. Define hooks for better page loading                                │ │
│  │ 3. Execute crawler on news sources and search engines                  │ │
│  │ 4. Parse HTML content                                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  extract_with_gemini()                 ┌───────────────────────────────┐    │
│  ┌───────────────────────────────────►│ LLM: Gemini 2.0 Flash         │    │
│  │                                    │ Purpose: Extract contract news │    │
│  │                                    │ from crawled web content       │    │
│  │                                    └───────────────────────────────┘    │
│  │                                                                          │
│  │ 1. Format prompt with content                                           │
│  │ 2. Call Gemini API                                                      │
│  │ 3. Parse JSON response                                                  │
│  │ 4. Convert to ContractNews objects                                      │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  save_contract_news_to_csv()                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. Write header row                                                    │ │
│  │ 2. Write data rows                                                     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                     QUALIFICATION PIPELINE                                  │
│                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  NewsQualificationPipeline.process_news()                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. Initialize AI models (DeepSeek or Gemini)                           │ │
│  │ 2. Process each news item                                              │ │
│  │ 3. Save qualified news                                                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  _check_headline_duplicate()            ┌───────────────────────────────┐   │
│  ┌───────────────────────────────────►│ LLM: DeepSeek Reasoner OR     │   │
│  │                                    │ Gemini 2.0 Flash              │   │
│  │                                    │ Purpose: Detect duplicate      │   │
│  │                                    │ headlines                      │   │
│  │                                    └───────────────────────────────┘   │
│  │                                                                         │
│  │ 1. Format prompt with existing headlines                                │
│  │ 2. Call AI model with fallback logic                                    │
│  │ 3. Parse "DUPLICATE" or "UNIQUE" response                               │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  _qualify_news_content()               ┌───────────────────────────────┐    │
│  ┌───────────────────────────────────►│ LLM: DeepSeek Reasoner OR     │    │
│  │                                    │ Gemini 2.0 Flash              │    │
│  │                                    │ Purpose: Determine if news     │    │
│  │                                    │ is worth sending to sales      │    │
│  │                                    └───────────────────────────────┘    │
│  │                                                                          │
│  │ 1. Format prompt with news details                                       │
│  │ 2. Call AI model with fallback logic                                     │
│  │ 3. Parse JSON response with qualification results                         │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  _save_qualified_news()                                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. Format data with qualification results                              │ │
│  │ 2. Save to CSV file                                                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                     FRONTEND DISPLAY                                        │
│                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Next.js Frontend (page.js)                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. Display qualified leads in dashboard                                │ │
│  │ 2. Provide filtering and sorting                                       │ │
│  │ 3. Enable chatbot interface                                            │ │
│  │ 4. Display project details                                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Function Details and LLM Usage

### 1. Data Acquisition Phase

#### `search_news_with_crawl4ai()`
- **Purpose**: Crawl multiple news sources to find contract news
- **Technology**: Uses Crawl4AI with AsyncWebCrawler and custom hooks
- **Sources**: Economic Times, Construction World, Google News, etc.
- **LLM Used**: None (pure web crawling)
- **Process**:
  - Configures crawler settings
  - Defines hooks for better page loading (scroll handling, button clicks)
  - Executes crawler on news sources
  - Returns raw HTML content

#### `extract_with_gemini()`
- **Purpose**: Extract structured information from raw HTML content
- **Technology**: LangChain with Google Generative AI
- **LLM Used**: Gemini 2.0 Flash
- **Process**:
  - Formats prompt with date range and source URL
  - Sends prompt with HTML content to Gemini
  - Parses JSON response to extract contract information
  - Converts to ContractNews objects

#### `save_contract_news_to_csv()`
- **Purpose**: Save extracted news to CSV for persistence
- **Technology**: Python CSV module
- **LLM Used**: None (data storage)
- **Process**:
  - Writes header row with field names
  - Writes data rows for each news item

### 2. Qualification Phase

#### `NewsQualificationPipeline.process_news()`
- **Purpose**: Coordinate the qualification of news items
- **Technology**: Async Python
- **LLM Used**: None (orchestration)
- **Process**:
  - Initializes AI models (DeepSeek or Gemini)
  - Processes each news item through checks
  - Saves qualified news

#### `_check_headline_duplicate()`
- **Purpose**: Detect if headline has been seen before
- **Technology**: LangChain with AI model
- **LLM Used**: DeepSeek Reasoner (primary) or Gemini 2.0 Flash (fallback)
- **Process**:
  - Formats prompt with existing headlines and new headline
  - Sends to AI with fallback logic
  - Parses "DUPLICATE" or "UNIQUE" response

#### `_qualify_news_content()`
- **Purpose**: Determine if news is worth sending to sales team
- **Technology**: LangChain with AI model
- **LLM Used**: DeepSeek Reasoner (primary) or Gemini 2.0 Flash (fallback)
- **Process**:
  - Formats prompt with news details
  - Sends to AI with fallback logic
  - Parses JSON response with qualification results

#### `_save_qualified_news()`
- **Purpose**: Save qualified news items
- **Technology**: Python CSV module
- **LLM Used**: None (data storage)
- **Process**:
  - Formats data with qualification results
  - Saves to CSV file

### 3. Frontend Display

#### Next.js Frontend (page.js)
- **Purpose**: Display qualified leads and provide UI
- **Technology**: Next.js, React, Material-UI
- **LLM Used**: None (display only)
- **Process**:
  - Fetches qualified leads from API
  - Provides filtering and sorting functionality
  - Displays leads in a user-friendly dashboard
  - Enables chatbot interface for user interactions

## LLMs Summary

| LLM | Functions | Purpose |
|-----|-----------|---------|
| Gemini 2.0 Flash | `extract_with_gemini()` | Extract structured contract news from web content |
| Gemini 2.0 Flash | `_check_headline_duplicate()` | Fallback for headline deduplication |
| Gemini 2.0 Flash | `_qualify_news_content()` | Fallback for news qualification |
| DeepSeek Reasoner | `_check_headline_duplicate()` | Primary for headline deduplication |
| DeepSeek Reasoner | `_qualify_news_content()` | Primary for news qualification | 