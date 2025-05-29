---
applyTo: '**/*test.ts'
---

# GitHub Copilot Testing Instructions for BlendSphere Frontend

Follow these testing instructions when generating test code for the BlendSphere language learning application. These instructions are based on the official [Svelte Testing Library documentation](https://testing-library.com/docs/svelte-testing-library/example) and [Svelte Society testing recipes](https://sveltesociety.dev/recipes/testing-and-debugging/unit-testing-svelte-component).

## Testing Stack Constraints

- Use **Vitest** with workspace configuration - never use Jest
- Write tests in **TypeScript** with strict typing
- Make sure the tests are not generating any errors or warnings, especially **ESLint** warnings
- Use **@testing-library/svelte** for component testing
- Apply **@testing-library/jest-dom/vitest** matchers
- Mock with **vi.mock()** utilities only
- Use **userEvent** from @testing-library/user-event for interactions

## Test File Naming Rules

Always use these exact naming patterns:

```typescript
// Svelte components
ComponentName.svelte.test.ts;

// Services and utilities
service - name.service.test.ts;
utility - name.test.ts;

// Never use .spec.ts for Svelte components
// Always include .test.ts suffix
```

## Required Test Imports

Use this exact import pattern for all component tests:

```typescript
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ComponentName from './ComponentName.svelte';
```

## Svelte 5 Component Testing Pattern

Use this structure for all Svelte component tests:

```typescript
describe('ComponentName', () => {
	test('should render with default props', () => {
		render(ComponentName, {
			props: {
				propName: 'value'
			}
		});

		expect(screen.getByRole('button')).toBeInTheDocument();
	});

	test('should handle user interactions with function props', async () => {
		const user = userEvent.setup();
		const mockHandler = vi.fn();

		render(ComponentName, {
			props: {
				onClick: mockHandler
			}
		});

		await user.click(screen.getByRole('button'));
		expect(mockHandler).toHaveBeenCalledOnce();
	});

	test('should handle component events', async () => {
		const user = userEvent.setup();
		const mockHandler = vi.fn();

		const { component } = render(ComponentName);
		component.$on('customEvent', mockHandler);

		await user.click(screen.getByRole('button'));
		expect(mockHandler).toHaveBeenCalledOnce();
	});
});
```

## Testing Svelte 5 Runes

When testing components with $state, $derived, $effect:

```typescript
test('should update derived state reactively', async () => {
	const user = userEvent.setup();
	render(ReactiveComponent, {
		props: { initialValue: 0 }
	});

	const button = screen.getByRole('button', { name: /increment/i });
	const display = screen.getByTestId('derived-value');

	await user.click(button);
	expect(display).toHaveTextContent('1');
});

test('should trigger effects on state changes', async () => {
	const mockEffect = vi.fn();
	render(ComponentWithEffect, {
		props: { onEffect: mockEffect }
	});

	const input = screen.getByRole('textbox');
	await user.type(input, 'test');

	expect(mockEffect).toHaveBeenCalled();
});
```

## shadcn-svelte Component Testing

Test UI components with these patterns:

```typescript
test('should apply variant classes correctly', () => {
	render(ButtonComponent, {
		props: {
			variant: 'destructive',
			children: 'Delete'
		}
	});

	const button = screen.getByRole('button', { name: /delete/i });
	expect(button).toHaveClass('bg-destructive');
});

test('should forward props correctly', () => {
	render(ButtonComponent, {
		props: {
			'data-testid': 'custom-button',
			disabled: true
		}
	});

	const button = screen.getByTestId('custom-button');
	expect(button).toBeDisabled();
});
```

## Form Testing with Superforms

Always test forms with this pattern:

```typescript
import { superForm } from 'sveltekit-superforms/client';
import { zod } from 'sveltekit-superforms/adapters';

describe('FormComponent', () => {
	let mockForm: any;

	beforeEach(() => {
		mockForm = superForm({ email: '', password: '' }, { validators: zod(schema) });
	});

	test('should validate required fields', async () => {
		const user = userEvent.setup();
		render(FormComponent, { props: { form: mockForm } });

		await user.click(screen.getByRole('button', { name: /submit/i }));
		expect(screen.getByText(/email is required/i)).toBeInTheDocument();
	});

	test('should submit valid data', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		mockForm.options.onSubmit = onSubmit;

		render(FormComponent, { props: { form: mockForm } });

		await user.type(screen.getByLabelText(/email/i), 'test@example.com');
		await user.type(screen.getByLabelText(/password/i), 'password123');
		await user.click(screen.getByRole('button', { name: /submit/i }));

		expect(onSubmit).toHaveBeenCalled();
	});
});
```

## Testing Slots

Slots cannot be tested directly. Use wrapper components for testing slot functionality:

```typescript
// Create a test wrapper component file: TestComponent.test.svelte
// <script>
//   import ComponentWithSlots from './ComponentWithSlots.svelte';
// </script>
// <ComponentWithSlots>
//   <span data-testid="slot-content">Slot Content</span>
// </ComponentWithSlots>

import { render, screen, within } from '@testing-library/svelte';
import TestComponent from './TestComponent.test.svelte';

test('should render slot content correctly', () => {
	render(TestComponent);

	const heading = screen.getByRole('heading');
	const slotContent = within(heading).getByTestId('slot-content');

	expect(slotContent).toBeInTheDocument();
	expect(slotContent).toHaveTextContent('Slot Content');
});
```

## Testing Two-Way Data Binding

Use wrapper components with stores to test two-way binding:

```typescript
// Create a test wrapper component file: BindingTest.test.svelte
// <script>
//   import { writable } from 'svelte/store';
//   import InputComponent from './InputComponent.svelte';
//   export let valueStore;
// </script>
// <InputComponent bind:value={$valueStore} />

import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get, writable } from 'svelte/store';
import BindingTest from './BindingTest.test.svelte';

test('should update bound value on user input', async () => {
	const user = userEvent.setup();
	const valueStore = writable('');

	render(BindingTest, {
		props: { valueStore }
	});

	const input = screen.getByRole('textbox');
	await user.type(input, 'hello world');

	expect(get(valueStore)).toBe('hello world');
});
```

## Testing Components with Contexts

Pass contexts when rendering components that require them:

```typescript
import { render, screen } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import ComponentWithContext from './ComponentWithContext.svelte';

test('should access context values correctly', () => {
	const mockMessages = readable([
		{ id: 'abc', text: 'hello' },
		{ id: 'def', text: 'world' }
	]);

	render(ComponentWithContext, {
		context: new Map([['messages', mockMessages]]),
		props: {
			label: 'Notifications'
		}
	});

	const status = screen.getByRole('status', { name: 'Notifications' });
	expect(status).toHaveTextContent('hello world');
});
```

## Service Testing with Mocks

### PocketBase Service Testing

```typescript
import { vi } from 'vitest';
import { authService } from './auth.service';

// Always mock PocketBase this way
vi.mock('../pocketbase', () => ({
	pb: {
		collection: vi.fn(() => ({
			create: vi.fn(),
			authWithPassword: vi.fn(),
			getFirstListItem: vi.fn(),
			update: vi.fn(),
			delete: vi.fn()
		}))
	}
}));

test('should handle API success', async () => {
	const mockUser = { id: '1', email: 'test@example.com' };
	const mockCreate = vi.fn().mockResolvedValue(mockUser);

	pb.collection.mockReturnValue({ create: mockCreate });

	const result = await authService.register(userData);
	expect(mockCreate).toHaveBeenCalledWith(userData);
	expect(result).toEqual(mockUser);
});

test('should handle API errors', async () => {
	const mockError = new Error('Network error');
	const mockCreate = vi.fn().mockRejectedValue(mockError);

	pb.collection.mockReturnValue({ create: mockCreate });

	await expect(authService.register(userData)).rejects.toThrow('Network error');
});
```

### FastAPI Service Testing

```typescript
// Always mock fetch for FastAPI services
global.fetch = vi.fn();

beforeEach(() => {
	(fetch as any).mockClear();
});

test('should call FastAPI endpoint correctly', async () => {
	const mockResponse = { flashcards: [{ front: 'Hello', back: 'Hola' }] };

	(fetch as any).mockResolvedValueOnce({
		ok: true,
		json: async () => mockResponse
	});

	const result = await aiService.generateFlashcards({ topic: 'Spanish' });

	expect(fetch).toHaveBeenCalledWith(
		expect.stringContaining('/api/generate-flashcards'),
		expect.objectContaining({
			method: 'POST',
			headers: { 'Content-Type': 'application/json' }
		})
	);
	expect(result).toEqual(mockResponse.flashcards);
});
```

## Store Testing Pattern

```typescript
import { get } from 'svelte/store';
import { userStore } from './user.store';

test('should update store state', () => {
	const mockUser = { id: '1', email: 'test@example.com' };

	userStore.set(mockUser);
	expect(get(userStore)).toEqual(mockUser);
});

test('should reset store state', () => {
	userStore.set({ id: '1', email: 'test@example.com' });
	userStore.set(null);

	expect(get(userStore)).toBeNull();
});
```

## Accessibility Testing Requirements

Always include these accessibility tests:

```typescript
test('should have proper ARIA labels', () => {
	render(ComponentName, {
		props: { label: 'Submit form' }
	});

	const element = screen.getByRole('button');
	expect(element).toHaveAttribute('aria-label');
});

test('should be keyboard navigable', async () => {
	render(ComponentName);

	const button = screen.getByRole('button');
	button.focus();
	expect(button).toHaveFocus();
});

test('should announce changes to screen readers', async () => {
	const user = userEvent.setup();
	render(ComponentName);

	await user.click(screen.getByRole('button'));
	expect(screen.getByRole('status')).toBeInTheDocument();
});
```

## Error Handling Testing

Always test error scenarios:

```typescript
test('should display error state', () => {
	render(ComponentName, {
		props: {
			error: 'Something went wrong'
		}
	});

	expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});

test('should handle async errors', async () => {
	const user = userEvent.setup();
	const mockError = vi.fn().mockRejectedValue(new Error('API Error'));

	render(ComponentName, {
		props: { onSubmit: mockError }
	});

	await user.click(screen.getByRole('button'));
	expect(screen.getByText(/api error/i)).toBeInTheDocument();
});
```

## Integration Testing Pattern

```typescript
test('should complete full user flow', async () => {
	const user = userEvent.setup();
	render(FlashcardStudySession, {
		props: {
			flashcards: mockFlashcards
		}
	});

	// Step 1: Show answer
	await user.click(screen.getByRole('button', { name: /show answer/i }));
	expect(screen.getByText('Answer')).toBeInTheDocument();

	// Step 2: Rate card
	await user.click(screen.getByRole('button', { name: /easy/i }));

	// Step 3: Verify next card
	expect(screen.getByText('Next Question')).toBeInTheDocument();
});
```

## Required Mock Setup

Include these mocks in vitest-setup-client.ts:

```typescript
// Global mocks for all tests
global.ResizeObserver = vi.fn(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

global.IntersectionObserver = vi.fn(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// SvelteKit mocks
vi.mock('$app/stores', () => ({
	page: { subscribe: vi.fn(() => vi.fn()) },
	navigating: { subscribe: vi.fn(() => vi.fn()) }
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn()
}));
```

## Test Organization Rules

1. **Group tests logically:** Use describe blocks for component features
2. **Clear test names:** Describe what should happen, not implementation
3. **Setup/teardown:** Use beforeEach for common setup
4. **One assertion per test:** Focus on single behavior
5. **Mock external dependencies:** Never make real API calls

## Query Selectors Priority

Use this priority order for element queries:

```typescript
// 1. Role queries (preferred)
screen.getByRole('button', { name: /submit/i });

// 2. Label queries
screen.getByLabelText(/email/i);

// 3. Text content
screen.getByText(/welcome/i);

// 4. Test IDs (last resort)
screen.getByTestId('custom-element');
```

## Performance Testing Pattern

```typescript
test('should render efficiently with large datasets', () => {
	const largeData = Array.from({ length: 1000 }, (_, i) => ({ id: i }));

	const startTime = performance.now();
	render(DataTable, {
		props: { data: largeData }
	});
	const endTime = performance.now();

	expect(endTime - startTime).toBeLessThan(100);
});
```

## Anti-Patterns to Avoid

- ❌ Don't use `any` type in tests
- ❌ Don't test implementation details
- ❌ Don't make real API calls
- ❌ Don't test multiple behaviors in one test
- ❌ Don't use `querySelector` without good reason
- ❌ Don't forget to cleanup mocks
- ❌ Don't skip accessibility tests

## Code Generation Preferences

When generating tests:

1. Always include proper TypeScript types
2. Use `userEvent` (default import) for interactions, not fireEvent
3. Use `props` object when passing props to components
4. Use `{ component }` destructuring when testing component events
5. Include both success and error scenarios
6. Add accessibility tests for UI components
7. Mock all external dependencies
8. Follow exact import patterns shown above
9. Include proper setup and cleanup
10. Test slots and contexts using wrapper components when needed
