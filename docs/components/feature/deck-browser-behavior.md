# Deck Browser Behavior Documentation

---
component: DeckBrowser
type: component-behavior
category: Feature
version: 1.0.0
dependencies:
  - deck-management
  - flashcard-management
  - srs-system
context_tags:
  - deck-browser
  - user-interface
  - component-behavior
  - svelte5
last_updated: 2025-06-06
ai_context: |
  Behavior specifications for three-column deck browser with interactive navigation.
  Covers user interactions, state management, and component communication patterns.
---

## Component Overview

**Purpose**: Define the behavioral specifications for the Deck Browser feature, including user interactions, state transitions, and component communication patterns.

**Category**: Feature Component Behavior
**Usage Context**: Main deck browsing and flashcard exploration interface

## Behavioral Specifications

### 1. Layout Behavior

#### 1.1 Responsive Layout Transitions

**Desktop Layout (≥1024px)**:
```
┌─────────────┬─────────────┬──────────────────────────┐
│    Deck     │  Flashcard  │        Flashcard         │
│    List     │    List     │          Preview         │
│             │             │                          │
│  - Deck 1   │  - Card 1   │       ┌─────────┐        │
│  - Deck 2   │  - Card 2   │       │ Content │        │
│  - Deck 3   │  - Card 3   │       │ Preview │        │
│             │             │       └─────────┘        │
│             │             │         Metadata         │
└─────────────┴─────────────┴──────────────────────────┘
```

**Tablet Layout (768px - 1023px)**:
```
┌─────────────┬─────────────┐
│    Deck     │  Flashcard  │
│    List     │    List     │
│             │             │
│  - Deck 1   │  - Card 1   │
│  - Deck 2   │  - Card 2   │
│  - Deck 3   │  - Card 3   │
└─────────────┴─────────────┘
        ↓ (Modal/Overlay)
┌─────────────────────────────┐
│      Flashcard Preview      │
│                             │
│        ┌─────────┐          │
│        │ Content │          │
│        │ Preview │          │
│        └─────────┘          │
│         Metadata            │
└─────────────────────────────┘
```

**Mobile Layout (<768px)**:
```
┌─────────────┐
│    Deck     │
│    List     │
│             │
│  - Deck 1   │
│  - Deck 2   │
│  - Deck 3   │
└─────────────┘
       ↓ (Navigation)
┌─────────────┐
│  Flashcard  │
│    List     │
│             │
│  - Card 1   │
│  - Card 2   │
│  - Card 3   │
└─────────────┘
       ↓ (Navigation)
┌─────────────┐
│  Flashcard  │
│   Preview   │
│             │
│ ┌─────────┐ │
│ │ Content │ │
│ │ Preview │ │
│ └─────────┘ │
│   Metadata  │
└─────────────┘
```

#### 1.2 Column Interaction Behavior

**State Management**:
```typescript
interface DeckBrowserState {
  // Layout state
  currentView: 'decks' | 'flashcards' | 'preview';
  isMobile: boolean;
  
  // Selection state
  selectedDeckId: string | null;
  selectedFlashcardId: string | null;
  
  // Data state
  decks: DeckWithStats[];
  flashcards: FlashcardWithSRS[];
  
  // UI state
  deckListScrollPosition: number;
  flashcardListScrollPosition: number;
  previewScrollPosition: number;
}
```

**Behavioral Rules**:
1. **Desktop**: All three columns always visible, selections update adjacent columns
2. **Tablet**: Deck + Flashcard list visible, preview opens as modal/overlay
3. **Mobile**: Single column navigation with breadcrumb-style back navigation

### 2. Deck List Behavior

#### 2.1 Deck Loading and Display

**Initial Load Sequence**:
```typescript
// Load behavior pattern
async function initializeDeckBrowser() {
  // 1. Show loading skeleton
  showLoadingSkeleton();
  
  // 2. Load user decks with statistics
  try {
    const decks = await deckBrowserService.getUserDecksWithStats(userId);
    updateDeckList(decks);
  } catch (error) {
    showErrorState('Failed to load decks');
  }
  
  // 3. Auto-select first deck if available
  if (decks.length > 0 && !selectedDeckId) {
    selectDeck(decks[0]);
  }
  
  hideLoadingSkeleton();
}
```

**Loading States**:
- **Initial Load**: Skeleton placeholders for 5-6 deck cards
- **Refresh**: Subtle loading indicator at top of list
- **Error**: Error message with retry button
- **Empty**: Helpful message with "Create Deck" call-to-action

#### 2.2 Deck Selection Behavior

**Selection Interaction**:
```svelte
<script lang="ts">
  function handleDeckClick(deck: DeckWithStats, event: MouseEvent) {
    // Prevent double-selection
    if (selectedDeckId === deck.id) return;
    
    // Update selection state
    selectedDeckId = deck.id;
    selectedFlashcardId = null; // Clear flashcard selection
    
    // Trigger flashcard loading
    loadFlashcardsForDeck(deck.id);
    
    // Analytics tracking
    trackDeckSelection(deck.id);
    
    // Accessibility announcement
    announceToScreenReader(`Selected deck: ${deck.name}`);
    
    // Dispatch selection event
    dispatch('deckSelect', { deck, deckId: deck.id });
  }
  
  function handleKeyboardNavigation(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectNextDeck();
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectPreviousDeck();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedDeckId) {
          const deck = decks.find(d => d.id === focusedDeckId);
          if (deck) handleDeckClick(deck, event);
        }
        break;
    }
  }
</script>
```

