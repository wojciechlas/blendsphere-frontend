# Flashcard Creator System Behavior Specification

## 1. Single-Step Flashcard Creation Lifecycle

The BlendSphere flashcard creation system uses a unified, single-step interface that integrates template selection, content creation, AI generation, and deck management into one seamless workflow. This approach eliminates the complexity of multi-step wizards while providing a more natural, iterative creation experience.

### 1.1 Entry Points and Navigation

#### User Entry Points

```
Entry Point 1: Main Navigation
1. User clicks "Create Flashcard" in sidebar navigation
2. System opens unified flashcard creator interface
3. User selects template and deck, then begins creating cards

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
4. System opens unified flashcard creator
```

#### Navigation Flow Layout

```
Breadcrumb Navigation:
Home > Flashcards > Create

Single-Step Interface:
Create Flashcards
 🔄 Active
```

### 1.2 Single-Step Unified Interface

The flashcard creation process is now consolidated into a single, comprehensive interface that combines template selection, content creation, and deck management in one view.

#### Unified Creator Layout

```
Main Creator Layout:
┌─────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Settings Panel  │                                    Content Creator                                                     │
│                 │                                                                                                         │
│ Template:       │ Create Flashcards: Basic Spanish Vocabulary                                                             │
│ ┌─────────────┐ │                                                                                                         │
│ │ Basic Vocab │ │ Deck: [My Spanish Vocab ▼] [+ New Deck]                                                               │
│ │ ⭐⭐⭐⭐⭐     │ │                                                                                                         │
│ │ EN → ES     │ │ Batch Context (Optional): [Chapter 5 vocabulary - basic greetings and farewells______________]       │
│ │ [Change]    │ │ 💡 Provide overall context for this batch to improve AI generation                                     │
│ └─────────────┘ │                                                                                                         │
│                 │ Flashcard Table:                                                                                        │
│ Deck:           │ ┌───┬────────────────┬──────────────────────────────┬──────────────────────────────┬─────────┬──────┐│
│ ┌─────────────┐ │ │ # │ Spanish Word*  │ English Translation          │ Example Sentence (ES)        │ Status  │ Actions││
│ │ My Spanish  │ │ │   │ (Input)        │ (AI Generated)               │ (AI Generated)               │         │      ││
│ │ Vocab       │ │ ├───┼────────────────┼──────────────────────────────┼──────────────────────────────┼─────────┼──────┤│
│ │ (250 cards) │ │ │ 1 │ [hola_______]  │ [hello, hi_____________]     │ [¡Hola! ¿Cómo estás?]       │ ✅ Ready│ [...] ││
│ │ [Change]    │ │ ├───┼────────────────┼──────────────────────────────┼──────────────────────────────┼─────────┼──────┤│
│ └─────────────┘ │ │ 2 │ [adiós______]  │ [goodbye, bye_____________]  │ [Adiós, nos vemos mañana.]   │ ✅ Ready│ [...] ││
│                 │ ├───┼────────────────┼──────────────────────────────┼──────────────────────────────┼─────────┼──────┤│
│ Templates:      │ │ 3 │ [qué tal?___]  │                              │                              │ ⏳ Input│ [...] ││
│ ┌─────────────┐ │ └───┴────────────────┴──────────────────────────────┴──────────────────────────────┴─────────┴──────┘│
│ │ Basic Vocab │ │                                                                               [+ Add Row]           │
│ │ Grammar     │ │                                                                                                         │
│ │ Sentences   │ │ [🤖 Generate AI for Eligible Rows] [💾 Save All Ready Cards] [📝 Save as Draft]                      │
│ │ [Browse...] │ │                                                                                                         │
│ └─────────────┘ │ AI Progress: [██████░░░░░░░░░░░░░░░] 40% (2 of 5 rows processed)                                      │
│                 │                                                                                                         │
│ Quick Actions:  │ Status Legend: ✅ Ready to save | ⏳ Needs input | 🤖 AI generating | ❌ Has errors                    │
│ [+ Quick Card]  │                                                                                                         │
│ [📄 Templates]  │                                                                                                         │
│ [📚 My Decks]   │                                                                                                         │
└─────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

Panel Behavior:
- Template selection updates the table structure immediately
- Deck selection determines where cards will be saved
- Template browser allows quick switching between templates
- Quick Actions provide shortcuts to common tasks
- Settings persist within the session
```

