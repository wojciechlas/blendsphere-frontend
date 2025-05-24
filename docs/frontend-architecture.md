---
layout: default
title: Frontend Architecture
---

# Frontend Architecture

The BlendSphere frontend is built with a modular, component-based architecture using Svelte 5. This architecture ensures scalability, maintainability, and performance.

## Architecture Diagram

![Frontend Architecture](images/Frontend%20Architecture.png)

## Key Components

### Core

- **App**: The main application component that bootstraps the entire frontend.
- **Router**: Handles client-side routing and navigation between pages.
- **Svelte Stores**: Manages application state using Svelte's built-in store mechanisms.
- **Authentication**: Handles user authentication and authorization.
- **API Client**: Communicates with the backend services.
- **Local Storage**: Manages data persistence in the browser.

### Pages

- **Dashboard**: The main user landing page after login.
- **Login/Register**: User authentication pages.
- **Templates**: Management of flashcard templates.
- **Decks**: Management of flashcard decks.
- **Flashcards**: Creation and editing of individual flashcards.
- **Review**: Flashcard review interface with SRS implementation.
- **Classes**: Management of educational classes.
- **Settings**: User preferences and application settings.

### Components

- **Navigation**: App-wide navigation components.
- **UI Kit**: Reusable UI components based on shadcn/svelte.
- **Forms**: Form components and validation logic.
- **Visualizations**: Data visualization components.
- **Flashcard Renderer**: Renders flashcards in various contexts.
- **AI Interface**: Interface components for AI interactions.

### Utils

- **SRS Algorithm**: Implementation of the spaced repetition algorithm.
- **Data Transformers**: Utilities for data transformation.
- **Error Handlers**: Centralized error handling.
- **Analytics**: User behavior tracking.
- **Localization**: Internationalization support.

## External Services

- **PocketBase API**: Backend service for core application data.
- **FastAPI AI Service**: Backend service for AI-related features.
- **Authentication Provider**: External authentication services.
- **GenAI Service**: External AI services for content generation.
- **Analytics Service**: External analytics services.

## State Management

BlendSphere uses Svelte's built-in store mechanisms for state management:

- **Writable stores** for mutable state
- **Readable stores** for derived state
- **Custom stores** for complex logic

The store structure includes:
- auth: User authentication state
- templates: Template definitions
- decks: User's flashcard decks
- flashcards: Individual flashcards
- reviews: Review history and statistics
- classes: Educational classes
- community: Community content
- ai: AI service state and history
- ui: UI state (theme, preferences)

## UI Components

BlendSphere uses shadcn/svelte components which are:
- Based on Bits UI primitives
- Styled with Tailwind CSS
- Accessible by default (WCAG compliant)
- Themeable via CSS variables
- Component variants via tailwind-variants

## API Client

The API client features:
- Automatic token management
- Request/response interceptors
- Error handling and retry logic
- Request cancellation
- Cache management
- Offline support with request queuing
- Separate clients for PocketBase and FastAPI backends