**Visual Feedback**:
- **Hover**: Subtle background color change, slight elevation
- **Selected**: Accent border, highlighted background, check icon
- **Focus**: Visible focus ring for keyboard navigation
- **Loading**: Disabled state with spinner for associated flashcard loading

#### 2.3 Search and Filter Behavior

**Search Implementation**:
```typescript
let searchQuery = $state('');
let searchResults = $state<DeckWithStats[]>([]);
let isSearching = $state(false);

// Debounced search to avoid excessive API calls
const debouncedSearch = debounce(async (query: string) => {
  if (query.length < 2) {
    searchResults = decks;
    return;
  }
  
  isSearching = true;
  try {
    searchResults = await deckBrowserService.searchDecks(query, userId);
  } catch (error) {
    console.error('Search failed:', error);
    searchResults = [];
  } finally {
    isSearching = false;
  }
}, 300);

// Reactive search execution
$effect(() => {
  debouncedSearch(searchQuery);
});
```

**Filter Behavior**:
```typescript
interface DeckFilters {
  status: 'all' | 'active' | 'archived';
  hasNewCards: boolean;
  hasDueCards: boolean;
  sortBy: 'name' | 'lastActivity' | 'cardCount' | 'completionRate';
  sortOrder: 'asc' | 'desc';
}

let filters = $state<DeckFilters>({
  status: 'active',
  hasNewCards: false,
  hasDueCards: false,
  sortBy: 'lastActivity',
  sortOrder: 'desc'
});

let filteredDecks = $derived(() => {
  let result = decks.filter(deck => {
    // Status filter
    if (filters.status === 'active' && deck.isArchived) return false;
    if (filters.status === 'archived' && !deck.isArchived) return false;
    
    // Card status filters
    if (filters.hasNewCards && deck.newCards === 0) return false;
    if (filters.hasDueCards && deck.dueCards === 0) return false;
    
    return true;
  });
  
  // Apply sorting
  return result.sort((a, b) => {
    const factor = filters.sortOrder === 'asc' ? 1 : -1;
    switch (filters.sortBy) {
      case 'name':
        return factor * a.name.localeCompare(b.name);
      case 'lastActivity':
        return factor * (a.lastActivityAt.getTime() - b.lastActivityAt.getTime());
      case 'cardCount':
        return factor * (a.flashcardCount - b.flashcardCount);
      case 'completionRate':
        return factor * (a.completionPercentage - b.completionPercentage);
      default:
        return 0;
    }
  });
});
```

### 3. Flashcard List Behavior

#### 3.1 Deck Summary Display

**Deck Header Behavior**:
```svelte
<script lang="ts">
  interface DeckSummaryDisplay {
    name: string;
    description?: string;
    totalCards: number;
    dueCards: number;
    newCards: number;
    completionPercentage: number;
    lastStudied?: Date;
    studyStreak: number;
  }
  
  let deckSummary = $derived<DeckSummaryDisplay | null>(() => {
    if (!selectedDeck) return null;
    
    return {
      name: selectedDeck.name,
      description: selectedDeck.description,
      totalCards: selectedDeck.flashcardCount,
      dueCards: selectedDeck.dueCards,
      newCards: selectedDeck.newCards,
      completionPercentage: selectedDeck.completionPercentage,
      lastStudied: selectedDeck.lastActivityAt,
      studyStreak: selectedDeck.studyStreak
    };
  });
  
  // Progress calculation for visual indicators
  let progressRings = $derived(() => {
    if (!deckSummary) return null;
    
    const masteredCards = deckSummary.totalCards - deckSummary.dueCards - deckSummary.newCards;
    const learningCards = deckSummary.dueCards;
    
    return {
      mastered: {
        value: masteredCards,
        percentage: (masteredCards / deckSummary.totalCards) * 100,
        color: 'success'
      },
      learning: {
        value: learningCards,
        percentage: (learningCards / deckSummary.totalCards) * 100,
        color: 'warning'
      },
      new: {
        value: deckSummary.newCards,
        percentage: (deckSummary.newCards / deckSummary.totalCards) * 100,
        color: 'info'
      }
    };
  });
</script>

<!-- Visual representation -->
<div class="deck-summary">
  <div class="deck-header">
    <h2>{deckSummary?.name}</h2>
    <p class="text-muted-foreground">{deckSummary?.description}</p>
  </div>
  
  <div class="deck-stats">
    <div class="progress-rings">
      {#if progressRings}
        <CircularProgress 
          value={progressRings.mastered.percentage}
          color="success"
          label="Mastered"
        />
        <CircularProgress 
          value={progressRings.learning.percentage}
          color="warning"
          label="Learning"
        />
        <CircularProgress 
          value={progressRings.new.percentage}
          color="info"
          label="New"
        />
      {/if}
    </div>
    
    <div class="stats-grid">
      <StatCard label="Total Cards" value={deckSummary?.totalCards} />
      <StatCard label="Due Today" value={deckSummary?.dueCards} />
      <StatCard label="Study Streak" value={deckSummary?.studyStreak} unit="days" />
    </div>
  </div>
</div>
```

