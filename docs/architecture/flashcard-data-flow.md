---
layout: default
title: Flashcard Data Flow
---

# Flashcard Data Flow

The flashcard data flow describes how flashcard data is created, stored, retrieved, and updated throughout the BlendSphere application. This is a central process in the application that connects multiple components and services.

## Flashcard Data Flow Diagram

![Flashcard Data Flow](images/Flashcard%20Data%20Flow.png)

## Data Flow Process

### Flashcard Creation

1. **User Input**:

   - Manual creation through forms
   - Bulk import from external files
   - AI-assisted generation from text

2. **Data Processing**:

   - Validation of content
   - Formatting and standardization
   - Media processing (images, audio)
   - Template application

3. **Storage**:
   - Local storage for immediate access
   - Backend database for persistence
   - Sync between devices

### Flashcard Retrieval

1. **Query Parameters**:

   - Deck selection
   - SRS due date filtering
   - Search and filtering

2. **Data Loading**:

   - Batched loading for performance
   - Caching for frequently accessed cards
   - Prefetching for smoother experience

3. **Presentation**:
   - Rendering based on template
   - Media loading and optimization
   - Accessibility considerations

### Review Process

1. **Session Initialization**:

   - Loading due cards based on SRS algorithm
   - Prioritization of cards
   - Session metrics initialization

2. **User Interaction**:

   - Card presentation
   - User response collection
   - Performance rating

3. **Data Update**:

   - SRS scheduling update
   - Performance history recording
   - Statistics calculation

4. **Synchronization**:
   - Immediate local update
   - Background sync with backend
   - Conflict resolution for multi-device usage

## Data Models

### Flashcard

```typescript
interface Flashcard {
	id: string;
	deckId: string;
	templateId: string;
	content: {
		front: ContentBlock[];
		back: ContentBlock[];
		hints?: ContentBlock[];
		notes?: string;
	};
	tags: string[];
	mediaRefs: string[];
	srsData: {
		state: 'new' | 'learning' | 'review' | 'relearning' | 'graduated';
		dueDate: string;
		interval: number;
		easeFactor: number;
		reviewCount: number;
		lapseCount: number;
	};
	createdAt: string;
	updatedAt: string;
	createdBy: string;
}
```

### Review Record

```typescript
interface ReviewRecord {
	id: string;
	flashcardId: string;
	userId: string;
	sessionId: string;
	rating: 1 | 2 | 3 | 4 | 5;
	timeSpent: number; // milliseconds
	previousInterval: number;
	newInterval: number;
	previousEaseFactor: number;
	newEaseFactor: number;
	timestamp: string;
}
```

## Offline Support

BlendSphere provides robust offline support for flashcard operations:

1. **Local Storage**:

   - All active decks and due cards are cached locally
   - New cards created offline are stored locally

2. **Synchronization Queue**:

   - Changes made offline are queued for sync
   - Sync occurs automatically when connection is restored

3. **Conflict Resolution**:
   - Timestamp-based resolution for simple conflicts
   - User prompt for complex conflicts
   - Preservation of all data versions when needed

## Performance Considerations

- **Lazy Loading**: Cards are loaded in batches to improve performance
- **Image Optimization**: Images are optimized for different device capabilities
- **Caching Strategy**: Frequently accessed cards are cached for quick access
- **Background Processing**: Heavy operations like media processing happen in background threads
