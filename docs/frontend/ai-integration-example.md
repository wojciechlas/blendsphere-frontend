# BlendSphere Frontend AI Integration Example

This document provides a concrete example of integrating the AI flashcard service into the existing BlendSphere frontend structure, following the established coding patterns and architecture.

## Project Structure Integration

Add these files to your existing BlendSphere frontend:

```
src/lib/
├── services/
│   └── ai-flashcard.service.ts          # AI service client
├── stores/
│   └── ai-flashcard.store.ts            # Reactive state management
├── types/
│   └── ai.types.ts                      # TypeScript definitions
└── components/
    ├── ai/
    │   ├── AIBatchGenerator.svelte       # Batch generation component
    │   ├── AIFlashcardRegenerator.svelte # Single regeneration component
    │   └── AIFeedbackModal.svelte        # Feedback collection component
    └── flashcards/
        ├── FlashcardCreator.svelte       # Enhanced with AI features
        └── FlashcardEditor.svelte        # Enhanced with AI regeneration
```

## Integration with Existing Template System

### Enhanced Template Selection Component

```svelte
<!-- src/lib/components/templates/TemplateSelector.svelte -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import AIBatchGenerator from '$lib/components/ai/AIBatchGenerator.svelte';
  import { templatesStore } from '$lib/stores/templates.store.js';
  import WandIcon from '@tabler/icons-svelte/icons/wand';
  import type { Template } from '$lib/types/template.types.js';
  import type { AIGeneratedFlashcard } from '$lib/types/ai.types.js';

  interface Props {
    selectedTemplate?: Template;
    onTemplateSelect?: (template: Template) => void;
    onAIGenerated?: (flashcards: AIGeneratedFlashcard[]) => void;
    showAIFeatures?: boolean;
  }

  let { 
    selectedTemplate, 
    onTemplateSelect,
    onAIGenerated,
    showAIFeatures = true 
  }: Props = $props();

  // Subscribe to templates store
  let templates = $state($templatesStore.templates);
  $effect(() => {
    const unsubscribe = templatesStore.subscribe(state => {
      templates = state.templates;
    });
    return unsubscribe;
  });

  const handleTemplateChange = (value: string): void => {
    const template = templates.find(t => t.id === value);
    if (template) {
      onTemplateSelect?.(template);
    }
  };

  const handleAIGeneration = (flashcards: AIGeneratedFlashcard[]): void => {
    onAIGenerated?.(flashcards);
  };
</script>

<div class="space-y-4">
  <div class="flex items-center gap-4">
    <Select.Root onSelectedChange={handleTemplateChange}>
      <Select.Trigger class="flex-1">
        <Select.Value placeholder="Select a template" />
      </Select.Trigger>
      <Select.Content>
        {#each templates as template (template.id)}
          <Select.Item value={template.id}>
            {template.name}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    {#if showAIFeatures && selectedTemplate}
      <AIBatchGenerator 
        template={selectedTemplate} 
        onGenerated={handleAIGeneration} 
      />
    {/if}
  </div>

  {#if selectedTemplate}
    <div class="rounded-md border p-3 bg-muted/50">
      <h4 class="font-medium mb-2">{selectedTemplate.name}</h4>
      <p class="text-sm text-muted-foreground mb-2">{selectedTemplate.description}</p>
      <div class="flex flex-wrap gap-2">
        {#each selectedTemplate.fields as field (field.id)}
          <span class="px-2 py-1 bg-background rounded text-xs border">
            {field.name}
          </span>
        {/each}
      </div>
    </div>
  {/if}
</div>
```

### Enhanced Deck Creator with AI Integration