#### 3.2 Flashcard Loading and Display

**Flashcard Loading States**:
```typescript
interface FlashcardListState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  flashcards: FlashcardWithSRS[];
  hasMore: boolean;
  currentPage: number;
}

let flashcardState = $state<FlashcardListState>({
  isLoading: false,
  hasError: false,
  flashcards: [],
  hasMore: false,
  currentPage: 0
});

async function loadFlashcardsForDeck(deckId: string) {
  flashcardState.isLoading = true;
  flashcardState.hasError = false;
  
  try {
    const result = await deckBrowserService.getDeckFlashcards(deckId, {
      page: 0,
      limit: FLASHCARDS_PER_PAGE,
      includeReviewData: true
    });
    
    flashcardState.flashcards = result.flashcards;
    flashcardState.hasMore = result.hasMore;
    flashcardState.currentPage = 0;
    
    // Auto-select first flashcard if available
    if (result.flashcards.length > 0) {
      selectFlashcard(result.flashcards[0]);
    }
  } catch (error) {
    flashcardState.hasError = true;
    flashcardState.errorMessage = error.message;
  } finally {
    flashcardState.isLoading = false;
  }
}
```

**Flashcard Display Patterns**:
```svelte
<script lang="ts">
  // Flashcard rendering with SRS status
  function getFlashcardStatusColor(flashcard: FlashcardWithSRS): string {
    switch (flashcard.srsState.state) {
      case 'new': return 'blue';
      case 'learning': return 'orange';
      case 'review': return 'green';
      case 'relearning': return 'red';
      default: return 'gray';
    }
  }
  
  function getFlashcardStatusLabel(flashcard: FlashcardWithSRS): string {
    switch (flashcard.srsState.state) {
      case 'new': return 'New';
      case 'learning': return 'Learning';
      case 'review': return 'Review';
      case 'relearning': return 'Relearning';
      default: return 'Unknown';
    }
  }
  
  function getDueDateLabel(flashcard: FlashcardWithSRS): string {
    if (!flashcard.srsState.nextDue) return 'Not scheduled';
    
    const now = new Date();
    const dueDate = flashcard.srsState.nextDue;
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  }
</script>
```

#### 3.3 Flashcard Selection Behavior

**Selection Interaction**:
```typescript
function handleFlashcardSelection(flashcard: FlashcardWithSRS, event: MouseEvent) {
  // Prevent re-selection of same flashcard
  if (selectedFlashcardId === flashcard.id) return;
  
  // Update selection state
  selectedFlashcardId = flashcard.id;
  
  // Scroll to flashcard if not visible
  scrollToFlashcard(flashcard.id);
  
  // Load detailed preview data
  loadFlashcardDetails(flashcard.id);
  
  // Track selection for analytics
  trackFlashcardView(flashcard.id);
  
  // Accessibility announcement
  announceToScreenReader(
    `Selected flashcard: ${getFlashcardPreviewText(flashcard)}`
  );
  
  // Dispatch selection event
  dispatch('flashcardSelect', { flashcard, flashcardId: flashcard.id });
}

// Keyboard navigation for flashcards
function handleFlashcardKeyboardNavigation(event: KeyboardEvent) {
  const currentIndex = flashcards.findIndex(f => f.id === selectedFlashcardId);
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectFlashcardByIndex(Math.min(currentIndex + 1, flashcards.length - 1));
      break;
    case 'ArrowUp':
      event.preventDefault();
      selectFlashcardByIndex(Math.max(currentIndex - 1, 0));
      break;
    case 'Enter':
      event.preventDefault();
      // Could trigger study mode or editing
      startStudySession(selectedFlashcardId);
      break;
  }
}
```

### 4. Flashcard Preview Behavior

#### 4.1 Content Rendering

**Template-Based Content Display**:
```typescript
interface FlashcardPreviewData {
  flashcard: FlashcardWithSRS;
  renderedContent: Record<string, RenderedField>;
  metadata: FlashcardMetadata;
  srsInformation: SRSDisplayData;
  reviewHistory: ReviewHistoryData;
}

// Content rendering based on template
function renderFlashcardContent(flashcard: FlashcardWithSRS): Record<string, RenderedField> {
  const rendered: Record<string, RenderedField> = {};
  
  flashcard.template.fields.forEach(field => {
    const fieldData = flashcard.data[field.name];
    
    switch (field.type) {
      case 'text':
        rendered[field.name] = {
          type: 'text',
          content: fieldData as string,
          formatted: formatTextContent(fieldData as string, field.formatting)
        };
        break;
      case 'image':
        rendered[field.name] = {
          type: 'image',
          content: fieldData as string,
          alt: field.altText || `Image for ${field.name}`,
          loading: 'lazy'
        };
        break;
      case 'audio':
        rendered[field.name] = {
          type: 'audio',
          content: fieldData as string,
          controls: true,
          preload: 'metadata'
        };
        break;
    }
  });
  
  return rendered;
}
```

