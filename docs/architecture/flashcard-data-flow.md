---
layout: default
title: Flashcard Data Flow
---

# Flashcard Data Flow

The flashcard data flow describes how flashcard data is created, stored, retrieved, and updated throughout the BlendSphere application. This is a central process in the application that connects multiple components and services.

## Flashcard Data Flow Diagram

![Flashcard Data Flow](../diagrams/images/Flashcard%20Data%20Flow.png)

_Note: This diagram may need updates to reflect the batch creation process described below._

## Data Flow Process

### Flashcard Creation (Updated for Batch Table UI)

1.  **User Interaction (Flashcard Creator UI)**:
    *   **Step 1: Select Template**: User chooses a template.
    *   **Step 2: Create & Refine Cards (Table Interface)**:
        *   User adds rows manually or by pasting text.
        *   User inputs data into designated "input" cells for each flashcard row.
        *   User optionally provides a "Batch Context" for AI generation.
        *   User clicks "[Generate AI for All Eligible Rows]".
    *   **Step 3: Save to Deck**: User selects/creates a deck and saves the batch of cards.

2.  **Data Processing (Frontend)**:
    *   **AI Batch Request Preparation**: Frontend gathers data from all eligible rows (input fields) and the "Batch Context".
    *   A single request is made to the FastAPI AI service.
    *   **AI Batch Response Handling**: Frontend receives a batch response. AI-generated content populates corresponding cells in the table. Row-level errors are displayed.
    *   **Inline Refinement**: User reviews and edits content (both manual and AI-generated) directly in the table.
    *   **Feedback**: User provides 👍/👎/💬 feedback on AI-generated content.
    *   **Validation**: Content is validated against template field requirements.

3.  **Storage (Saving to Deck)**:
    *   User initiates save to a selected/new deck.
    *   Validated flashcard data (from all processed rows in the table) is sent to the PocketBase backend.
    *   PocketBase stores each flashcard, linking it to the user and the deck.
    *   Session data (current table state) might be auto-saved to local storage periodically.

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
  // Content structure will depend on the specific template fields.
  // It will be a map of field IDs/names to their values.
  fields: Record<string, any>; // e.g., { "spanish_word": "hola", "english_translation": "hello" }
  tags: string[];
  // mediaRefs might be less relevant if direct media upload is deferred in creator
  // srsData is typically initialized when card is first reviewed, not at creation for all fields.
  srsData: Partial<{
    state: 'new' | 'learning' | 'review' | 'relearning' | 'graduated';
    dueDate: string;
    interval: number;
    easeFactor: number;
    reviewCount: number;
    lapseCount: number;
  }>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  // Optional: Store AI generation feedback if needed at the card level
  aiFeedback?: Record<string, { rating?: 'good' | 'bad'; comment?: string }>; // fieldId: feedback
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
