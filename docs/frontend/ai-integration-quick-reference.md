# AI Flashcard Service Integration - Quick Reference

## API Endpoints

| Endpoint | Method | Purpose | Request Type |
|----------|--------|---------|--------------|
| `/api/ai/generate-flashcards` | POST | Batch generate flashcards | `FlashcardGenerationRequest` |
| `/api/ai/regenerate-flashcard` | POST | Regenerate single flashcard | `AIRegenerationRequest` |
| `/api/ai/feedback` | POST | Submit AI feedback | `AIFeedbackRequest` |

## Required Imports

```typescript
// Core service
import { AIFlashcardService } from '$lib/services/ai-flashcard.service.js';

// Store for state management
import { aiFlashcardStore } from '$lib/stores/ai-flashcard.store.js';

// Types
import type { 
  FlashcardGenerationRequest,
  AIGeneratedFlashcard,
  AIRegenerationRequest 
} from '$lib/types/ai.types.js';
```

## Basic Usage Patterns

### 1. Batch Generation

```typescript
const flashcards = await aiFlashcardStore.generateBatch({
  templateId: 'template-id',
  items: [
    { word: 'hello', definition: 'greeting' },
    { word: 'goodbye', definition: 'farewell' }
  ],
  options: {
    language: 'en',
    difficulty: 'medium'
  }
});
```

### 2. Single Regeneration

```typescript
const newFlashcard = await aiFlashcardStore.regenerateSingle({
  templateId: 'template-id',
  inputFields: { word: 'hello', definition: 'greeting' },
  feedback: 'Make it more challenging',
  improvementAreas: ['difficulty', 'creativity']
});
```

### 3. Feedback Submission

```typescript
await AIFlashcardService.submitFeedback({
  flashcardId: 'flashcard-id',
  rating: 4,
  feedback: 'Good quality but could be clearer',
  category: 'quality'
});
```

## Component Integration Template

```svelte
<script lang="ts">
  import { aiFlashcardStore } from '$lib/stores/ai-flashcard.store.js';
  import type { Template } from '$lib/types/template.types.js';

  let { template }: { template: Template } = $props();
  
  // Subscribe to AI store state
  let aiState = $state($aiFlashcardStore);
  $effect(() => {
    const unsubscribe = aiFlashcardStore.subscribe(state => {
      aiState = state;
    });
    return unsubscribe;
  });

  const handleGenerate = async (): Promise<void> => {
    try {
      const flashcards = await aiFlashcardStore.generateBatch({
        templateId: template.id,
        items: [/* your data */],
      });
      // Handle success
    } catch (error) {
      console.error('AI generation failed:', error);
    }
  };
</script>

<!-- UI with loading states -->
{#if aiState.isGenerating}
  <p>Generating flashcards...</p>
{:else if aiState.error}
  <p class="error">{aiState.error}</p>
{:else}
  <button onclick={handleGenerate}>Generate with AI</button>
{/if}
```

## Error Handling Checklist

- ✅ Wrap AI calls in try-catch blocks
- ✅ Display user-friendly error messages
- ✅ Handle rate limiting gracefully
- ✅ Check authentication before API calls
- ✅ Validate input data before sending
- ✅ Show loading states during operations

## Authentication Requirement

All AI endpoints require authenticated users. Verify authentication:

```typescript
import { pb } from '$lib/pocketbase.js';

if (!pb.authStore.isValid) {
  throw new Error('Authentication required');
}
```

## Performance Tips

1. **Use batch generation** for multiple flashcards instead of individual calls
2. **Cache template data** to avoid repeated database queries
3. **Implement debouncing** for real-time regeneration features
4. **Show progress indicators** for long-running operations
5. **Handle rate limits** by implementing retry logic with backoff

## Common Patterns

### Loading State Management

```typescript
let loading = $state(false);
let error = $state<string | null>(null);

const handleAsyncOperation = async (): Promise<void> => {
  try {
    loading = true;
    error = null;
    await aiOperation();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    loading = false;
  }
};
```

### Data Transformation

```typescript
// Convert AI flashcards to database records
const convertToFlashcardRecord = (aiFlashcard: AIGeneratedFlashcard) => ({
  front: aiFlashcard.front,
  back: aiFlashcard.back,
  hint: aiFlashcard.hint,
  explanation: aiFlashcard.explanation,
  difficulty: aiFlashcard.difficulty,
  tags: aiFlashcard.tags,
  aiGenerated: true,
  aiConfidence: aiFlashcard.metadata.confidence,
  aiMetadata: aiFlashcard.metadata,
});
```

## Environment Variables Required

```bash
OPENAI_API_KEY=your_key_here
AI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
AI_RATE_LIMIT=30
```

For complete implementation details, see the full integration guide.