**Preview Layout Behavior**:
```svelte
<script lang="ts">
  // Dynamic layout based on template configuration
  let previewLayout = $derived(() => {
    if (!selectedFlashcard) return null;
    
    const template = selectedFlashcard.template;
    const frontFields = template.fields.filter(f => f.side === 'front');
    const backFields = template.fields.filter(f => f.side === 'back');
    
    return {
      front: {
        fields: frontFields,
        layout: template.frontLayout || 'vertical'
      },
      back: {
        fields: backFields,
        layout: template.backLayout || 'vertical'
      }
    };
  });
  
  // Content sections organization
  let previewSections = $derived(() => {
    if (!selectedFlashcard) return [];
    
    return [
      {
        id: 'content',
        title: 'Card Content',
        component: 'FlashcardContent',
        props: { flashcard: selectedFlashcard, layout: previewLayout }
      },
      {
        id: 'metadata',
        title: 'Card Information',
        component: 'FlashcardMetadata',
        props: { flashcard: selectedFlashcard }
      },
      {
        id: 'srs',
        title: 'Learning Progress',
        component: 'SRSInformation',
        props: { srsState: selectedFlashcard.srsState }
      },
      {
        id: 'history',
        title: 'Review History',
        component: 'ReviewHistory',
        props: { history: selectedFlashcard.reviewHistory }
      }
    ];
  });
</script>

<div class="flashcard-preview">
  {#each previewSections as section (section.id)}
    <div class="preview-section" data-section={section.id}>
      <h3 class="section-title">{section.title}</h3>
      <svelte:component 
        this={section.component} 
        {...section.props}
      />
    </div>
  {/each}
</div>
```

#### 4.2 SRS Information Display

**SRS Metrics Visualization**:
```typescript
interface SRSDisplayData {
  difficulty: {
    value: number;
    level: 'easy' | 'medium' | 'hard' | 'very-hard';
    description: string;
  };
  stability: {
    value: number;
    formatted: string;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  retrievability: {
    value: number;
    percentage: string;
    confidence: 'high' | 'medium' | 'low';
  };
  state: {
    current: string;
    description: string;
    nextAction: string;
  };
  intervals: {
    last: number;
    next: number;
    progression: number[];
  };
}

function calculateSRSDisplayData(srsState: SRSState): SRSDisplayData {
  return {
    difficulty: {
      value: srsState.difficulty,
      level: getDifficultyLevel(srsState.difficulty),
      description: getDifficultyDescription(srsState.difficulty)
    },
    stability: {
      value: srsState.stability,
      formatted: formatStability(srsState.stability),
      trend: calculateStabilityTrend(srsState.stability, srsState.history)
    },
    retrievability: {
      value: srsState.retrievability,
      percentage: `${(srsState.retrievability * 100).toFixed(1)}%`,
      confidence: getRetrievabilityConfidence(srsState.retrievability)
    },
    state: {
      current: srsState.state,
      description: getStateDescription(srsState.state),
      nextAction: getNextActionDescription(srsState.state)
    },
    intervals: {
      last: srsState.lastInterval || 0,
      next: srsState.interval,
      progression: srsState.intervalHistory || []
    }
  };
}
```

#### 4.3 Review History Visualization

**Timeline Display**:
```svelte
<script lang="ts">
  interface ReviewHistoryData {
    totalReviews: number;
    correctReviews: number;
    accuracy: number;
    recentReviews: ReviewEvent[];
    performanceTrend: 'improving' | 'declining' | 'stable';
    studyPattern: StudyPatternData;
  }
  
  let reviewHistoryData = $derived<ReviewHistoryData>(() => {
    if (!selectedFlashcard) return null;
    
    const history = selectedFlashcard.reviewHistory;
    const totalReviews = history.length;
    const correctReviews = history.filter(r => r.rating >= 3).length;
    
    return {
      totalReviews,
      correctReviews,
      accuracy: totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0,
      recentReviews: history.slice(-10).reverse(),
      performanceTrend: calculatePerformanceTrend(history),
      studyPattern: analyzeStudyPattern(history)
    };
  });
  
  function formatReviewEvent(review: FlashcardReview): string {
    const timeAgo = formatDistanceToNow(review.reviewedAt);
    const rating = getRatingLabel(review.rating);
    return `${rating} • ${timeAgo}`;
  }
</script>

<div class="review-history">
  <div class="history-summary">
    <div class="stat">
      <span class="label">Total Reviews</span>
      <span class="value">{reviewHistoryData?.totalReviews || 0}</span>
    </div>
    <div class="stat">
      <span class="label">Accuracy</span>
      <span class="value">{reviewHistoryData?.accuracy.toFixed(1)}%</span>
    </div>
  </div>
  
  <div class="recent-reviews">
    <h4>Recent Reviews</h4>
    <div class="timeline">
      {#each reviewHistoryData?.recentReviews || [] as review (review.id)}
        <div class="timeline-item" class:correct={review.rating >= 3}>
          <div class="timeline-marker" />
          <div class="timeline-content">
            <span class="review-rating">{getRatingLabel(review.rating)}</span>
            <span class="review-time">{formatDistanceToNow(review.reviewedAt)}</span>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
```

