# Deck Browser Requirements

---
component: DeckBrowser
type: requirements
version: 1.0.0
dependencies:
  - deck-management
  - flashcard-management
  - srs-system
context_tags:
  - deck-browser
  - flashcard-preview
  - user-interface
  - pocketbase
last_updated: 2025-06-06
ai_context: |
  Three-column layout for browsing decks and flashcards with detailed preview.
  PocketBase integration for deck and flashcard data.
  Svelte 5 with shadcn-svelte components.
---

## 1. Overview

### 1.1 Purpose

The Deck Browser provides users with a comprehensive interface to browse, explore, and manage their flashcard decks and individual flashcards. The page implements a three-column layout that allows efficient navigation from deck selection to flashcard preview.

### 1.2 Scope

**Included:**
- Three-column responsive layout
- Deck listing with filtering and search
- Flashcard listing with deck details
- Detailed flashcard preview with metadata
- SRS (Spaced Repetition System) information display
- Real-time data updates

**Excluded:**
- Flashcard editing (separate feature)
- Deck creation/modification (separate feature)
- Study session initiation (separate feature)

### 1.3 Dependencies

**Frontend:**
- `DeckBrowser.svelte` - Main page component
- `DeckList.svelte` - Left column deck listing
- `FlashcardList.svelte` - Middle column flashcard listing
- `FlashcardPreview.svelte` - Right column flashcard preview
- `$lib/services/deck.service.ts` - Deck management service
- `$lib/services/flashcard.service.ts` - Flashcard management service
- `$lib/stores/deck.store.ts` - Deck state management
- `$lib/types/deck.ts` - Deck type definitions
- `$lib/types/flashcard.ts` - Flashcard type definitions

**Backend:**
- PocketBase collections: `decks`, `flashcards`, `flashcard_reviews`
- PocketBase real-time subscriptions for live updates

**External:**
- shadcn-svelte components for UI consistency
- @tabler/icons-svelte for iconography

## 2. Functional Requirements

### 2.1 Layout and Navigation

#### REQ-DB-001: Three-Column Layout

**Priority**: P0 (Critical)
**Component**: DeckBrowser
**Dependencies**: ResponsiveLayout

**Description**:
The page must implement a responsive three-column layout that adapts to different screen sizes while maintaining usability.

**AI Context**:
- Layout type: CSS Grid with responsive breakpoints
- Component structure: Parent container with three child sections
- UI library: shadcn-svelte layout components
- Responsive behavior: Stack columns on mobile, side-by-side on desktop

**Acceptance Criteria**:
1. Three distinct columns visible on desktop (≥1024px width)
2. Progressive collapse on tablet and mobile
3. Smooth transitions between layout states
4. Proper spacing and visual hierarchy
5. Accessible navigation between columns

**Implementation Hints**:
```svelte
<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
  <div class="lg:col-span-1">
    <DeckList {selectedDeckId} on:deckSelect={handleDeckSelect} />
  </div>
  <div class="lg:col-span-1">
    <FlashcardList {selectedDeck} {selectedFlashcardId} on:flashcardSelect={handleFlashcardSelect} />
  </div>
  <div class="lg:col-span-1">
    <FlashcardPreview {selectedFlashcard} />
  </div>
</div>
```

### 2.2 Deck Management

#### REQ-DB-002: Deck Listing

**Priority**: P0 (Critical)
**Component**: DeckList
**Dependencies**: DeckService, DeckStore

**Description**:
Display a comprehensive list of user's decks with essential information and filtering capabilities.

**AI Context**:
- Data source: PocketBase decks collection
- State management: Svelte stores with reactive updates
- UI pattern: Scrollable list with selection states
- Filtering: Text search and category filters

**Acceptance Criteria**:
1. Display all user-owned and shared decks
2. Show deck name, description, flashcard count, and last activity
3. Implement search functionality
4. Support filtering by deck status (active, archived)
5. Visual indication of selected deck
6. Real-time updates when decks are modified

**Implementation Hints**:
```typescript
// Deck store pattern
let decks = $state<Deck[]>([]);
let selectedDeckId = $state<string | null>(null);
let searchQuery = $state('');
let filteredDecks = $derived(
  decks.filter(deck => 
    deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )
);

// PocketBase integration
const deckService = new DeckService();
decks = await deckService.getUserDecks(userId);
```

