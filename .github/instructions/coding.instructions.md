---
applyTo: '**/*.ts,**/*.tsx,**/*.svelte'
---

# GitHub Copilot Instructions for BlendSphere Frontend

Follow these coding instructions when generating code for the BlendSphere language learning application.

## Technology Stack Constraints

- Use **Svelte 5** with runes (`$state`, `$derived`, `$effect`) - never use Svelte 4 patterns
- Write **TypeScript** with strict typing - avoid `any` type
- Import UI components from `$lib/components/ui/` using established patterns
- Use **Tailwind CSS** classes only - no inline styles or custom CSS
- Apply **shadcn-svelte@next** component patterns consistently

## Import Patterns

Always use these exact import patterns:

```typescript
// UI Components
import { Button } from '$lib/components/ui/button/index.js';
import * as Dialog from '$lib/components/ui/dialog/index.js';
import * as Form from '$lib/components/ui/form/index.js';

// Icons
import SearchIcon from '@tabler/icons-svelte/icons/search';

// Utils
import { cn } from '$lib/utils.js';

// Types
import type { ComponentProps } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
```

## Svelte 5 Component Pattern

Use this exact structure for all components:

```typescript
<script lang="ts">
  import { cn, type WithElementRef } from '$lib/utils.js';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> & {
    // Component-specific props here
  } = $props();

  // Use $state for reactive variables
  let localState = $state(defaultValue);

  // Use $derived for computed values
  let computedValue = $derived(localState.someProperty);

  // Use $effect for side effects
  $effect(() => {
    // Side effect logic
  });
</script>

<element
  bind:this={ref}
  class={cn('base-classes', className)}
  {...restProps}
>
  {@render children?.()}
</element>
```

## State Management Rules

- Use `$state()` for local component state
- Use `$derived()` for computed values
- Use `$effect()` for side effects and cleanup
- State variables that need to trigger UI updates or other reactive effects must be declared using Svelte 5 runes (e.g., `let count = $state(0);`). Plain `let` variables are not inherently reactive in this way.
- Always destructure props with defaults

```typescript
// Correct patterns
let count = $state(0);
let doubled = $derived(count * 2);
let items = $state<Item[]>([]);

// Props destructuring
let { title = 'Default', items = [], onSelect, ...restProps }: Props = $props();
```

## API Integration Patterns

### PocketBase (Core Data)

```typescript
import { pb } from '$lib/pocketbase.js';
import type { Record } from 'pocketbase';

// Always handle errors
try {
	const result = await pb.collection('collection').create(data);
} catch (error) {
	console.error('PocketBase error:', error);
	throw error;
}
```

### FastAPI (AI Features)

```typescript
import { aiClient } from '$lib/services/ai.service.js';

// Use typed responses
const response = await aiClient.post<ExpectedType>('/endpoint', data);
```

## Form Handling with Superforms

Always use this pattern for forms:

```typescript
<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { zod } from 'sveltekit-superforms/adapters';
  import * as Form from '$lib/components/ui/form/index.js';
  import { schema } from '$lib/schemas/schema.js';

  let { data } = $props();

  const form = superForm(data.form, {
    validators: zod(schema)
  });

  const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance>
  <Form.Field {form} name="fieldName">
    <Form.Control let:attrs>
      <Form.Label>Label</Form.Label>
      <Input {...attrs} bind:value={$formData.fieldName} />
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>
</form>
```

## UI Component Usage Rules

### Dialog/Modal Pattern

```typescript
<script lang="ts">
  let open = $state(false);
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger asChild let:builder>
    <Button builders={[builder]}>Open</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Title</Dialog.Title>
    </Dialog.Header>
    <!-- Content -->
  </Dialog.Content>
</Dialog.Root>
```

### Button Variants

```typescript
// Always specify variant and size
<Button variant="default" size="default">Default</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline" size="lg">Outline</Button>
```

## Styling Guidelines

- Use `cn()` utility for conditional classes
- Apply responsive prefixes: `sm:`, `md:`, `lg:`
- Use semantic color classes: `text-muted-foreground`, `bg-background`
- Never write custom CSS - use Tailwind classes only

```typescript
class={cn(
  'base-classes',
  variant === 'primary' && 'bg-primary text-primary-foreground',
  size === 'lg' && 'h-12 px-6',
  className
)}
```

## Error Handling Requirements

Always implement error boundaries:

```typescript
let loading = $state(false);
let error = $state<string | null>(null);

const handleAsync = async () => {
	try {
		loading = true;
		error = null;
		await operation();
	} catch (err) {
		error = err instanceof Error ? err.message : 'Unknown error';
	} finally {
		loading = false;
	}
};
```

## TypeScript Requirements

- Define interfaces for all props and data structures
- Use generic types for reusable components
- Always include return types for functions
- Use type imports: `import type { Type } from 'module';`

```typescript
interface Props {
	title: string;
	items: Item[];
	onSelect?: (item: Item) => void;
}

const processItems = (items: Item[]): ProcessedItem[] => {
	// Implementation
};
```

## Testing Patterns

Write tests using this structure:

```typescript
import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import Component from './Component.svelte';

test('renders correctly', () => {
	render(Component, { props: { prop: 'value' } });
	expect(screen.getByText('text')).toBeInTheDocument();
});
```

## Code Organization Rules

1. **Import Order:**

   - Svelte imports
   - SvelteKit imports (`$app/*`, `$lib/*`)
   - Third-party libraries
   - Local imports

2. **Component Structure:**

   - Imports
   - Type definitions
   - Props destructuring
   - Local state ($state, $derived)
   - Functions
   - Effects ($effect)

3. **File Naming:**
   - Components: `PascalCase.svelte`
   - Utilities: `kebab-case.ts`
   - Types: `kebab-case.types.ts`

## Accessibility Requirements

- Always include ARIA labels for interactive elements
- Use semantic HTML elements
- Ensure keyboard navigation works
- Test with screen readers in mind

```typescript
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  role="button"
>
  Close
</button>
```

## Performance Rules

- Use `{#key}` blocks for efficient re-rendering
- Implement lazy loading for large lists
- Use dynamic imports for code splitting
- Minimize reactive statements

## Anti-Patterns to Avoid

- ❌ Don't use `any` type
- ❌ Don't use Svelte 4 reactive statements (`$:`)
- ❌ Don't create inline styles
- ❌ Don't skip error handling
- ❌ Don't ignore TypeScript errors
- ❌ Don't create deeply nested components
- ❌ Don't expect plain `let` variables (those not initialized with a Svelte 5 rune like `$state`) to trigger Svelte's reactivity.

## Code Generation Preferences

When generating code:

1. Prioritize type safety
2. Use established component patterns
3. Include proper error handling
4. Apply consistent styling
5. Ensure accessibility compliance
6. Follow performance best practices