### 5. State Management Behavior

#### 5.1 Global State Synchronization

**State Store Implementation**:
```typescript
// deck-browser.store.ts
import { writable, derived } from 'svelte/store';

interface DeckBrowserState {
  // Selection state
  selectedDeckId: string | null;
  selectedFlashcardId: string | null;
  
  // Data state
  decks: DeckWithStats[];
  flashcards: FlashcardWithSRS[];
  
  // UI state
  isLoading: {
    decks: boolean;
    flashcards: boolean;
    preview: boolean;
  };
  
  // Filter state
  deckFilters: DeckFilters;
  searchQuery: string;
  
  // Layout state
  viewMode: 'three-column' | 'two-column' | 'single-column';
  collapsedSections: string[];
}

export const deckBrowserState = writable<DeckBrowserState>({
  selectedDeckId: null,
  selectedFlashcardId: null,
  decks: [],
  flashcards: [],
  isLoading: {
    decks: false,
    flashcards: false,
    preview: false
  },
  deckFilters: {
    status: 'active',
    hasNewCards: false,
    hasDueCards: false,
    sortBy: 'lastActivity',
    sortOrder: 'desc'
  },
  searchQuery: '',
  viewMode: 'three-column',
  collapsedSections: []
});

// Derived stores for computed values
export const selectedDeck = derived(
  [deckBrowserState],
  ([$state]) => $state.decks.find(deck => deck.id === $state.selectedDeckId) || null
);

export const selectedFlashcard = derived(
  [deckBrowserState],
  ([$state]) => $state.flashcards.find(card => card.id === $state.selectedFlashcardId) || null
);

export const filteredDecks = derived(
  [deckBrowserState],
  ([$state]) => applyDeckFilters($state.decks, $state.deckFilters, $state.searchQuery)
);
```

#### 5.2 Real-time Updates

**PocketBase Subscription Behavior**:
```typescript
// Real-time subscription management
class DeckBrowserSubscriptions {
  private subscriptions: Map<string, () => void> = new Map();
  
  async subscribeToDecks(userId: string) {
    const unsubscribe = await pb.collection('decks').subscribe('*', (data) => {
      if (data.action === 'create' || data.action === 'update' || data.action === 'delete') {
        this.handleDeckUpdate(data);
      }
    }, `createdBy="${userId}" || sharedWith~"${userId}"`);
    
    this.subscriptions.set('decks', unsubscribe);
  }
  
  async subscribeToDeckFlashcards(deckId: string) {
    const unsubscribe = await pb.collection('flashcards').subscribe('*', (data) => {
      if (data.action === 'create' || data.action === 'update' || data.action === 'delete') {
        this.handleFlashcardUpdate(data);
      }
    }, `deckId="${deckId}"`);
    
    this.subscriptions.set(`flashcards-${deckId}`, unsubscribe);
  }
  
  private handleDeckUpdate(data: SubscriptionData) {
    deckBrowserState.update(state => {
      switch (data.action) {
        case 'create':
          state.decks.push(data.record as DeckWithStats);
          break;
        case 'update':
          const deckIndex = state.decks.findIndex(d => d.id === data.record.id);
          if (deckIndex !== -1) {
            state.decks[deckIndex] = { ...state.decks[deckIndex], ...data.record };
          }
          break;
        case 'delete':
          state.decks = state.decks.filter(d => d.id !== data.record.id);
          if (state.selectedDeckId === data.record.id) {
            state.selectedDeckId = null;
            state.flashcards = [];
            state.selectedFlashcardId = null;
          }
          break;
      }
      return state;
    });
  }
  
  cleanup() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }
}
```

### 6. Error Handling Behavior

#### 6.1 Error State Management

**Error Boundaries and Recovery**:
```typescript
interface ErrorState {
  type: 'network' | 'permission' | 'data' | 'unknown';
  message: string;
  retryable: boolean;
  context: string;
  timestamp: Date;
}

let errorState = $state<ErrorState | null>(null);

function handleError(error: Error, context: string) {
  const errorType = classifyError(error);
  
  errorState = {
    type: errorType,
    message: getErrorMessage(error, errorType),
    retryable: isRetryable(errorType),
    context,
    timestamp: new Date()
  };
  
  // Log error for debugging
  console.error(`Deck Browser Error [${context}]:`, error);
  
  // Track error analytics
  trackError(error, context);
  
  // Auto-recovery for certain error types
  if (errorType === 'network' && isRetryable(errorType)) {
    scheduleRetry(context, 3000); // Retry after 3 seconds
  }
}

function scheduleRetry(context: string, delay: number) {
  setTimeout(async () => {
    try {
      switch (context) {
        case 'deck-loading':
          await loadDecks();
          break;
        case 'flashcard-loading':
          if (selectedDeckId) {
            await loadFlashcardsForDeck(selectedDeckId);
          }
          break;
      }
      // Clear error state on successful retry
      errorState = null;
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    }
  }, delay);
}
```