#### REQ-DB-003: Deck Selection

**Priority**: P0 (Critical)
**Component**: DeckList
**Dependencies**: DeckStore

**Description**:
Allow users to select a deck to view its flashcards, with clear visual feedback and state management.

**AI Context**:
- Event handling: Custom Svelte events for deck selection
- State management: Reactive deck selection state
- UI feedback: Active/selected states with visual indicators

**Acceptance Criteria**:
1. Single-click deck selection
2. Clear visual indication of selected deck
3. Automatic flashcard loading for selected deck
4. Preserve selection state during navigation
5. Keyboard navigation support (arrow keys, Enter)

**Implementation Hints**:
```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  let selectedDeckId = $state<string | null>(null);
  const dispatch = createEventDispatcher<{
    deckSelect: { deckId: string; deck: Deck };
  }>();
  
  function handleDeckClick(deck: Deck) {
    selectedDeckId = deck.id;
    dispatch('deckSelect', { deckId: deck.id, deck });
  }
</script>
```

### 2.3 Flashcard Management

#### REQ-DB-004: Flashcard Listing with Deck Details

**Priority**: P0 (Critical)
**Component**: FlashcardList
**Dependencies**: FlashcardService, DeckStore

**Description**:
Display flashcards for the selected deck with deck summary information and flashcard metadata.

**AI Context**:
- Data structure: Deck details + flashcard array
- UI pattern: Header with deck info + scrollable flashcard list
- State management: Reactive flashcard loading based on deck selection
- Performance: Virtual scrolling for large flashcard sets

**Acceptance Criteria**:
1. Display deck name, description, and statistics at top
2. Show total flashcard count, due cards, and completion percentage
3. List all flashcards with preview information
4. Display flashcard status (new, learning, review, mastered)
5. Show due date and SRS interval for each card
6. Support sorting by various criteria (due date, difficulty, creation date)

**Implementation Hints**:
```typescript
interface DeckSummary {
  totalCards: number;
  dueCards: number;
  newCards: number;
  learningCards: number;
  masteredCards: number;
  averageDifficulty: number;
  completionPercentage: number;
}

let deckSummary = $derived<DeckSummary>(() => {
  if (!selectedDeck || !flashcards) return null;
  return calculateDeckSummary(selectedDeck, flashcards);
});
```

#### REQ-DB-005: Flashcard Selection

**Priority**: P0 (Critical)
**Component**: FlashcardList
**Dependencies**: FlashcardStore

**Description**:
Enable users to select individual flashcards for detailed preview in the third column.

**AI Context**:
- Event handling: Flashcard selection events
- State management: Selected flashcard state
- UI feedback: Active selection indicators

**Acceptance Criteria**:
1. Single-click flashcard selection
2. Visual indication of selected flashcard
3. Automatic preview loading in third column
4. Keyboard navigation support
5. Maintain selection when switching between decks

**Implementation Hints**:
```svelte
<script lang="ts">
  let selectedFlashcardId = $state<string | null>(null);
  
  function handleFlashcardSelect(flashcard: Flashcard) {
    selectedFlashcardId = flashcard.id;
    dispatch('flashcardSelect', { flashcardId: flashcard.id, flashcard });
  }
</script>
```

### 2.4 Flashcard Preview

#### REQ-DB-006: Detailed Flashcard Preview

**Priority**: P0 (Critical)
**Component**: FlashcardPreview
**Dependencies**: FlashcardService, ReviewService

**Description**:
Display comprehensive information about the selected flashcard including content, metadata, and SRS parameters.

**AI Context**:
- Data structure: Flashcard with embedded review history and SRS state
- UI pattern: Card-based layout with multiple information sections
- Content rendering: Template-based flashcard content display

**Acceptance Criteria**:
1. Display flashcard content based on template structure
2. Show creation date, last modified date, and creator information
3. Display review statistics (total reviews, correct/incorrect ratio)
4. Show SRS parameters (difficulty, stability, retrievability)
5. Display last review date and next due date
6. Show review history timeline
7. Include template information and field details

