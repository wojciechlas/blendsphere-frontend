# AI Flashcard Service Frontend Integration Guide

This guide provides step-by-step instructions for connecting the BlendSphere Svelte frontend to the PocketBase AI flashcard service. These instructions are designed for LLM code generators and follow BlendSphere's coding standards.

## Overview

The AI flashcard service provides three main endpoints through PocketBase:
- **Batch Generation**: Generate multiple flashcards from template and data
- **Single Regeneration**: Regenerate a single flashcard with feedback
- **Feedback Collection**: Record user feedback on AI-generated content

## Prerequisites

1. PocketBase server running with AI service configured
2. User authenticated in the frontend
3. Templates collection accessible
4. Environment variables configured (OPENAI_API_KEY)

## Service Integration Architecture

### 1. Create AI Service Client

Create a dedicated service for AI API calls:

**File: `src/lib/services/ai-flashcard.service.ts`**

```typescript
import { pb } from '$lib/pocketbase.js';
import type { 
  FlashcardGenerationRequest, 
  FlashcardGenerationResponse,
  AIRegenerationRequest,
  AIRegenerationResponse,
  AIFeedbackRequest 
} from '$lib/types/ai.types.js';

export class AIFlashcardService {
  private static readonly BASE_URL = '/api/ai';

  /**
   * Generate multiple flashcards using AI based on template and input data
   */
  static async generateBatchFlashcards(
    request: FlashcardGenerationRequest
  ): Promise<FlashcardGenerationResponse> {
    try {
      const response = await pb.send(`${this.BASE_URL}/generate-flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      return response as FlashcardGenerationResponse;
    } catch (error) {
      console.error('AI batch generation failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate flashcards'
      );
    }
  }

  /**
   * Regenerate a single flashcard with user feedback
   */
  static async regenerateSingleFlashcard(
    request: AIRegenerationRequest
  ): Promise<AIRegenerationResponse> {
    try {
      const response = await pb.send(`${this.BASE_URL}/regenerate-flashcard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      return response as AIRegenerationResponse;
    } catch (error) {
      console.error('AI regeneration failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to regenerate flashcard'
      );
    }
  }

  /**
   * Submit feedback about AI-generated content
   */
  static async submitFeedback(request: AIFeedbackRequest): Promise<void> {
    try {
      await pb.send(`${this.BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('AI feedback submission failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to submit feedback'
      );
    }
  }
}
```

### 2. Define TypeScript Types

Create type definitions for AI service interactions:

**File: `src/lib/types/ai.types.ts`**

```typescript
export interface FlashcardGenerationRequest {
  templateId: string;
  items: Array<Record<string, string>>;
  options?: {
    language?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    count?: number;
  };
}

export interface FlashcardGenerationResponse {
  success: boolean;
  flashcards: AIGeneratedFlashcard[];
  errors?: string[];
  metadata?: {
    processingTime: number;
    totalGenerated: number;
    totalFailed: number;
  };
}

export interface AIGeneratedFlashcard {
  data: Record<string, string>
  metadata: {
    confidence: number;
    aiGenerated: boolean;
    templateId: string;
    generatedAt: string;
  };
}

export interface AIRegenerationRequest {
  templateId: string;
  inputFields: Record<string, string>;
  previousFlashcard?: {
    front: string;
    back: string;
  };
  feedback?: string;
  improvementAreas?: Array<'accuracy' | 'clarity' | 'difficulty' | 'creativity'>;
}

export interface AIRegenerationResponse {
  success: boolean;
  flashcard?: AIGeneratedFlashcard;
  error?: string;
}

export interface AIFeedbackRequest {
  flashcardId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback: string;
  category: 'quality' | 'accuracy' | 'difficulty' | 'usefulness';
  improvementSuggestions?: string[];
}
```

### 3. Create Svelte Store for AI State Management

Implement reactive state management for AI operations:

**File: `src/lib/stores/ai-flashcard.store.ts`**

```typescript
import { writable } from 'svelte/store';
import { AIFlashcardService } from '$lib/services/ai-flashcard.service.js';
import type { 
  FlashcardGenerationRequest, 
  AIGeneratedFlashcard,
  AIRegenerationRequest 
} from '$lib/types/ai.types.js';

interface AIFlashcardState {
  isGenerating: boolean;
  isRegenerating: boolean;
  generatedFlashcards: AIGeneratedFlashcard[];
  error: string | null;
  progress: number;
}

function createAIFlashcardStore() {
  const { subscribe, set, update } = writable<AIFlashcardState>({
    isGenerating: false,
    isRegenerating: false,
    generatedFlashcards: [],
    error: null,
    progress: 0,
  });

  return {
    subscribe,
    
    async generateBatch(request: FlashcardGenerationRequest): Promise<AIGeneratedFlashcard[]> {
      update(state => ({
        ...state,
        isGenerating: true,
        error: null,
        progress: 0,
      }));

      try {
        const response = await AIFlashcardService.generateBatchFlashcards(request);
        
        if (response.success) {
          update(state => ({
            ...state,
            isGenerating: false,
            generatedFlashcards: response.flashcards,
            progress: 100,
          }));
          return response.flashcards;
        } else {
          throw new Error(response.errors?.join(', ') || 'Generation failed');
        }
      } catch (error) {
        update(state => ({
          ...state,
          isGenerating: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
        throw error;
      }
    },

    async regenerateSingle(request: AIRegenerationRequest): Promise<AIGeneratedFlashcard> {
      update(state => ({
        ...state,
        isRegenerating: true,
        error: null,
      }));

      try {
        const response = await AIFlashcardService.regenerateSingleFlashcard(request);
        
        if (response.success && response.flashcard) {
          update(state => ({
            ...state,
            isRegenerating: false,
          }));
          return response.flashcard;
        } else {
          throw new Error(response.error || 'Regeneration failed');
        }
      } catch (error) {
        update(state => ({
          ...state,
          isRegenerating: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
        throw error;
      }
    },

    reset(): void {
      set({
        isGenerating: false,
        isRegenerating: false,
        generatedFlashcards: [],
        error: null,
        progress: 0,
      });
    },
  };
}

export const aiFlashcardStore = createAIFlashcardStore();
```

## Component Implementation Examples

### 4. Batch Generation Component

Create a component for batch flashcard generation:

**File: `src/lib/components/ai/AIBatchGenerator.svelte`**

```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as Form from '$lib/components/ui/form/index.js';
  import { Progress } from '$lib/components/ui/progress/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { aiFlashcardStore } from '$lib/stores/ai-flashcard.store.js';
  import WandIcon from '@tabler/icons-svelte/icons/wand';
  import type { Template } from '$lib/types/template.types.js';

  interface Props {
    template: Template;
    onGenerated?: (flashcards: AIGeneratedFlashcard[]) => void;
  }

  let { template, onGenerated }: Props = $props();

  let open = $state(false);
  let inputData = $state('');
  let language = $state('en');
  let difficulty = $state<'easy' | 'medium' | 'hard'>('medium');

  // Subscribe to store state
  let storeState = $state($aiFlashcardStore);
  $effect(() => {
    const unsubscribe = aiFlashcardStore.subscribe(state => {
      storeState = state;
    });
    return unsubscribe;
  });

  const handleGenerate = async (): Promise<void> => {
    if (!inputData.trim()) return;

    try {
      // Parse input data (assume CSV or line-separated format)
      const items = inputData
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const item: Record<string, string> = {};
          
          template.fields.forEach((field, index) => {
            item[field.name] = values[index] || '';
          });
          
          return item;
        });

      const flashcards = await aiFlashcardStore.generateBatch({
        templateId: template.id,
        items,
        options: {
          language,
          difficulty,
          count: items.length,
        },
      });

      onGenerated?.(flashcards);
      open = false;
      inputData = '';
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger asChild let:builder>
    <Button builders={[builder]} variant="outline" size="sm">
      <WandIcon class="mr-2 h-4 w-4" />
      Generate with AI
    </Button>
  </Dialog.Trigger>
  
  <Dialog.Content class="max-w-2xl">
    <Dialog.Header>
      <Dialog.Title>AI Flashcard Generation</Dialog.Title>
      <Dialog.Description>
        Generate flashcards using the "{template.name}" template with AI assistance.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <Form.Field>
        <Form.Label>Input Data</Form.Label>
        <Form.Control>
          <Textarea
            bind:value={inputData}
            placeholder="Enter data (one item per line, comma-separated values)&#10;Example:&#10;apple, red fruit&#10;banana, yellow fruit"
            class="min-h-32"
            disabled={storeState.isGenerating}
          />
        </Form.Control>
        <Form.Description>
          Provide input data for each flashcard. Use the template fields: 
          {template.fields.map(f => f.name).join(', ')}
        </Form.Description>
      </Form.Field>

      <div class="grid grid-cols-2 gap-4">
        <Form.Field>
          <Form.Label>Language</Form.Label>
          <Form.Control>
            <Input
              bind:value={language}
              placeholder="en, es, fr, etc."
              disabled={storeState.isGenerating}
            />
          </Form.Control>
        </Form.Field>

        <Form.Field>
          <Form.Label>Difficulty</Form.Label>
          <Form.Control>
            <select
              bind:value={difficulty}
              class="w-full rounded-md border border-input bg-background px-3 py-2"
              disabled={storeState.isGenerating}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </Form.Control>
        </Form.Field>
      </div>

      {#if storeState.isGenerating}
        <div class="space-y-2">
          <Progress value={storeState.progress} class="w-full" />
          <p class="text-sm text-muted-foreground text-center">
            Generating flashcards... Please wait.
          </p>
        </div>
      {/if}

      {#if storeState.error}
        <div class="rounded-md bg-destructive/15 p-3">
          <p class="text-sm text-destructive">{storeState.error}</p>
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <Button
        variant="outline"
        onclick={() => { open = false; }}
        disabled={storeState.isGenerating}
      >
        Cancel
      </Button>
      <Button
        onclick={handleGenerate}
        disabled={storeState.isGenerating || !inputData.trim()}
      >
        {storeState.isGenerating ? 'Generating...' : 'Generate Flashcards'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

### 5. Single Regeneration Component

Create a component for regenerating individual flashcards:

**File: `src/lib/components/ai/AIFlashcardRegenerator.svelte`**

```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as Form from '$lib/components/ui/form/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { aiFlashcardStore } from '$lib/stores/ai-flashcard.store.js';
  import RefreshIcon from '@tabler/icons-svelte/icons/refresh';
  import type { Flashcard, Template } from '$lib/types/index.js';
  import type { AIGeneratedFlashcard } from '$lib/types/ai.types.js';

  interface Props {
    flashcard: Flashcard;
    template: Template;
    onRegenerated?: (newFlashcard: AIGeneratedFlashcard) => void;
  }

  let { flashcard, template, onRegenerated }: Props = $props();

  let open = $state(false);
  let feedback = $state('');
  let improvementAreas = $state<Array<'accuracy' | 'clarity' | 'difficulty' | 'creativity'>>([]);

  // Subscribe to store state
  let storeState = $state($aiFlashcardStore);
  $effect(() => {
    const unsubscribe = aiFlashcardStore.subscribe(state => {
      storeState = state;
    });
    return unsubscribe;
  });

  const handleRegenerate = async (): Promise<void> => {
    try {
      // Extract input fields from current flashcard
      const inputFields: Record<string, string> = {};
      template.fields.forEach(field => {
        // Map flashcard content back to template fields
        // This is template-specific logic that needs to be implemented
        inputFields[field.name] = flashcard.content[field.name] || '';
      });

      const newFlashcard = await aiFlashcardStore.regenerateSingle({
        templateId: template.id,
        inputFields,
        previousFlashcard: {
          front: flashcard.front,
          back: flashcard.back,
        },
        feedback: feedback.trim() || undefined,
        improvementAreas: improvementAreas.length > 0 ? improvementAreas : undefined,
      });

      onRegenerated?.(newFlashcard);
      open = false;
      feedback = '';
      improvementAreas = [];
    } catch (error) {
      console.error('Regeneration failed:', error);
    }
  };

  const toggleImprovementArea = (area: 'accuracy' | 'clarity' | 'difficulty' | 'creativity'): void => {
    if (improvementAreas.includes(area)) {
      improvementAreas = improvementAreas.filter(a => a !== area);
    } else {
      improvementAreas = [...improvementAreas, area];
    }
  };
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger asChild let:builder>
    <Button builders={[builder]} variant="ghost" size="sm">
      <RefreshIcon class="h-4 w-4" />
    </Button>
  </Dialog.Trigger>
  
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Regenerate Flashcard</Dialog.Title>
      <Dialog.Description>
        Use AI to improve this flashcard based on your feedback.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <div class="rounded-md border p-3 bg-muted/50">
        <p class="text-sm font-medium mb-2">Current Flashcard:</p>
        <div class="text-sm space-y-1">
          <p><strong>Front:</strong> {flashcard.front}</p>
          <p><strong>Back:</strong> {flashcard.back}</p>
        </div>
      </div>

      <Form.Field>
        <Form.Label>Feedback (Optional)</Form.Label>
        <Form.Control>
          <Textarea
            bind:value={feedback}
            placeholder="Describe what you'd like to improve about this flashcard..."
            class="min-h-20"
            disabled={storeState.isRegenerating}
          />
        </Form.Control>
      </Form.Field>

      <Form.Field>
        <Form.Label>Improvement Areas</Form.Label>
        <div class="grid grid-cols-2 gap-2">
          {#each ['accuracy', 'clarity', 'difficulty', 'creativity'] as area}
            <div class="flex items-center space-x-2">
              <Checkbox
                checked={improvementAreas.includes(area)}
                onCheckedChange={() => toggleImprovementArea(area)}
                disabled={storeState.isRegenerating}
              />
              <label class="text-sm capitalize">{area}</label>
            </div>
          {/each}
        </div>
      </Form.Field>

      {#if storeState.error}
        <div class="rounded-md bg-destructive/15 p-3">
          <p class="text-sm text-destructive">{storeState.error}</p>
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <Button
        variant="outline"
        onclick={() => { open = false; }}
        disabled={storeState.isRegenerating}
      >
        Cancel
      </Button>
      <Button
        onclick={handleRegenerate}
        disabled={storeState.isRegenerating}
      >
        {storeState.isRegenerating ? 'Regenerating...' : 'Regenerate'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

## Usage Examples

### 6. Integration in Deck Creation

Example of using AI generation in a deck creation flow:

```svelte
<script lang="ts">
  import AIBatchGenerator from '$lib/components/ai/AIBatchGenerator.svelte';
  import type { Template, Deck } from '$lib/types/index.js';
  import type { AIGeneratedFlashcard } from '$lib/types/ai.types.js';

  let { deck, template }: { deck: Deck; template: Template } = $props();

  const handleAIGenerated = async (flashcards: AIGeneratedFlashcard[]): Promise<void> => {
    try {
      // Convert AI-generated flashcards to regular flashcards and save
      for (const aiFlashcard of flashcards) {
        await pb.collection('flashcards').create({
          deck: deck.id,
          template: template.id,
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
      }
      
      // Refresh deck or emit event
      console.log(`Generated ${flashcards.length} flashcards`);
    } catch (error) {
      console.error('Failed to save AI-generated flashcards:', error);
    }
  };
</script>

<div class="deck-creation-form">
  <!-- Other deck creation UI -->
  
  <div class="ai-generation-section">
    <h3>AI-Powered Generation</h3>
    <AIBatchGenerator {template} onGenerated={handleAIGenerated} />
  </div>
</div>
```

## Error Handling Best Practices

### 7. Comprehensive Error Handling

```typescript
// In your component or service
const handleAIOperation = async () => {
  try {
    const result = await aiFlashcardStore.generateBatch(request);
    // Handle success
  } catch (error) {
    if (error instanceof Error) {
      switch (true) {
        case error.message.includes('rate limit'):
          toast.error('Rate limit exceeded. Please wait a moment and try again.');
          break;
        case error.message.includes('template not found'):
          toast.error('Template not found. Please select a valid template.');
          break;
        case error.message.includes('authentication'):
          toast.error('Authentication required. Please log in and try again.');
          break;
        default:
          toast.error(`AI generation failed: ${error.message}`);
      }
    } else {
      toast.error('An unexpected error occurred during AI generation.');
    }
  }
};
```

## Authentication Requirements

The AI service requires authentication through PocketBase. Ensure the user is logged in:

```typescript
import { pb } from '$lib/pocketbase.js';

// Check authentication before making AI requests
if (!pb.authStore.isValid) {
  throw new Error('Authentication required for AI features');
}
```

## Testing the Integration

### 8. Test Component

Create a simple test component to verify the integration:

```svelte
<script lang="ts">
  import { AIFlashcardService } from '$lib/services/ai-flashcard.service.js';
  
  let testResult = $state('');
  
  const testConnection = async (): Promise<void> => {
    try {
      const response = await AIFlashcardService.generateBatchFlashcards({
        templateId: 'test-template-id',
        items: [{ word: 'hello', definition: 'greeting' }],
      });
      testResult = `Success: Generated ${response.flashcards.length} flashcards`;
    } catch (error) {
      testResult = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };
</script>

<button onclick={testConnection}>Test AI Connection</button>
<p>{testResult}</p>
```

## Performance Considerations

1. **Rate Limiting**: The service implements rate limiting (30 requests per user per minute by default)
2. **Caching**: Template data is cached for 5 minutes to reduce database queries
3. **Batch Processing**: Use batch generation for multiple flashcards to minimize API calls
4. **Error Boundaries**: Implement proper error handling to prevent UI crashes

## Environment Configuration

Ensure these environment variables are set in your PocketBase instance:

```bash
OPENAI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
AI_RATE_LIMIT=30
```

This guide provides everything needed to integrate the AI flashcard service into your BlendSphere frontend using Svelte 5 and TypeScript with proper error handling, type safety, and performance optimization.