#### 6.2 User Feedback and Recovery

**Error UI Behavior**:
```svelte
<script lang="ts">
  function getErrorIcon(errorType: string): string {
    switch (errorType) {
      case 'network': return 'wifi-off';
      case 'permission': return 'lock';
      case 'data': return 'database-x';
      default: return 'alert-circle';
    }
  }
  
  function getErrorActions(error: ErrorState): Array<{label: string, action: () => void}> {
    const actions = [];
    
    if (error.retryable) {
      actions.push({
        label: 'Retry',
        action: () => retryFailedOperation(error.context)
      });
    }
    
    if (error.type === 'permission') {
      actions.push({
        label: 'Check Permissions',
        action: () => navigateToPermissions()
      });
    }
    
    actions.push({
      label: 'Dismiss',
      action: () => errorState = null
    });
    
    return actions;
  }
</script>

{#if errorState}
  <div class="error-state" data-error-type={errorState.type}>
    <div class="error-icon">
      <Icon name={getErrorIcon(errorState.type)} size={24} />
    </div>
    <div class="error-content">
      <h3 class="error-title">
        {#if errorState.type === 'network'}
          Connection Problem
        {:else if errorState.type === 'permission'}
          Access Denied
        {:else if errorState.type === 'data'}
          Data Error
        {:else}
          Something Went Wrong
        {/if}
      </h3>
      <p class="error-message">{errorState.message}</p>
      <div class="error-actions">
        {#each getErrorActions(errorState) as action}
          <Button on:click={action.action} variant="outline">
            {action.label}
          </Button>
        {/each}
      </div>
    </div>
  </div>
{/if}
```

## Component Integration Patterns

### 1. Parent-Child Communication

**Event-Based Communication**:
```svelte
<!-- DeckBrowser.svelte - Parent Component -->
<script lang="ts">
  // Event handlers for child component communication
  function handleDeckSelect(event: CustomEvent<{deck: DeckWithStats}>) {
    const { deck } = event.detail;
    updateSelectedDeck(deck);
    loadFlashcardsForDeck(deck.id);
  }
  
  function handleFlashcardSelect(event: CustomEvent<{flashcard: FlashcardWithSRS}>) {
    const { flashcard } = event.detail;
    updateSelectedFlashcard(flashcard);
    loadFlashcardDetails(flashcard.id);
  }
  
  function handleError(event: CustomEvent<{error: Error, context: string}>) {
    const { error, context } = event.detail;
    handleError(error, context);
  }
</script>

<div class="deck-browser">
  <DeckList 
    {decks}
    {selectedDeckId}
    on:deckSelect={handleDeckSelect}
    on:error={handleError}
  />
  
  <FlashcardList
    {selectedDeck}
    {flashcards}
    {selectedFlashcardId}
    on:flashcardSelect={handleFlashcardSelect}
    on:error={handleError}
  />
  
  <FlashcardPreview
    {selectedFlashcard}
    on:error={handleError}
  />
</div>
```

### 2. Cross-Component State Synchronization

**Shared State Management**:
```typescript
// Cross-component state synchronization
export class DeckBrowserOrchestrator {
  private state = $state<DeckBrowserState>({...});
  
  // Deck selection with cascading updates
  async selectDeck(deck: DeckWithStats) {
    // Update deck selection
    this.state.selectedDeckId = deck.id;
    this.state.selectedFlashcardId = null;
    
    // Clear previous flashcards
    this.state.flashcards = [];
    this.state.isLoading.flashcards = true;
    
    try {
      // Load new flashcards
      const flashcards = await this.deckBrowserService.getDeckFlashcards(deck.id);
      this.state.flashcards = flashcards;
      
      // Auto-select first flashcard
      if (flashcards.length > 0) {
        await this.selectFlashcard(flashcards[0]);
      }
    } catch (error) {
      this.handleError(error, 'flashcard-loading');
    } finally {
      this.state.isLoading.flashcards = false;
    }
  }
  
  async selectFlashcard(flashcard: FlashcardWithSRS) {
    this.state.selectedFlashcardId = flashcard.id;
    this.state.isLoading.preview = true;
    
    try {
      // Load detailed flashcard data if needed
      const detailedFlashcard = await this.deckBrowserService.getFlashcardDetails(flashcard.id);
      
      // Update flashcard in state
      const index = this.state.flashcards.findIndex(f => f.id === flashcard.id);
      if (index !== -1) {
        this.state.flashcards[index] = detailedFlashcard;
      }
    } catch (error) {
      this.handleError(error, 'preview-loading');
    } finally {
      this.state.isLoading.preview = false;
    }
  }
}
```

## Accessibility Behavior

### 1. Keyboard Navigation