**Implementation Hints**:
```typescript
interface FlashcardMetadata {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  totalReviews: number;
  correctReviews: number;
  incorrectReviews: number;
  lastReviewDate: Date | null;
  nextDueDate: Date | null;
  srsState: {
    difficulty: number;
    stability: number;
    retrievability: number;
    state: 'new' | 'learning' | 'review' | 'relearning';
  };
  template: {
    name: string;
    fields: TemplateField[];
  };
}
```

#### REQ-DB-007: SRS Information Display

**Priority**: P1 (High)
**Component**: FlashcardPreview
**Dependencies**: SRSService

**Description**:
Present detailed Spaced Repetition System information in an understandable format for users.

**AI Context**:
- Data visualization: Progress bars, charts for SRS metrics
- UI components: Information cards with tooltips
- Educational content: Explanatory text for SRS concepts

**Acceptance Criteria**:
1. Display difficulty level with visual indicator
2. Show stability value with explanation
3. Present retrievability percentage
4. Indicate current SRS state (new, learning, review, relearning)
5. Show interval progression history
6. Provide tooltips explaining SRS concepts

**Implementation Hints**:
```svelte
<div class="srs-info-section">
  <div class="srs-metric">
    <Label>Difficulty</Label>
    <Progress value={flashcard.difficulty} max={10} />
    <Tooltip>
      <p>Card difficulty affects review intervals. Higher difficulty means more frequent reviews.</p>
    </Tooltip>
  </div>
  
  <div class="srs-metric">
    <Label>Stability (days)</Label>
    <Badge variant="outline">{flashcard.stability.toFixed(1)}</Badge>
  </div>
</div>
```

## 3. Technical Specifications

### 3.1 Data Structures

```typescript
// Core deck interface
interface Deck {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  isArchived: boolean;
  flashcardCount: number;
  lastActivityAt: Date;
  tags: string[];
  color?: string;
}

// Extended deck with statistics
interface DeckWithStats extends Deck {
  dueCards: number;
  newCards: number;
  learningCards: number;
  masteredCards: number;
  averageDifficulty: number;
  completionPercentage: number;
  studyStreak: number;
}

// Flashcard with SRS state
interface FlashcardWithSRS extends Flashcard {
  srsState: {
    difficulty: number;
    stability: number;
    retrievability: number;
    state: 'new' | 'learning' | 'review' | 'relearning';
    lastReview?: Date;
    nextDue?: Date;
    interval: number;
    lapses: number;
  };
  reviewHistory: FlashcardReview[];
  template: Template;
}
```

### 3.2 API Integration

```typescript
// Deck service integration
export class DeckBrowserService {
  private deckService: DeckService;
  private flashcardService: FlashcardService;
  private pb: PocketBase;

  async getUserDecksWithStats(userId: string): Promise<DeckWithStats[]> {
    const decks = await this.deckService.getUserDecks(userId);
    return Promise.all(
      decks.map(async (deck) => {
        const stats = await this.calculateDeckStats(deck.id);
        return { ...deck, ...stats };
      })
    );
  }

  async getDeckFlashcards(deckId: string): Promise<FlashcardWithSRS[]> {
    const flashcards = await this.flashcardService.getDeckFlashcards(deckId);
    return Promise.all(
      flashcards.map(async (flashcard) => {
        const srsState = await this.getSRSState(flashcard.id);
        const reviewHistory = await this.getReviewHistory(flashcard.id);
        const template = await this.getTemplate(flashcard.templateId);
        return { ...flashcard, srsState, reviewHistory, template };
      })
    );
  }

  private async calculateDeckStats(deckId: string): Promise<DeckStats> {
    // Implementation for calculating deck statistics
  }
}
```

### 3.3 Component Architecture

