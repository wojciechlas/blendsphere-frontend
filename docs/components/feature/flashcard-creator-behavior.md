# Flashcard Creator System Behavior Specification

## 1. Flashcard Creation Lifecycle

### 1.1 Entry Points and Navigation

#### User Entry Points

```
Entry Point 1: Main Navigation
1. User clicks "Create Flashcard" in sidebar navigation
2. User selects template or creates a new one
3. System navigates to flashcard creator 

Entry Point 2: Deck Management
1. User browses to specific deck page
2. User clicks "Add Cards" button in deck header
3. System opens flashcard creator with deck pre-selected

Entry Point 3: Template Details
1. User viewing template details page
2. User clicks "Create Flashcard" from template
3. System opens creator with template pre-selected

Entry Point 4: Quick Actions
1. User clicks floating "+" button on dashboard
2. System shows quick action menu
3. User selects "New Flashcard"
4. System navigates to flashcard creator
```

#### Navigation Flow Layout

```
Breadcrumb Navigation:
Home > Flashcards > Create

Progress Indicator:
[1. Select Template] → [2. Create & Refine Cards] → [3. Save to Deck]
     ✓ Complete         🔄 Current                     ⏸ Pending
```

### 1.2 Deck and Template Selection Process

#### Template Selection Interface

```
Main Creator Layout:
┌─────────────────┬───────────────────────────────────┐
│ Template        │                                   │
│ Selection       │         Content Creator           │
│                 │                                   │
│ [Search...]     │    Select a template to begin    │
│                 │                                   │
│ My Templates:   │              [🎴]                │
│ ┌─────────────┐ │                                   │
│ │ Basic Vocab │ │     Choose from templates on      │
│ │ ⭐⭐⭐⭐⭐     │ │     the left to start creating   │
│ │ EN → ES     │ │           your flashcard          │
│ └─────────────┘ │                                   │
│ ┌─────────────┐ │                                   │
│ │ Grammar     │ │                                   │
│ │ ⭐⭐⭐⭐⚬     │ │                                   │
│ │ EN → FR     │ │                                   │
│ └─────────────┘ │                                   │
│                 │                                   │
│ Public:         │                                   │
│ ┌─────────────┐ │                                   │
│ │ Spanish     │ │                                   │
│ │ Starter     │ │                                   │
│ │ ⭐⭐⭐⭐⭐     │ │                                   │
│ └─────────────┘ │                                   │
└─────────────────┴───────────────────────────────────┘

Template Card Behavior:
- Hover shows preview tooltip with field structure
- Click selects template and loads form
- Star ratings show community feedback
- Language pair clearly displayed
- Recent usage indicated with "Recently Used" badge
```

### 1.3 Create & Refine Cards

Once a template is selected, the user enters the primary "Create & Refine Cards" stage. This stage utilizes a unified, table-based interface for inputting content, leveraging AI for generation, and iteratively reviewing and editing flashcards.

#### Unified Table Interface

The core of this stage is an interactive table where each row represents a flashcard, and columns correspond to the fields from the selected template, plus controls for actions and feedback.

