# Flashcard Creator System Requirements

---

component: FlashcardCreator
type: requirements
version: 2.1.0
dependencies:

- template-system
- ai-integration
- deck-management
context_tags:
- flashcard
- ai-generation
- template
- bulk-creation
- user-interface
last_updated: 2025-05-30
ai_context: |
  Flashcard Creator System for BlendSphere that enables users to create flashcards
  using a unified single-step interface that integrates template selection, content creation,
  AI generation, and deck management. Features real-time AI-powered content generation,
  immediate saving capabilities, and supports bulk card creation via direct input or pasting.

---

## 1. Overview

### 1.1 Purpose

Provide an intuitive and powerful interface for creating flashcards using a unified single-step workflow that integrates:
- **Template Selection**: Choose and switch flashcard structure within the main interface
- **Content Creation**: Input content into a dynamic table with real-time validation  
- **AI Generation**: Batch AI content generation with immediate feedback and refinement
- **Deck Management**: Pre-select target deck and save cards as they become ready

This system provides a seamless, iterative creation experience that integrates with the template system, AI services, and deck management.

### 1.2 Scope

- Single-step unified flashcard creation interface with integrated template and deck selection
- Table-based interface for creating and refining multiple flashcards simultaneously
- Real-time AI content generation with immediate status feedback per card
- Incremental saving - save ready cards without waiting for entire batch completion
- Manual card addition and pasting multiple lines to create rows
- Inline editing and review of flashcard content with real-time validation
- Row-level actions (regenerate AI, preview, delete) with contextual availability
- AI content feedback mechanism (ratings, comments) for continuous improvement
- Integrated deck selection and immediate saving of completed flashcards
- Enhanced session management with auto-save and draft capabilities

### 1.3 Dependencies

- **Frontend**: Template selection UI, interactive table component for card creation, AI generation controls, deck selection modal
- **Backend**: PocketBase flashcards collection, FastAPI AI service, media storage
- **External**: File processing libraries, media optimization services

## 2. Functional Requirements

### 2.1 Template Integration

#### REQ-FC-001: Template Selection Interface

**Priority**: P0 (Critical)
**Component**: TemplateSelector, FlashcardCreatorStep1
**Dependencies**: TemplateService, TemplateStore

**Description**:
Users must be able to select from available templates as the first step in the flashcard creation process.
The selection interface should allow filtering and previewing.

**AI Context**:

- Component type: Svelte 5 component for template selection step
- UI library: shadcn-svelte components (Dialog, Card, Button)
- Data source: PocketBase templates collection
- State management: Template selection store

**Acceptance Criteria**:

1. Display templates in filterable grid layout
2. Show template preview with field structure
3. Filter by user permissions (owned, public, shared)
4. Template compatibility validation
5. Language pair matching with user preferences
6. Search functionality in template names/descriptions

**Implementation Hints**:

```typescript
// Template selection component
let selectedTemplate = $state<Template | null>(null);
let availableTemplates = $state<Template[]>([]);
let templateFilter = $state({
	languages: [] as string[],
	levels: [] as CEFRLevel[],
	search: ''
});

let filteredTemplates = $derived(() => {
	return availableTemplates.filter((template) => {
		// Filter logic
		return (
			matchesLanguageFilter(template) &&
			matchesLevelFilter(template) &&
			matchesSearchFilter(template)
		);
	});
});

async function selectTemplate(template: Template) {
	selectedTemplate = template;
	const fields = await fieldService.getByTemplate(template.id);
	initializeFormFromTemplate(template, fields);
}
```

**Related Files**:

- `src/lib/components/flashcard/TemplateSelector.svelte`
- `src/lib/components/flashcard/FlashcardCreator.svelte`
- `src/lib/services/template.service.ts`

#### REQ-FC-002: Dynamic Table for Card Creation & Refinement

**Priority**: P0 (Critical)
**Component**: FlashcardCreatorStep2, FlashcardTable, TableRowActions
**Dependencies**: Selected template, form validation, AI service

**Description**:
System must render an interactive table based on the selected template's fields. Each row represents a flashcard, and columns represent template fields, feedback, and actions. Users can add rows, input data, trigger batch AI generation, and refine content directly in the table.

**AI Context**:

- UI: Interactive table (shadcn-svelte Table or custom) where rows are flashcards and columns are template fields.
- Data Entry: Direct input into table cells. Pasting multiple lines creates new rows.
- State: Reactive state for table rows, cell content, AI generation status, and batch context.
- Validation: Zod schemas for cell-level validation based on template field definitions.