```svelte
<!-- src/lib/components/decks/DeckCreator.svelte -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Form from '$lib/components/ui/form/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import TemplateSelector from '$lib/components/templates/TemplateSelector.svelte';
  import FlashcardCreator from '$lib/components/flashcards/FlashcardCreator.svelte';
  import { decksStore } from '$lib/stores/decks.store.js';
  import { pb } from '$lib/pocketbase.js';
  import { goto } from '$app/navigation';
  import PlusIcon from '@tabler/icons-svelte/icons/plus';
  import WandIcon from '@tabler/icons-svelte/icons/wand';
  import type { Template } from '$lib/types/template.types.js';
  import type { AIGeneratedFlashcard } from '$lib/types/ai.types.js';

  // Form state
  let deckName = $state('');
  let deckDescription = $state('');
  let selectedTemplate = $state<Template | undefined>();
  let flashcards = $state<Array<{
    front: string;
    back: string;
    hint?: string;
    explanation?: string;
    aiGenerated?: boolean;
    aiMetadata?: any;
  }>>([]);
  let isCreating = $state(false);
  let activeTab = $state('manual');

  const handleTemplateSelect = (template: Template): void => {
    selectedTemplate = template;
  };

  const handleAIGenerated = async (aiFlashcards: AIGeneratedFlashcard[]): Promise<void> => {
    // Convert AI flashcards to local format
    const newFlashcards = aiFlashcards.map(ai => ({
      front: ai.front,
      back: ai.back,
      hint: ai.hint,
      explanation: ai.explanation,
      aiGenerated: true,
      aiMetadata: ai.metadata,
    }));

    flashcards = [...flashcards, ...newFlashcards];
    activeTab = 'review'; // Switch to review tab
  };

  const handleManualAdd = (flashcard: Omit<typeof flashcards[0], 'aiGenerated'>): void => {
    flashcards = [...flashcards, { ...flashcard, aiGenerated: false }];
  };

  const removeFlashcard = (index: number): void => {
    flashcards = flashcards.filter((_, i) => i !== index);
  };

  const createDeck = async (): Promise<void> => {
    if (!deckName.trim() || flashcards.length === 0) return;

    try {
      isCreating = true;

      // Create deck
      const deck = await pb.collection('decks').create({
        name: deckName,
        description: deckDescription,
        user: pb.authStore.model?.id,
        isPublic: false,
      });

      // Create flashcards
      const flashcardPromises = flashcards.map(fc => 
        pb.collection('flashcards').create({
          deck: deck.id,
          template: selectedTemplate?.id,
          front: fc.front,
          back: fc.back,
          hint: fc.hint,
          explanation: fc.explanation,
          aiGenerated: fc.aiGenerated,
          aiMetadata: fc.aiMetadata,
        })
      );

      await Promise.all(flashcardPromises);

      // Refresh decks store
      await decksStore.fetchUserDecks();

      // Navigate to the new deck
      goto(`/decks/${deck.id}`);
    } catch (error) {
      console.error('Failed to create deck:', error);
    } finally {
      isCreating = false;
    }
  };
</script>

<div class="max-w-4xl mx-auto p-6 space-y-6">
  <div>
    <h1 class="text-2xl font-bold">Create New Deck</h1>
    <p class="text-muted-foreground">Create a new flashcard deck with manual or AI-assisted content creation.</p>
  </div>

  <!-- Deck Information -->
  <div class="space-y-4">
    <Form.Field>
      <Form.Label>Deck Name</Form.Label>
      <Form.Control>
        <Input bind:value={deckName} placeholder="Enter deck name" />
      </Form.Control>
    </Form.Field>

    <Form.Field>
      <Form.Label>Description (Optional)</Form.Label>
      <Form.Control>
        <Textarea bind:value={deckDescription} placeholder="Describe your deck" />
      </Form.Control>
    </Form.Field>
  </div>

  <!-- Template Selection -->
  <div>
    <h2 class="text-lg font-semibold mb-3">Select Template</h2>
    <TemplateSelector 
      bind:selectedTemplate
      onTemplateSelect={handleTemplateSelect}
      onAIGenerated={handleAIGenerated}
    />
  </div>

  <!-- Flashcard Creation -->
  <div>
    <h2 class="text-lg font-semibold mb-3">Add Flashcards</h2>
    
    <Tabs.Root bind:value={activeTab}>
      <Tabs.List class="grid w-full grid-cols-3">
        <Tabs.Trigger value="manual">
          <PlusIcon class="mr-2 h-4 w-4" />
          Manual Creation
        </Tabs.Trigger>
        <Tabs.Trigger value="ai" disabled={!selectedTemplate}>
          <WandIcon class="mr-2 h-4 w-4" />
          AI Generation
        </Tabs.Trigger>
        <Tabs.Trigger value="review">
          Review ({flashcards.length})
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="manual" class="space-y-4">
        {#if selectedTemplate}
          <FlashcardCreator 
            template={selectedTemplate} 
            onAdd={handleManualAdd}
          />
        {:else}
          <p class="text-muted-foreground">Please select a template first.</p>
        {/if}
      </Tabs.Content>

      <Tabs.Content value="ai" class="space-y-4">
        {#if selectedTemplate}
          <div class="text-center py-8 border-2 border-dashed rounded-lg">
            <WandIcon class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p class="text-muted-foreground mb-4">Use the AI generator above to create flashcards automatically.</p>
          </div>
        {:else}
          <p class="text-muted-foreground">Please select a template first.</p>
        {/if}
      </Tabs.Content>

      <Tabs.Content value="review" class="space-y-4">
        {#if flashcards.length === 0}
          <p class="text-muted-foreground text-center py-8">No flashcards created yet.</p>
        {:else}
          <div class="space-y-3">
            {#each flashcards as flashcard, index (index)}
              <div class="border rounded-lg p-4 space-y-2">
                <div class="flex justify-between items-start">
                  <div class="flex-1 space-y-2">
                    <div>
                      <span class="text-sm font-medium text-muted-foreground">Front:</span>
                      <p>{flashcard.front}</p>
                    </div>
                    <div>
                      <span class="text-sm font-medium text-muted-foreground">Back:</span>
                      <p>{flashcard.back}</p>
                    </div>
                    {#if flashcard.hint}
                      <div>
                        <span class="text-sm font-medium text-muted-foreground">Hint:</span>
                        <p class="text-sm">{flashcard.hint}</p>
                      </div>
                    {/if}
                  </div>
                  <div class="flex items-center gap-2">
                    {#if flashcard.aiGenerated}
                      <span class="px-2 py-1 bg-primary/10 text-primary text-xs rounded">AI Generated</span>
                    {/if}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onclick={() => removeFlashcard(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </Tabs.Content>
    </Tabs.Root>
  </div>

  <!-- Create Button -->
  <div class="flex justify-end">
    <Button 
      onclick={createDeck}
      disabled={isCreating || !deckName.trim() || flashcards.length === 0}
      size="lg"
    >
      {isCreating ? 'Creating...' : 'Create Deck'}
    </Button>
  </div>
</div>
```