**Focus Management**:
```typescript
interface FocusState {
  activeColumn: 'decks' | 'flashcards' | 'preview';
  focusedDeckId: string | null;
  focusedFlashcardId: string | null;
  focusHistory: string[];
}

let focusState = $state<FocusState>({
  activeColumn: 'decks',
  focusedDeckId: null,
  focusedFlashcardId: null,
  focusHistory: []
});

function handleGlobalKeydown(event: KeyboardEvent) {
  // Global keyboard shortcuts
  switch (event.key) {
    case 'Tab':
      if (event.shiftKey) {
        moveFocusToPreviousColumn();
      } else {
        moveFocusToNextColumn();
      }
      break;
    case 'Escape':
      // Return to deck list on mobile
      if (isMobile && focusState.activeColumn !== 'decks') {
        focusState.activeColumn = 'decks';
        focusDeckList();
      }
      break;
    case '/':
      // Focus search input
      event.preventDefault();
      focusSearchInput();
      break;
  }
}

function announceStateChange(message: string) {
  // Update screen reader announcements
  const announcement = document.getElementById('sr-announcements');
  if (announcement) {
    announcement.textContent = message;
  }
}
```

### 2. Screen Reader Support

**ARIA Implementation**:
```svelte
<div 
  class="deck-browser"
  role="application"
  aria-label="Deck browser with three-column layout"
>
  <!-- Screen reader announcements -->
  <div 
    id="sr-announcements" 
    aria-live="polite" 
    aria-atomic="true"
    class="sr-only"
  ></div>
  
  <!-- Deck list column -->
  <div 
    class="deck-list-column"
    role="region"
    aria-label="Deck list"
  >
    <div 
      role="listbox"
      aria-label={`${decks.length} decks available`}
      aria-activedescendant={selectedDeckId}
    >
      {#each decks as deck (deck.id)}
        <div
          role="option"
          aria-selected={selectedDeckId === deck.id}
          aria-describedby={`deck-stats-${deck.id}`}
          id={`deck-${deck.id}`}
        >
          <h3>{deck.name}</h3>
          <div id={`deck-stats-${deck.id}`} class="sr-only">
            {deck.flashcardCount} flashcards, 
            {deck.dueCards} due today,
            last studied {formatDistanceToNow(deck.lastActivityAt)}
          </div>
        </div>
      {/each}
    </div>
  </div>
  
  <!-- Flashcard list column -->
  <div 
    class="flashcard-list-column"
    role="region"
    aria-label="Flashcard list for selected deck"
  >
    {#if selectedDeck}
      <div 
        role="listbox"
        aria-label={`${flashcards.length} flashcards in ${selectedDeck.name}`}
        aria-activedescendant={selectedFlashcardId}
      >
        {#each flashcards as flashcard (flashcard.id)}
          <div
            role="option"
            aria-selected={selectedFlashcardId === flashcard.id}
            aria-describedby={`flashcard-status-${flashcard.id}`}
            id={`flashcard-${flashcard.id}`}
          >
            <div class="flashcard-preview">
              {getFlashcardPreviewText(flashcard)}
            </div>
            <div id={`flashcard-status-${flashcard.id}`} class="sr-only">
              {getFlashcardStatusLabel(flashcard.srsState)},
              difficulty {flashcard.srsState.difficulty} out of 10,
              {getDueDateLabel(flashcard)}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <!-- Flashcard preview column -->
  <div 
    class="flashcard-preview-column"
    role="region"
    aria-label="Flashcard details and preview"
  >
    {#if selectedFlashcard}
      <div role="article" aria-labelledby="flashcard-title">
        <h2 id="flashcard-title" class="sr-only">
          Flashcard details for {getFlashcardPreviewText(selectedFlashcard)}
        </h2>
        <!-- Flashcard content with proper headings and structure -->
      </div>
    {/if}
  </div>
</div>
```

## Performance Optimization Behavior

### 1. Virtual Scrolling

**Large List Handling**:
```svelte
<script lang="ts">
  import { VirtualList } from '$lib/components/ui';
  
  // Virtual scrolling for large flashcard lists
  let virtualListHeight = 600;
  let itemHeight = 80;
  
  // Only render visible items
  $: visibleFlashcards = flashcards.slice(
    Math.max(0, scrollTop / itemHeight - 5),
    Math.min(flashcards.length, scrollTop / itemHeight + Math.ceil(virtualListHeight / itemHeight) + 5)
  );
</script>

<VirtualList
  items={flashcards}
  {itemHeight}
  height={virtualListHeight}
  let:item
  let:index
>
  <FlashcardListItem 
    flashcard={item}
    {index}
    selected={selectedFlashcardId === item.id}
    on:select={(e) => handleFlashcardSelect(e.detail.flashcard)}
  />
</VirtualList>
```

### 2. Data Caching and Prefetching