**Acceptance Criteria**:

1.  Display a table with columns derived from the selected template (input fields, AI-generatable fields, feedback, actions).
2.  Allow users to add new rows manually (`[+ Add Row]` button).
3.  Support pasting multiple lines of text into an input cell to create multiple new rows.
4.  Input fields are directly editable. AI-generated fields become editable after population.
5.  Provide a "Batch Context" input field to guide AI generation for all cards in the session.
6.  Implement real-time validation for input cells with visual cues for errors.
7.  Each row must have an actions menu ("...") with options: "Regenerate AI", "Preview Card", "Delete Row".

**Implementation Hints**:

```typescript
// Flashcard table row data structure
interface FlashcardRowData {
  id: string; // Unique ID for the row
  cells: Record<string, { value: any; isInput: boolean; error?: string; aiStatus?: 'pending' | 'generated' | 'error' }>;
  // ... other row-specific state
}

let flashcardRows = $state<FlashcardRowData[]>([]);
let batchContext = $state<string>('');

function addRow() {
  // Logic to add a new empty row based on selected template
}

function handlePaste(event: ClipboardEvent, rowIndex: number, cellKey: string) {
  // Logic to parse pasted text and add new rows
}
```

### 2.2 AI Content Generation

#### REQ-FC-003: Batch AI Generation Workflow

**Priority**: P0 (Critical)
**Component**: FlashcardCreatorStep2, AIService
**Dependencies**: FastAPI AI service, selected template, flashcard table data

**Description**:
Users must be able to trigger AI content generation for all eligible rows in the flashcard table using a single action. The system should use the "Batch Context" and individual row inputs to generate content.

**AI Context**:

- Service integration: Single batch API call to FastAPI AI service for all eligible rows.
- Context building: Template details, "Batch Context" field, and input field values for each row.
- UI patterns: A global "[Generate AI for All Eligible Rows]" button. Overall progress bar for batch generation.
- Workflow: User fills input fields -> Clicks "Generate AI for All Eligible Rows" -> System sends batch request -> AI-generated content populates table cells upon completion.

**Acceptance Criteria**:

1.  A single "[Generate AI for All Eligible Rows]" button triggers AI generation for all rows with necessary inputs.
2.  Display an overall progress bar and status text (e.g., "X of Y rows processed") during batch AI generation.
3.  AI-generated content populates the respective cells in the table upon successful completion of the batch request.
4.  Row-level errors from the AI service are displayed within the table (e.g., in the cell or as a row annotation).
5.  Global AI service errors (e.g., network failure for the batch) are communicated via general notifications.
6.  The "Batch Context" field content is sent to the AI service as part of the generation request for all rows.
7.  Individual rows can be re-generated using the "Regenerate AI" option in the row's "..." menu, using existing row data and batch context.

**Implementation Hints**:

```typescript
// AI generation service call for batch
async function generateForAllEligibleRows(rows: FlashcardRowData[], batchContext: string, template: Template) {
  // 1. Identify eligible rows
  // 2. Construct batch request payload
  // 3. Call AI service (e.g., aiService.generateBatchContent(payload))
  // 4. Update rows with results or errors
}

// Row-level AI regeneration
async function regenerateAIRow(row: FlashcardRowData, batchContext: string, template: Template) {
  // Similar to batch, but for a single row
}
```

#### REQ-FC-004: AI Content Quality Feedback

**Priority**: P1 (High)
**Component**: FlashcardCreatorStep2, FeedbackControls
**Dependencies**: AI service, user feedback system

**Description**:
System must provide mechanisms for users to review and provide feedback (ratings, comments) on AI-generated content within the table.

**AI Context**:

- Feedback UI: 👍/👎/💬 icons/buttons next to AI-generated fields in each row, active after generation.
- Data Collection: Store feedback associated with the specific flashcard content and AI generation request.
- Purpose: Feedback can be used to improve AI models or for user's own reference.

**Acceptance Criteria**:

1.  After AI content is generated for a row, display feedback icons (e.g., 👍, 👎, 💬) for each AI-generated field.
2.  Clicking 👍/👎 records a positive/negative rating for the AI content.
3.  Clicking 💬 allows the user to add a textual comment or suggestion for the AI-generated content.
4.  Feedback is associated with the specific row and field.
5.  Comments provided via 💬 can be used as additional context if "Regenerate AI" is triggered for that row.

**Implementation Hints**:

```typescript
// Storing feedback per AI-generated cell
interface AIGeneratedCellFeedback {
  rating?: 'good' | 'bad';
  comment?: string;
}

// Part of FlashcardRowData.cells for AI fields
// cells: Record<string, { value: any; isInput: boolean; feedback?: AIGeneratedCellFeedback ... }>;
```

### 2.3 Flashcard Saving and Deck Management

#### REQ-FC-005: Save to Deck Workflow

**Priority**: P0 (Critical)
**Component**: FlashcardCreatorStep3, DeckSelectionModal
**Dependencies**: DeckService, FlashcardService

**Description**:
Users must be able to save the created and refined flashcards from the table to a new or existing deck in the final step of the workflow.

**AI Context**:

- UI: Modal dialog for deck selection. Decks displayed as selectable cards showing name and card count.
- Functionality: Option to select an existing deck or create a new one.
- Data Flow: Validated flashcard data from the table is packaged and sent to the backend for saving.

**Acceptance Criteria**:

1.  A "[Proceed to Save to Deck →]" button in the "Create & Refine Cards" stage, active when at least one valid flashcard exists.
2.  Clicking this button navigates to the "Save to Deck" stage/modal.
3.  The modal displays a list of existing decks as selectable cards (showing deck name, card count).
4.  The modal provides an option to input a name and create a new deck.
5.  User selects or creates a deck, then confirms saving (e.g., "[Save [N] Cards]" button).
6.  Successfully saved flashcards are added to the chosen deck.
7.  Appropriate feedback is provided upon successful save or if errors occur.

**Implementation Hints**:

```typescript
// Deck selection modal
// State for selected deck or new deck name
let targetDeckId = $state<string | null>(null);
let newDeckName = $state<string>('');

async function saveFlashcardsToDeck(flashcards: FlashcardData[], deckIdOrNewName: string | { newName: string }) {
  // Logic to either use existing deckId or create new deck, then save flashcards
}
```

### 2.4 Removed/Modified Requirements from v2.0.0

-   **REQ-FC-005 (Clipboard and Text Import - v2.0.0)**: Modified. Pasting multiple lines into a table cell is the primary mechanism for bulk-like entry from text. Dedicated "Bulk Import" mode/component using textarea is removed in favor of unified table.
-   **REQ-FC-006 (File Upload Support - v2.0.0)**: Deprecated/Removed for this iteration of Flashcard Creator. Focus is on manual and paste-based input into the table.
-   **REQ-FC-007 (File Upload and Validation - v2.0.0 for Media)**: Media handling (image/audio upload directly into table cells) is deferred. Template fields might still *describe* media, but direct upload in this specific creator UI is not a P0 for v2.1.0.
-   **REQ-FC-008 (Auto-Save and Session Persistence)**: Retained but adapted. Auto-save applies to the current state of the flashcard table (rows, content, batch context).

### 2.5 Session Management and Performance (Adapted for Table UI)

#### REQ-FC-008: Auto-Save and Session Persistence for Table

**Priority**: P1 (High)
**Component**: SessionManager, AutoSaveTable
**Dependencies**: Local storage, network handling

**Description**:
System must provide automatic saving of the current flashcard creation session (table rows, content, batch context) with session persistence and network interruption handling.

**AI Context**:
- Auto-save: Periodically save the state of the `flashcardRows` and `batchContext`.
- Storage: Browser localStorage for session persistence
- Network handling: Retry mechanisms, offline support
- UI feedback: Save status indicators

**Acceptance Criteria**:

1. Auto-save form data every 30 seconds
2. Network interruption handling
3. Save status notifications (saved, saving, error)
4. Session persistence across browser refresh
5. Conflict resolution for concurrent edits
6. Recovery from failed saves

**Implementation Hints**:

```typescript
// Session management and auto-save
let saveStatus = $state<'saved' | 'saving' | 'error' | 'unsaved'>('saved');
let lastSaveTime = $state<Date | null>(null);
let sessionId = $state<string>(crypto.randomUUID());

// Auto-save effect
$effect(() => {
	const interval = setInterval(async () => {
		if (hasUnsavedChanges()) {
			await autoSave();
		}
	}, 30000); // 30 seconds

	return () => clearInterval(interval);
});

async function autoSave() {
	if (saveStatus === 'saving') return;

	saveStatus = 'saving';

	try {
		// Save to localStorage
		localStorage.setItem(
			`flashcard-session-${sessionId}`,
			JSON.stringify({
				formData,
				selectedTemplate,
				generatedContent,
				timestamp: new Date().toISOString()
			})
		);

		// Attempt network save if online
		if (navigator.onLine) {
			await sessionService.saveSession(sessionId, {
				formData,
				templateId: selectedTemplate.id,
				status: 'draft'
			});
		}

		saveStatus = 'saved';
		lastSaveTime = new Date();
	} catch (error) {
		saveStatus = 'error';
		handleAutoSaveError(error);
	}
}

function restoreSession() {
	const sessionData = localStorage.getItem(`flashcard-session-${sessionId}`);
	if (sessionData) {
		const restored = JSON.parse(sessionData);
		formData = restored.formData || {};
		selectedTemplate = restored.selectedTemplate;
		generatedContent = restored.generatedContent || {};
	}
}
```