```svelte
<!-- src/routes/decks/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { DeckList, FlashcardList, FlashcardPreview } from '$lib/components/deck-browser';
  import { deckBrowserService } from '$lib/services';
  import type { DeckWithStats, FlashcardWithSRS } from '$lib/types';

  let decks = $state<DeckWithStats[]>([]);
  let selectedDeck = $state<DeckWithStats | null>(null);
  let flashcards = $state<FlashcardWithSRS[]>([]);
  let selectedFlashcard = $state<FlashcardWithSRS | null>(null);
  let loading = $state(false);

  onMount(async () => {
    await loadDecks();
  });

  async function loadDecks() {
    loading = true;
    try {
      decks = await deckBrowserService.getUserDecksWithStats(userId);
    } catch (error) {
      console.error('Failed to load decks:', error);
    } finally {
      loading = false;
    }
  }

  async function handleDeckSelect(event: CustomEvent<{ deck: DeckWithStats }>) {
    selectedDeck = event.detail.deck;
    selectedFlashcard = null;
    await loadFlashcards(selectedDeck.id);
  }

  async function loadFlashcards(deckId: string) {
    try {
      flashcards = await deckBrowserService.getDeckFlashcards(deckId);
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    }
  }

  function handleFlashcardSelect(event: CustomEvent<{ flashcard: FlashcardWithSRS }>) {
    selectedFlashcard = event.detail.flashcard;
  }
</script>

<div class="deck-browser-container">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
    <div class="deck-list-column">
      <DeckList 
        {decks} 
        {selectedDeck}
        {loading}
        on:deckSelect={handleDeckSelect} 
      />
    </div>
    
    <div class="flashcard-list-column">
      <FlashcardList 
        {selectedDeck}
        {flashcards}
        {selectedFlashcard}
        on:flashcardSelect={handleFlashcardSelect}
      />
    </div>
    
    <div class="flashcard-preview-column">
      <FlashcardPreview {selectedFlashcard} />
    </div>
  </div>
</div>

<style>
  .deck-browser-container {
    height: calc(100vh - 4rem);
    padding: 1rem;
  }
  
  .deck-list-column,
  .flashcard-list-column,
  .flashcard-preview-column {
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
</style>
```

## 4. Implementation Guidelines

### 4.1 File Structure

```
src/routes/decks/
├── +page.svelte                 # Main deck browser page
├── +page.ts                     # Page data loading
└── +layout.svelte              # Deck-specific layout

src/lib/components/deck-browser/
├── index.ts                     # Component exports
├── DeckList.svelte             # Left column - deck listing
├── FlashcardList.svelte        # Middle column - flashcard listing
├── FlashcardPreview.svelte     # Right column - flashcard preview
├── DeckCard.svelte             # Individual deck display
├── FlashcardCard.svelte        # Individual flashcard display
└── SRSInfo.svelte              # SRS information display

src/lib/services/
├── deck-browser.service.ts     # Main service for deck browser
├── deck.service.ts             # Deck-specific operations
└── flashcard.service.ts        # Flashcard-specific operations

src/lib/stores/
├── deck-browser.store.ts       # Deck browser state management
└── selected-entities.store.ts  # Selection state management

src/lib/types/
├── deck-browser.types.ts       # Deck browser specific types
├── deck.types.ts               # Deck type definitions
└── flashcard.types.ts          # Flashcard type definitions
```

### 4.2 Performance Optimization

```typescript
// Virtual scrolling for large flashcard lists
import { VirtualList } from '$lib/components/ui';

// Implement pagination for deck loading
const DECKS_PER_PAGE = 50;
const FLASHCARDS_PER_PAGE = 100;

// Debounced search implementation
import { debounce } from '$lib/utils';
const debouncedSearch = debounce(performSearch, 300);

// Efficient data loading with caching
const flashcardCache = new Map<string, FlashcardWithSRS[]>();
```

### 4.3 Accessibility Requirements

```svelte
<!-- Keyboard navigation support -->
<div 
  role="listbox"
  aria-label="Deck list"
  tabindex="0"
  on:keydown={handleKeyNavigation}
>
  {#each decks as deck (deck.id)}
    <div
      role="option"
      aria-selected={selectedDeck?.id === deck.id}
      tabindex="-1"
    >
      <!-- Deck content -->
    </div>
  {/each}
</div>

<!-- Screen reader announcements -->
<div aria-live="polite" class="sr-only">
  {#if selectedDeck}
    Selected deck: {selectedDeck.name} with {selectedDeck.flashcardCount} flashcards
  {/if}
</div>
```

### 4.4 Error Handling

```typescript
// Comprehensive error handling
interface DeckBrowserError {
  type: 'NETWORK_ERROR' | 'PERMISSION_ERROR' | 'DATA_ERROR';
  message: string;
  retryable: boolean;
}

function handleError(error: DeckBrowserError) {
  switch (error.type) {
    case 'NETWORK_ERROR':
      showRetryableError(error.message);
      break;
    case 'PERMISSION_ERROR':
      showPermissionError();
      break;
    case 'DATA_ERROR':
      showDataError(error.message);
      break;
  }
}
```