## Integration with Existing Stores

### Enhanced Flashcards Store

```typescript
// src/lib/stores/flashcards.store.ts
import { writable } from 'svelte/store';
import { pb } from '$lib/pocketbase.js';
import { AIFlashcardService } from '$lib/services/ai-flashcard.service.js';
import type { Flashcard } from '$lib/types/flashcard.types.js';
import type { AIFeedbackRequest } from '$lib/types/ai.types.js';

interface FlashcardsState {
  flashcards: Flashcard[];
  loading: boolean;
  error: string | null;
}

function createFlashcardsStore() {
  const { subscribe, set, update } = writable<FlashcardsState>({
    flashcards: [],
    loading: false,
    error: null,
  });

  return {
    subscribe,

    async fetchDeckFlashcards(deckId: string): Promise<void> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const flashcards = await pb.collection('flashcards').getFullList({
          filter: `deck = "${deckId}"`,
          expand: 'template',
          sort: 'created',
        });

        update(state => ({
          ...state,
          flashcards: flashcards as Flashcard[],
          loading: false,
        }));
      } catch (error) {
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to fetch flashcards',
          loading: false,
        }));
      }
    },

    async submitAIFeedback(flashcardId: string, feedback: Omit<AIFeedbackRequest, 'flashcardId'>): Promise<void> {
      try {
        await AIFlashcardService.submitFeedback({
          flashcardId,
          ...feedback,
        });
      } catch (error) {
        console.error('Failed to submit AI feedback:', error);
        throw error;
      }
    },

    // ...existing methods
  };
}

export const flashcardsStore = createFlashcardsStore();
```

## Page-Level Integration Example

### AI-Enhanced Deck View Page