## 3. Technical Specifications

### 3.1 Data Structures

```typescript
// Flashcard creation interfaces (src/lib/types/flashcard-creator.ts)
interface FlashcardCreationSession { // Represents the overall state of the creator
  id: string; // Session ID
  templateId: string | null;
  batchContext: string;
  rows: FlashcardRow[]; // Array of flashcards being created/refined
  status: 'template-selection' | 'create-refine' | 'saving';
  created: string;
  updated: string;
}

interface FlashcardRow { // Represents a single row in the creation table
  rowId: string; // Unique ID for this row in the current session
  templateFields: Record<string, { // Keyed by template field ID/name
    value: any;
    isInput: boolean; // True if this field is an input field from the template
    aiStatus?: 'idle' | 'pending' | 'generated' | 'error'; // Status for AI-generatable fields
    error?: string; // Validation or AI error for this cell
    feedback?: {
      rating?: 'good' | 'bad';
      comment?: string;
    };
  }>;
  // Potentially other row-specific metadata, e.g., isMarkedForDeletion
}

interface AIBatchGenerationRequest {
  templateId: string;
  batchContext?: string;
  items: Array<{
    rowId: string; // To map results back
    inputFields: Record<string, any>; // User-provided input data for this item
    // Include existing comments from feedback if re-generating
    existingComments?: Record<string, string>; // fieldId: comment
  }>;
  language: {
    native: string;
    learning: string;
    level: CEFRLevel;
  };
}

interface AIBatchGenerationResponse {
  results: Array<{
    rowId:string;
    success: boolean;
    generatedFields?: Record<string, any>; // AI-generated content for this item
    error?: string; // Item-specific error
  }>;
  batchError?: string; // Error affecting the whole batch
}

// MediaFile interface can remain if templates can *reference* media,
// but direct upload in this UI is deferred.
// interface MediaFile { ... }
```

### 3.2 Component Architecture

```svelte
<!-- Main flashcard creator component (src/lib/components/flashcard/FlashcardCreator.svelte) -->
<script lang="ts">
  import type { Template } from '$lib/types/template.js';
  import { TemplateSelector } from './TemplateSelector.svelte'; // Step 1
  import { FlashcardTableCreator } from './FlashcardTableCreator.svelte'; // Step 2
  import { SaveToDeckModal } from './SaveToDeckModal.svelte'; // Step 3

  type CreatorStep = 'template-selection' | 'create-refine' | 'save-to-deck';

  let currentStep = $state<CreatorStep>('template-selection');
  let selectedTemplate = $state<Template | null>(null);
  let flashcardsToSave = $state<FlashcardRow[]>([]); // Populated from Step 2

  function handleTemplateSelected(template: Template) {
    selectedTemplate = template;
    currentStep = 'create-refine';
  }

  function handleProceedToSave(cards: FlashcardRow[]) {
    flashcardsToSave = cards.filter(card => /* card is valid and not empty */);
    if (flashcardsToSave.length > 0) {
      currentStep = 'save-to-deck';
    } else {
      // Show notification: No cards to save
    }
  }

  function handleSaveComplete() {
    // Reset state, navigate away, or show success message
    selectedTemplate = null;
    flashcardsToSave = [];
    currentStep = 'template-selection';
  }

  function handleBackToTemplates() {
    currentStep = 'template-selection';
    selectedTemplate = null;
    // Potentially clear or ask to save draft from create-refine step
  }

</script>

<div class="flashcard-creator-lifecycle">
  {#if currentStep === 'template-selection'}
    <TemplateSelector on:selected={handleTemplateSelected} />
  {:else if currentStep === 'create-refine' && selectedTemplate}
    <FlashcardTableCreator
      bind:template={selectedTemplate}
      on:proceedToSave={handleProceedToSave}
      on:backToTemplates={handleBackToTemplates}
    />
  {:else if currentStep === 'save-to-deck'}
    <SaveToDeckModal
      cardsToSave={flashcardsToSave}
      on:saved={handleSaveComplete}
      on:cancel={() => currentStep = 'create-refine'}
    />
  {/if}
</div>
```