```
Layout (e.g., "Basic Spanish Vocabulary" template):
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Create Flashcards: Basic Spanish Vocabulary                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Step 2 of 3: Create & Refine Cards                                                                                          │
│                                                                                                                             │
│ Batch Context (Optional): [_________________________________________________________]                                       │
│ 💡 Provide overall context for this batch, e.g., "Chapter 5 vocabulary" or "Today's lesson on greetings"                   │
│                                                                                                                             │
│ Flashcard Table:                                                                                                            │
│ ┌───┬──────────────────┬──────────────────────────────────┬──────────────────────────────────┬──────────────────┬───────────┐│
│ │ # │ Spanish Word*    │ English Translation              │ Example Sentence (ES)            │ Feedback         │ Actions   ││
│ │   │ (Input)          │ (AI Generated)                   │ (AI Generated)                   │ (AI Fields)      │           ││
│ ├───┼──────────────────┼──────────────────────────────────┼──────────────────────────────────┼──────────────────┼───────────┤│
│ │ 1 │ [hola________]   │                                  │                                  │                  │ [...]     ││
│ ├───┼──────────────────┼──────────────────────────────────┼──────────────────────────────────┼──────────────────┼───────────┤│
│ │ 2 │ [adiós_______]   │ [hello, hi___________]           │ [Adiós, amigo.]                  │ [👍][👎][💬]      │ [...]     ││
│ ├───┼──────────────────┼──────────────────────────────────┼──────────────────────────────────┼──────────────────┼───────────┤│
│ │ 3 │ [qué tal?____]   │                                  │ <Row Error: AI gen failed>       │                  │ [...]     ││
│ └───┴──────────────────┴──────────────────────────────────┴──────────────────────────────────┴──────────────────┴───────────┘│
│                                                                                                 [+ Add Row]                 │
│                                                                                                                             │
│ Overall AI Progress (when batch generating): [██████░░░░░░░░░░░░░░░] 33% (1 of 3 rows processed)                            │
│                                                                                                                             │
│ Column Types: (Input) - User-entered text. (AI Generated) - To be filled by AI, then editable.                             │
│ Cell Statuses: After batch generation, cells are populated or may indicate a row-specific error (e.g., <Row Error: AI gen failed>). │
│ Feedback (AI Fields): 👍 (Good AI) │ 👎 (Bad AI) │ 💬 (Comment for AI/Suggest improvement) - Appears after AI generation.    │
│ Actions Column (...): Opens menu with [🔄 Regenerate AI], [👁️ Preview Card], [🗑️ Delete Row].                               │
│                                                                                                                             │
│ [← Back to Templates] [Generate AI for All Eligible Rows] [Save Draft] [Proceed to Save to Deck →]                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Table Behavior & Content Input:**
-   **Batch Context:** An optional field at the top allows users to provide a general context for the entire batch of flashcards being created. This context can be used by the AI to generate more relevant content.
-   **Rows & Columns:** Each row is a flashcard. Columns include user input fields (defined by the template), AI-generated fields (also defined by the template), a feedback section for AI content, and an actions menu.
-   **Adding Rows:**
    -   Starts with one default row.
    -   A dedicated "[+ Add Row]" button allows manual addition.
    -   Pasting multiple lines of text into an input cell automatically creates new rows and distributes the pasted content accordingly.
-   **Direct Editing:** All content cells (both user-inputted and AI-generated, once populated) are directly editable within the table.
-   **Validation:** Real-time validation applies to input fields. Visual cues indicate errors on a per-cell/row basis.

**AI Content Generation:**
-   **Primary Trigger ("[Generate AI for All Eligible Rows]"):** A single, prominent button is available to trigger AI content generation for all rows that have the necessary input fields filled and haven't been processed yet (or are marked for re-generation). The global "Batch Context" is used by the AI for all items in this single batch request.
-   **Loading State & Progress Visualization:**
    -   **Overall Progress (Batch Mode):** When "[Generate AI for All Eligible Rows]" is clicked, an overall progress bar and text (e.g., `[████░░░░░░] 40% (X of Y rows processed)`) will appear below the table or in a noticeable area, indicating the batch processing status.
    -   Upon completion of the batch request, the AI-generated fields in the table are populated with the content received from the AI service.
    -   Feedback icons (👍/👎/💬) become active for AI-generated fields after content is successfully populated.

**Review and Refinement (Inline within the Table):**
-   **Actions Menu ("..."):** Each row has an ellipsis button that opens a menu with the following actions:
    -   **[🔄 Regenerate AI]:** Re-triggers AI generation for that specific row. Any comments (💬) provided for that row's AI fields can be used as additional context, along with the global "Batch Context".
    -   **[👁️ Preview Card]:** Opens a modal or a quick view displaying how the flashcard for the current row will look.
    -   **[🗑️ Delete Row]:** Removes the row from the current creation batch.
-   **Feedback (👍/👎/💬 - for AI fields only):**
    -   Displayed directly in the row, adjacent to or within the AI-generated content columns, once AI generation is complete for that row.
    -   `👍`/`👎`: Quick rating for AI-generated content quality.
    -   `💬`: Allows textual comments/suggestions for AI regeneration or personal notes related to the AI content.
-   **Manual Edits:** Users can directly type into any cell to correct, complete, or override any content.

After users have inputted data, utilized AI generation, and refined their flashcards within the table, they can proceed to the final saving step. The "[Proceed to Save to Deck →]" button typically becomes active once there is at least one valid flashcard ready for saving.

**Error Handling:**
-   **Validation Errors:** Clearly displayed at the cell or row level, preventing invalid data from being saved without user attention.
-   **AI Generation Errors:** If the batch AI generation fails for specific rows, an error message or indicator (e.g., `<Row Error: AI gen failed>`) is shown in the relevant cells or an annotation for that row. Users can then choose to retry generation for those rows (possibly individually via the "..." menu) or manually fill the content. Global AI service errors (network issues, rate limits for the batch) are communicated through general notifications, possibly indicating which rows were affected or if the entire batch failed.

### 1.4 Saving to Deck

This is the final stage in the flashcard creation workflow, where the batch of created and refined flashcards is saved to a user-selected deck.

#### Deck Selection and Confirmation Process

1.  The user initiates the save process by clicking the "[Proceed to Save to Deck →]" button (or a similar "Save All Cards" button) from the "Create & Refine Cards" stage.
2.  A modal dialog appears, prompting the user for deck selection:
    ```
    ┌──────────────────────────────────────────────────┐
    │ Save Flashcards to Deck                          │
    ├──────────────────────────────────────────────────┤
    │ You are about to save [N] flashcards.            │
    │                                                  │
    │ Select Deck:                                     │
    │   ┌─────────────┐  ┌─────────────┐             │
    │   │ My Vocab    │  │ Spanish 101 │             │
    │   │ (250 cards) │  │ (75 cards)  │             │
    │   │ [Select]    │  │ [Select]    │             │
    │   └─────────────┘  └─────────────┘             │
    │   ┌─────────────┐                              │
    │   │ Travel Phrs │                              │
    │   │ (30 cards)  │                              │
    │   │ [Select]    │                              │
    │   └─────────────┘                              │
    │                                                  │
    │ Or, Create New Deck:                             │
    │ [________________________] [Create & Select]     │
    │                                                  │
    │ Options:                                         │
    │ [ ] Clear table after saving                     │
    │                                                  │
    │                      [Cancel] [Save [N] Cards]   │
    └──────────────────────────────────────────────────┘
    ```
3.  The user selects an existing deck by clicking its corresponding "[Select]" button or types a name to create a new deck and selects it.
4.  The user confirms the action by clicking the "[Save [N] Cards]" button.

**Saving Operation:**
-   A visual progress indicator (e.g., a progress bar or spinner) is displayed during the save operation, especially if a large number of cards are being processed.
-   The system saves all valid and completed flashcards from the table to the chosen deck. Rows with critical validation errors or those explicitly marked for exclusion might be skipped, with a summary notification provided to the user.

**Post-Save Actions and Notifications:**
-   Upon successful completion, a confirmation message is displayed (e.g., "[N] flashcards successfully saved to [Deck Name]!").
-   The user is typically presented with options such as:
    -   "Create More Flashcards" (which might clear the table if the option was selected, or return to the template selection/cleared table for the same template).
    -   "View Deck" (navigates the user to the deck page where the cards were saved).
    -   "Close" (dismisses the confirmation).
-   If the "Clear table after saving" option was checked, the flashcard creation table is reset, ready for a new batch.

**Draft Management:**
-   The "[Save Draft]" button, available during the "Create & Refine Cards" stage, allows users to save the current state of their flashcard table (including all inputs, AI-generated content, comments, etc.) as a draft.
-   Drafts can be resumed later, allowing users to continue their work without losing progress. This functionality is distinct from saving finalized cards to a deck.