### 1.3 Integrated Content Creation & Management

The single-step interface combines content creation, AI generation, and deck management in one unified workflow. Users can work with multiple flashcards simultaneously while having immediate access to template switching and deck selection.

#### Real-Time Content Creation

The main content area features an enhanced table interface with integrated settings and immediate feedback:

```
Enhanced Table Features:
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Create Flashcards: Basic Spanish Vocabulary                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Deck: [My Spanish Vocab ▼] [+ New Deck]                    Template: [Basic Vocab ▼] [📝 Edit Template]                   │
│                                                                                                                             │
│ Batch Context (Optional): [Chapter 5 vocabulary - basic greetings and farewells____________________]                      │
│ 💡 Provide overall context for this batch to improve AI generation quality                                                 │
│                                                                                                                             │
│ Flashcard Table:                                                                                                            │
│ ┌───┬────────────────┬──────────────────────────────┬──────────────────────────────┬─────────────────┬─────────┬──────────┐│
│ │ # │ Spanish Word*  │ English Translation          │ Example Sentence (ES)        │ Feedback        │ Status  │ Actions  ││
│ │   │ (Input)        │ (AI Generated)               │ (AI Generated)               │ (AI Fields)     │         │          ││
│ ├───┼────────────────┼──────────────────────────────┼──────────────────────────────┼─────────────────┼─────────┼──────────┤│
│ │ 1 │ [hola_______]  │ [hello, hi_____________]     │ [¡Hola! ¿Cómo estás?]       │ [👍][👎][💬]    │ ✅ Ready│ [...]    ││
│ ├───┼────────────────┼──────────────────────────────┼──────────────────────────────┼─────────────────┼─────────┼──────────┤│
│ │ 2 │ [adiós______]  │ [goodbye, bye_____________]  │ [Adiós, nos vemos mañana.]   │ [👍][👎][💬]    │ ✅ Ready│ [...]    ││
│ ├───┼────────────────┼──────────────────────────────┼──────────────────────────────┼─────────────────┼─────────┼──────────┤│
│ │ 3 │ [qué tal?___]  │                              │                              │                 │ ⏳ Input│ [...]    ││
│ ├───┼────────────────┼──────────────────────────────┼──────────────────────────────┼─────────────────┼─────────┼──────────┤│
│ │ 4 │ [gracias____]  │ 🤖 Generating...             │ 🤖 Generating...             │                 │🤖 AI Gen│ [...]    ││
│ └───┴────────────────┴──────────────────────────────┴──────────────────────────────┴─────────────────┴─────────┴──────────┘│
│                                                                                                          [+ Add Row]       │
│                                                                                                                             │
│ 🤖 [Generate AI for Eligible Rows (2)]  💾 [Save All Ready Cards (2)]  📝 [Save as Draft]  🔄 [Clear All]               │
│                                                                                                                             │
│ AI Progress: [██████░░░░░░░░░░░░░░░] 40% (1 of 4 rows processed) - Processing: "gracias"                                  │
│                                                                                                                             │
│ Status Legend: ✅ Ready to save | ⏳ Needs input | 🤖 AI generating | ❌ Has errors | 📝 Draft saved                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
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

**Enhanced Single-Step Workflow:**

**Key Features:**
-   **Integrated Template & Deck Selection:** Template and deck selection happen within the main interface, allowing users to switch contexts without losing their work.
-   **Real-Time Status Tracking:** Each row shows its current status (✅ Ready, ⏳ Needs input, 🤖 AI generating, ❌ Has errors).
-   **Immediate Saving:** Cards can be saved to the selected deck as soon as they're ready, without needing to complete all cards.
-   **Batch Context:** Global context field helps AI generate more cohesive content across all cards in the session.
-   **Smart Action Buttons:** Action buttons show counts and are enabled/disabled based on current card states.

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
-   **Primary Trigger ("Generate AI for Eligible Rows (N)"):** A smart button that shows the count of eligible rows and triggers AI content generation for all rows that have the necessary input fields filled and haven't been processed yet. The global "Batch Context" is used by the AI for all items in this batch request.
-   **Loading State & Progress Visualization:**
    -   **Real-Time Progress:** When "Generate AI for Eligible Rows" is clicked, an overall progress bar shows current processing status (e.g., `40% (1 of 4 rows processed) - Processing: "gracias"`).
    -   Individual rows show "🤖 Generating..." in their AI fields during processing.
    -   Upon completion, AI-generated fields are populated and feedback icons (👍/👎/💬) become active.
    -   Row status updates to ✅ Ready when AI generation completes successfully.

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

After users have inputted data, utilized AI generation, and refined their flashcards within the table, they can save completed cards directly using the "Save All Ready Cards" button. The deck is pre-selected in the interface, making the save process immediate and seamless.

**Error Handling:**
-   **Validation Errors:** Clearly displayed at the cell or row level, preventing invalid data from being saved without user attention.
-   **AI Generation Errors:** If the batch AI generation fails for specific rows, an error message or indicator (e.g., `<Row Error: AI gen failed>`) is shown in the relevant cells or an annotation for that row. Users can then choose to retry generation for those rows (possibly individually via the "..." menu) or manually fill the content. Global AI service errors (network issues, rate limits for the batch) are communicated through general notifications, possibly indicating which rows were affected or if the entire batch failed.

### 1.4 Integrated Saving & Deck Management

In the single-step interface, saving is integrated directly into the main workflow. Users pre-select their target deck and can save cards as they become ready, without needing a separate save step.

#### Seamless Save Process

1. **Pre-Selected Deck:** Users select their target deck from the dropdown in the main interface header
2. **Real-Time Save:** The "Save All Ready Cards (N)" button saves all cards with ✅ Ready status immediately  
3. **Incremental Workflow:** Users can continue adding and refining cards while previously completed cards are already saved
4. **Quick Deck Switching:** Users can change target deck at any time without losing work in progress

#### Save Operation Behavior

**Immediate Save:**
- Clicking "Save All Ready Cards (N)" immediately saves all ready cards to the pre-selected deck
- A brief success notification appears: "3 cards saved to My Spanish Vocab"
- Saved cards remain in the table but their status changes to "📝 Saved"
- Users can continue working on remaining cards or add new ones

**Deck Management:**
- **Change Deck:** Click the deck dropdown to select a different target deck
- **New Deck:** Click "[+ New Deck]" to create and immediately select a new deck
- **Deck Info:** Current deck shows card count for context

#### Post-Save Experience

**Continuous Workflow:**
- After saving, the interface remains active for continued card creation
- "Save All Ready Cards" button updates to reflect remaining unsaved cards
- Users can mix saved and unsaved cards in the same session
- Clear indicators show which cards have been saved vs. still in progress

**Session Management:**
- **Save as Draft:** Preserves entire session (saved and unsaved cards) for later resumption
- **Clear All:** Removes all cards and resets to clean state
- **Auto-save:** Draft is automatically saved every few minutes to prevent data loss

**Quick Actions:**
- "View Deck" link appears after first save to quickly navigate to the updated deck
- "Create Similar" button allows rapid creation of cards using the same template and context
- Session statistics show total cards created, saved, and remaining

**Enhanced Draft Management:**
- **Auto-Save Drafts:** The system automatically saves session state every few minutes
- **Manual Draft Save:** Users can explicitly save current session state including template, deck selection, all card data, and AI feedback
- **Resume Sessions:** Draft sessions can be resumed from the dashboard or a "Recent Drafts" quick action
- **Cross-Template Drafts:** Users can save drafts that span multiple templates if they switch during a session
- **Draft Indicators:** Clear visual indicators show when a session has unsaved changes vs. is fully saved/drafted

This single-step approach eliminates the complexity of multi-stage workflows while providing a more fluid, iterative creation experience that matches natural content creation patterns.