```svelte
<!-- src/routes/decks/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import AIBatchGenerator from '$lib/components/ai/AIBatchGenerator.svelte';
  import AIFlashcardRegenerator from '$lib/components/ai/AIFlashcardRegenerator.svelte';
  import FlashcardList from '$lib/components/flashcards/FlashcardList.svelte';
  import { decksStore } from '$lib/stores/decks.store.js';
  import { flashcardsStore } from '$lib/stores/flashcards.store.js';
  import { pb } from '$lib/pocketbase.js';
  import WandIcon from '@tabler/icons-svelte/icons/wand';
  import type { Deck, Template } from '$lib/types/index.js';
  import type { AIGeneratedFlashcard } from '$lib/types/ai.types.js';

  const deckId = $page.params.id;
  
  let deck = $state<Deck | null>(null);
  let template = $state<Template | null>(null);
  let showAIGenerator = $state(false);

  // Subscribe to stores
  let deckState = $state($decksStore);
  let flashcardState = $state($flashcardsStore);
  
  $effect(() => {
    const unsubscribeDeck = decksStore.subscribe(state => {
      deckState = state;
      deck = state.decks.find(d => d.id === deckId) || null;
    });
    
    const unsubscribeFlashcard = flashcardsStore.subscribe(state => {
      flashcardState = state;
    });

    return () => {
      unsubscribeDeck();
      unsubscribeFlashcard();
    };
  });

  onMount(async () => {
    // Fetch deck and flashcards
    await Promise.all([
      decksStore.fetchDeck(deckId),
      flashcardsStore.fetchDeckFlashcards(deckId),
    ]);

    // Fetch template if deck has one
    if (deck?.template) {
      try {
        template = await pb.collection('templates').getOne(deck.template);
      } catch (error) {
        console.error('Failed to fetch template:', error);
      }
    }
  });

  const handleAIGenerated = async (aiFlashcards: AIGeneratedFlashcard[]): Promise<void> => {
    try {
      // Save AI-generated flashcards to the deck
      const promises = aiFlashcards.map(aiFlashcard =>
        pb.collection('flashcards').create({
          deck: deckId,
          template: template?.id,
          front: aiFlashcard.front,
          back: aiFlashcard.back,
          hint: aiFlashcard.hint,
          explanation: aiFlashcard.explanation,
          aiGenerated: true,
          aiConfidence: aiFlashcard.metadata.confidence,
          aiMetadata: aiFlashcard.metadata,
        })
      );

      await Promise.all(promises);

      // Refresh flashcards
      await flashcardsStore.fetchDeckFlashcards(deckId);
      
      showAIGenerator = false;
    } catch (error) {
      console.error('Failed to save AI-generated flashcards:', error);
    }
  };

  const handleFlashcardRegenerated = async (flashcardId: string, newFlashcard: AIGeneratedFlashcard): Promise<void> => {
    try {
      // Update the existing flashcard with AI-generated content
      await pb.collection('flashcards').update(flashcardId, {
        front: newFlashcard.front,
        back: newFlashcard.back,
        hint: newFlashcard.hint,
        explanation: newFlashcard.explanation,
        aiGenerated: true,
        aiConfidence: newFlashcard.metadata.confidence,
        aiMetadata: newFlashcard.metadata,
      });

      // Refresh flashcards
      await flashcardsStore.fetchDeckFlashcards(deckId);
    } catch (error) {
      console.error('Failed to update flashcard:', error);
    }
  };
</script>

<svelte:head>
  <title>{deck?.name || 'Deck'} - BlendSphere</title>
</svelte:head>

{#if deck}
  <div class="container mx-auto p-6 space-y-6">
    <!-- Deck Header -->
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-3xl font-bold">{deck.name}</h1>
        {#if deck.description}
          <p class="text-muted-foreground mt-1">{deck.description}</p>
        {/if}
      </div>
      
      {#if template}
        <div class="flex gap-2">
          <Button 
            variant="outline" 
            onclick={() => showAIGenerator = !showAIGenerator}
          >
            <WandIcon class="mr-2 h-4 w-4" />
            AI Generate
          </Button>
        </div>
      {/if}
    </div>

    <!-- AI Generator -->
    {#if showAIGenerator && template}
      <div class="border rounded-lg p-4 bg-muted/50">
        <h3 class="font-medium mb-3">AI Flashcard Generation</h3>
        <AIBatchGenerator 
          {template} 
          onGenerated={handleAIGenerated}
        />
      </div>
    {/if}

    <!-- Content Tabs -->
    <Tabs.Root value="flashcards">
      <Tabs.List>
        <Tabs.Trigger value="flashcards">
          Flashcards ({flashcardState.flashcards.length})
        </Tabs.Trigger>
        <Tabs.Trigger value="study">Study</Tabs.Trigger>
        <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="flashcards" class="space-y-4">
        {#if flashcardState.loading}
          <div class="text-center py-8">
            <p>Loading flashcards...</p>
          </div>
        {:else if flashcardState.flashcards.length === 0}
          <div class="text-center py-12 border-2 border-dashed rounded-lg">
            <p class="text-muted-foreground mb-4">No flashcards in this deck yet.</p>
            {#if template}
              <Button onclick={() => showAIGenerator = true}>
                <WandIcon class="mr-2 h-4 w-4" />
                Generate with AI
              </Button>
            {/if}
          </div>
        {:else}
          <FlashcardList 
            flashcards={flashcardState.flashcards}
            showAIFeatures={!!template}
            onRegenerate={handleFlashcardRegenerated}
          />
        {/if}
      </Tabs.Content>

      <Tabs.Content value="study">
        <!-- Study mode implementation -->
        <p>Study mode coming soon...</p>
      </Tabs.Content>

      <Tabs.Content value="settings">
        <!-- Deck settings implementation -->
        <p>Deck settings coming soon...</p>
      </Tabs.Content>
    </Tabs.Root>
  </div>
{:else}
  <div class="container mx-auto p-6">
    <p>Loading deck...</p>
  </div>
{/if}
```

This example demonstrates how to integrate the AI flashcard service into the existing BlendSphere frontend architecture while maintaining consistency with the established patterns and components. The integration follows Svelte 5 best practices, uses proper TypeScript typing, and implements comprehensive error handling.