**Intelligent Caching Strategy**:
```typescript
class DeckBrowserCache {
  private deckCache = new Map<string, DeckWithStats>();
  private flashcardCache = new Map<string, FlashcardWithSRS[]>();
  private previewCache = new Map<string, FlashcardDetails>();
  
  // Cache with TTL
  private cacheTimestamps = new Map<string, number>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  async getDecks(userId: string): Promise<DeckWithStats[]> {
    const cacheKey = `decks-${userId}`;
    
    // Check cache validity
    if (this.isCacheValid(cacheKey)) {
      return this.deckCache.get(cacheKey) || [];
    }
    
    // Fetch fresh data
    const decks = await this.deckBrowserService.getUserDecksWithStats(userId);
    this.setCache(cacheKey, decks);
    
    return decks;
  }
  
  async prefetchFlashcards(deckId: string) {
    // Prefetch flashcards for selected deck
    if (!this.flashcardCache.has(deckId)) {
      const flashcards = await this.deckBrowserService.getDeckFlashcards(deckId);
      this.flashcardCache.set(deckId, flashcards);
      this.cacheTimestamps.set(deckId, Date.now());
    }
  }
  
  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    return timestamp ? (Date.now() - timestamp) < this.CACHE_TTL : false;
  }
  
  private setCache<T>(key: string, data: T) {
    this.cacheTimestamps.set(key, Date.now());
    // Type-safe cache setting based on key pattern
    if (key.startsWith('decks-')) {
      this.deckCache.set(key, data as DeckWithStats);
    } else if (key.startsWith('flashcards-')) {
      this.flashcardCache.set(key, data as FlashcardWithSRS[]);
    }
  }
}
```

## Mobile Responsiveness Behavior

### 1. Touch Interactions

**Touch-Optimized Navigation**:
```typescript
interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  swipeThreshold: number;
}

let touchState = $state<TouchState>({
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  isDragging: false,
  swipeThreshold: 50
});

function handleTouchStart(event: TouchEvent) {
  const touch = event.touches[0];
  touchState.startX = touch.clientX;
  touchState.startY = touch.clientY;
  touchState.isDragging = false;
}

function handleTouchMove(event: TouchEvent) {
  if (!event.touches[0]) return;
  
  const touch = event.touches[0];
  touchState.currentX = touch.clientX;
  touchState.currentY = touch.clientY;
  
  const deltaX = Math.abs(touchState.currentX - touchState.startX);
  const deltaY = Math.abs(touchState.currentY - touchState.startY);
  
  if (deltaX > 10 || deltaY > 10) {
    touchState.isDragging = true;
  }
}

function handleTouchEnd(event: TouchEvent) {
  if (!touchState.isDragging) return;
  
  const deltaX = touchState.currentX - touchState.startX;
  const deltaY = touchState.currentY - touchState.startY;
  
  // Horizontal swipe for column navigation
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > touchState.swipeThreshold) {
    if (deltaX > 0) {
      // Swipe right - go back
      navigateToParentColumn();
    } else {
      // Swipe left - go forward
      navigateToChildColumn();
    }
  }
  
  touchState.isDragging = false;
}
```

### 2. Adaptive Layout

**Breakpoint-Based Behavior**:
```typescript
interface ResponsiveState {
  screenWidth: number;
  screenHeight: number;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  columnCount: 1 | 2 | 3;
}

let responsiveState = $state<ResponsiveState>({
  screenWidth: 0,
  screenHeight: 0,
  breakpoint: 'desktop',
  orientation: 'portrait',
  columnCount: 3
});

// Reactive responsive behavior
$effect(() => {
  const width = responsiveState.screenWidth;
  
  if (width < 768) {
    responsiveState.breakpoint = 'mobile';
    responsiveState.columnCount = 1;
  } else if (width < 1024) {
    responsiveState.breakpoint = 'tablet';
    responsiveState.columnCount = 2;
  } else {
    responsiveState.breakpoint = 'desktop';
    responsiveState.columnCount = 3;
  }
});

// Adaptive navigation behavior
function navigateBasedOnBreakpoint(target: 'decks' | 'flashcards' | 'preview') {
  switch (responsiveState.breakpoint) {
    case 'mobile':
      // Single-column navigation
      showSingleColumn(target);
      break;
    case 'tablet':
      // Two-column with modal preview
      if (target === 'preview') {
        showPreviewModal();
      } else {
        showTwoColumns(target);
      }
      break;
    case 'desktop':
      // Three-column simultaneous view
      updateColumnSelection(target);
      break;
  }
}
```

This comprehensive behavior documentation provides detailed specifications for implementing the Deck Browser feature with proper user interactions, state management, and responsive design patterns. The documentation follows the established patterns and provides clear guidance for AI-assisted development.

## Related Documentation

### Requirements
- [Deck Browser Requirements](../requirements/deck-browser.requirements.md)
- [Template System Requirements](../requirements/template-system.requirements.md)
- [Review Session Requirements](../requirements/review-session.requirements.md)

### Architecture
- [Data Structure](../architecture/data-structure.md)
- [Frontend Architecture](../architecture/frontend-architecture.md)
- [SRS Algorithm](../architecture/srs-algorithm.md)

### API Documentation
- [PocketBase Integration](../api/pocketbase-integration.md)
- [Deck Service API](../api/deck-service.md)
- [Flashcard Service API](../api/flashcard-service.md)

### User Stories
- [User Journeys](../user-stories/user-journeys.md)
- [Deck Management Workflows](../user-stories/deck-management-workflows.md)