## 5. Testing Requirements

### 5.1 Unit Tests

```typescript
// Component testing with Svelte Testing Library
import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import DeckList from './DeckList.svelte';

describe('DeckList', () => {
  it('should render deck list correctly', () => {
    const mockDecks = [
      { id: '1', name: 'Spanish Vocabulary', flashcardCount: 50 },
      { id: '2', name: 'French Grammar', flashcardCount: 30 }
    ];
    
    render(DeckList, { decks: mockDecks });
    
    expect(screen.getByText('Spanish Vocabulary')).toBeInTheDocument();
    expect(screen.getByText('French Grammar')).toBeInTheDocument();
  });

  it('should handle deck selection', async () => {
    const mockDecks = [{ id: '1', name: 'Test Deck', flashcardCount: 10 }];
    const { component } = render(DeckList, { decks: mockDecks });
    
    const deckSelectSpy = vi.fn();
    component.$on('deckSelect', deckSelectSpy);
    
    await fireEvent.click(screen.getByText('Test Deck'));
    
    expect(deckSelectSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          deck: expect.objectContaining({ id: '1' })
        })
      })
    );
  });
});
```

### 5.2 Integration Tests

```typescript
// End-to-end testing with Playwright
import { test, expect } from '@playwright/test';

test('deck browser navigation flow', async ({ page }) => {
  await page.goto('/decks');
  
  // Select a deck
  await page.click('[data-testid="deck-card-1"]');
  
  // Verify flashcards are loaded
  await expect(page.locator('[data-testid="flashcard-list"]')).toBeVisible();
  
  // Select a flashcard
  await page.click('[data-testid="flashcard-card-1"]');
  
  // Verify preview is shown
  await expect(page.locator('[data-testid="flashcard-preview"]')).toBeVisible();
  await expect(page.locator('[data-testid="srs-info"]')).toBeVisible();
});
```

## 6. Validation Criteria

### 6.1 Functional Validation

- [ ] Three-column layout displays correctly on all screen sizes
- [ ] Deck list loads with accurate counts and metadata
- [ ] Deck selection triggers flashcard loading
- [ ] Flashcard list shows proper deck summary and statistics
- [ ] Flashcard selection displays detailed preview
- [ ] SRS information is accurate and well-formatted
- [ ] Search and filtering work correctly
- [ ] Real-time updates reflect data changes
- [ ] Error states are handled gracefully
- [ ] Loading states provide appropriate feedback

### 6.2 Performance Validation

- [ ] Initial page load completes within 2 seconds
- [ ] Deck selection response time under 500ms
- [ ] Flashcard selection response time under 200ms
- [ ] Smooth scrolling with large datasets (1000+ flashcards)
- [ ] Memory usage remains stable during extended use
- [ ] Network requests are optimized and cached

### 6.3 Accessibility Validation

- [ ] Keyboard navigation works across all columns
- [ ] Screen reader announcements are appropriate
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are visible and logical
- [ ] ARIA labels and roles are properly implemented

### 6.4 UX Validation

- [ ] Layout is intuitive and self-explanatory
- [ ] Visual hierarchy guides user attention
- [ ] Selection states are clearly indicated
- [ ] Information density is appropriate
- [ ] Responsive design maintains usability
- [ ] Error messages are helpful and actionable

## Related Documentation

### Requirements
- [Template System Requirements](./template-system.requirements.md)
- [Flashcard Creator Requirements](./flashcard-creator.requirements.md)
- [Review Session Requirements](./review-session.requirements.md)

### API Documentation
- [PocketBase Integration](../api/pocketbase-integration.md)
- [Deck Service API](../api/deck-service.md)
- [Flashcard Service API](../api/flashcard-service.md)

### Component Documentation
- [Deck Browser Components](../components/feature/deck-browser-behavior.md)
- [UI Components](../components/ui/README.md)

### Architecture
- [Data Structure](../architecture/data-structure.md)
- [Frontend Architecture](../architecture/frontend-architecture.md)
- [SRS Algorithm](../architecture/srs-algorithm.md)

### User Stories
- [Deck Management User Stories](../user-stories/deck-management-user-stories.md)
- [User Journeys](../user-stories/user-journeys.md)