<!-- FlashcardTableCreator.svelte (Conceptual for Step 2) -->
<script lang="ts">
  // Props: template, on:proceedToSave, on:backToTemplates
  // Internal state: batchContext, flashcardRows
  // Methods: addRow, handlePaste, generateForAllEligibleRows, handleRowAction (delete, preview, regenerate)
  // UI: Batch context input, Table for flashcardRows, [+ Add Row], [Generate AI], [Save Draft], [Back], [Proceed to Save]
</script>

### 4. Implementation Guidelines

### 4.1 File Structure

```
src/lib/
├── components/
│   └── flashcard/
│       ├── FlashcardCreator.svelte       // Main lifecycle component
│       ├── TemplateSelector.svelte       // Step 1
│       ├── FlashcardTableCreator.svelte  // Step 2 - Table UI
│       ├── FlashcardRowActions.svelte    // "..." menu for table rows
│       ├── SaveToDeckModal.svelte        // Step 3
│       └── FlashcardPreviewModal.svelte  // For row preview action
├── services/
│   ├── flashcard.service.ts
│   ├── ai.service.ts // Updated for batch generation
│   └── deck.service.ts
├── stores/
│   └── flashcard-creation.store.ts // Manages state for the creation lifecycle
├── types/
│   └── flashcard-creator.ts // Updated interfaces (FlashcardCreationSession, FlashcardRow etc.)
└── utils/
    ├── file-validation.ts
    └── text-processing.ts
```

### 4.2 Testing Requirements

- Unit tests for all service methods
- Component tests for form generation and validation
- Integration tests for AI generation workflow
- E2E tests for complete flashcard creation flow
- Performance tests for bulk operations

### 4.3 Accessibility Requirements

- ARIA labels for all form controls
- Keyboard navigation through creation steps
- Screen reader announcements for generation status
- Focus management during step transitions
- Error message accessibility

## 5. Validation Criteria

### 5.1 Functional Validation

- [ ] **Step 1: Template Selection**: User can select a template.
- [ ] **Step 2: Create & Refine Cards (Table UI)**:
  - [ ] Table renders correctly based on selected template.
  - [ ] User can add rows manually.
  - [ ] User can paste multiple lines to create rows.
  - [ ] Direct editing of cell content works.
  - [ ] "Batch Context" field is available and used by AI.
  - [ ] Batch AI generation for all eligible rows is triggered by a single button.
  - [ ] Overall progress bar shown during batch AI generation.
  - [ ] AI content populates table cells; errors are shown at row/cell level.
  - [ ] Row actions (Regenerate AI, Preview, Delete) function correctly.
  - [ ] AI content feedback (👍/👎/💬) can be provided per AI field.
- [ ] **Step 3: Save to Deck**:
  - [ ] User can select an existing deck or create a new one via modal.
  - [ ] Flashcards are saved to the chosen deck.
- [ ] Session management (auto-save of table state) works.
- [ ] Navigation between steps (Back, Proceed) is logical.

### 5.2 Technical Validation

- [ ] Type safety with TypeScript interfaces
- [ ] Error handling and recovery
- [ ] Performance optimization for bulk operations
- [ ] Memory management in large sessions
- [ ] Network error handling and retry logic

### 5.3 UX Validation

- [ ] Intuitive creation workflow
- [ ] Clear visual feedback for all operations
- [ ] Responsive design across devices
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Loading states and progress indicators

## Related Documentation

### Requirements

- [Template System Requirements](./template-system.requirements.md)
- [AI Integration Requirements](../architecture/ai-integration.md) // Ensure this reflects batch AI for flashcards
- [Deck Management Requirements](./deck-management.requirements.md) // Ensure this covers deck selection UI

### API Documentation

- [Flashcard Service API](../api/services/flashcard.service.md) // Needs to support saving batch of cards
- [AI Service API](../api/services/ai.service.md) // Needs to support batch generation request/response

### Component Documentation

- [Flashcard Creator Component](../components/feature/flashcard-creator.component.md) // Overall wrapper
- [FlashcardTableCreator Component](../components/feature/flashcard-table-creator.component.md) // Specific to Step 2
- [SaveToDeckModal Component](../components/ui/save-to-deck-modal.component.md)

### User Stories

- [Flashcard Creation Workflow](../user-stories/user-journeys.md#flashcard-creation) // Update to reflect 3-step, table UI
