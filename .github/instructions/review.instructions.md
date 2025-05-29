# GitHub Copilot Code Review Instructions for BlendSphere Frontend

Follow these code review instructions when analyzing code for the BlendSphere language learning application.

## Security Review Rules

### Authentication & Authorization

Always flag these security issues:

```typescript
// 🚨 FLAG: No auth check
export async function load() {
	const records = await pb.collection('users').getList();
}

// ✅ REQUIRE: Auth verification
export async function load({ locals }) {
	if (!locals.user) throw redirect(302, '/login');
	const records = await pb.collection('users').getList();
}
```

### Input Validation Requirements

Flag any unvalidated user input:

```typescript
// 🚨 FLAG: No validation
const userInput = formData.get('email');

// ✅ REQUIRE: Proper validation
const email = sanitizeAndValidate(formData.get('email'), 'email');
if (!email) throw new Error('Invalid email format');
```

### Data Security Patterns

Never allow sensitive data exposure:

```typescript
// 🚨 FLAG: Logging sensitive data
console.log('User data:', { password: user.password });

// ✅ REQUIRE: Secure logging
console.log('User authenticated:', { id: user.id, role: user.role });
```

### Client-Side Storage Rules

Flag insecure storage practices:

```typescript
// 🚨 FLAG: Storing sensitive data
localStorage.setItem('password', password);

// ✅ REQUIRE: Only safe data
localStorage.setItem('theme', theme);
```

## Performance Review Rules

### Svelte 5 Optimization Requirements

Always enforce proper rune usage:

```typescript
// 🚨 FLAG: Unnecessary reactivity
let count = $state(0);
let doubled = $state(count * 2);

// ✅ REQUIRE: Use $derived for computed values
let count = $state(0);
let doubled = $derived(count * 2);
```

### Effect Cleanup Requirements

Flag missing cleanup in effects:

```typescript
// 🚨 FLAG: No cleanup
$effect(() => {
	const interval = setInterval(() => {}, 1000);
});

// ✅ REQUIRE: Proper cleanup
$effect(() => {
	const interval = setInterval(() => {}, 1000);
	return () => clearInterval(interval);
});
```

### Import Optimization Rules

Flag inefficient imports:

```typescript
// 🚨 FLAG: Importing entire library
import * as utils from '$lib/utils';

// ✅ REQUIRE: Tree-shaking friendly imports
import { sanitizeHtml } from '$lib/utils/security';
```

### Bundle Size Rules

Flag heavy components without lazy loading:

```typescript
// 🚨 FLAG: Static import for heavy component
import HeavyChart from '$lib/components/HeavyChart.svelte';

// ✅ REQUIRE: Dynamic import
const HeavyChart = lazy(() => import('$lib/components/HeavyChart.svelte'));
```

## TypeScript Review Rules

### Strict Typing Requirements

Never allow `any` type:

```typescript
// 🚨 FLAG: Using any
function processData(data: any): any {
	return data.map((item: any) => item.value);
}

// ✅ REQUIRE: Proper typing
interface DataItem {
	id: string;
	value: number;
}

function processData(data: DataItem[]): number[] {
	return data.map((item) => item.value);
}
```

### Interface Definition Rules

Flag inline types in function signatures:

```typescript
// 🚨 FLAG: Inline types
const createUser = (data: { name: string; email: string }) => {};

// ✅ REQUIRE: Defined interfaces
interface CreateUserData {
	name: string;
	email: string;
}

const createUser = (data: CreateUserData) => {};
```

### Props Validation Requirements

Flag components without proper prop types:

```typescript
// 🚨 FLAG: No prop validation
let { data } = $props();

// ✅ REQUIRE: Proper prop types
interface Props {
	data: FlashcardData[];
	onSelect?: (card: FlashcardData) => void;
}

let { data, onSelect }: Props = $props();
```

## Component Architecture Rules

### Component Size Limits

Flag monolithic components (>200 lines):

```svelte
<!-- 🚨 FLAG: Monolithic component -->
<div class="complex-form">
	<!-- 200+ lines of form logic -->
</div>

<!-- ✅ REQUIRE: Composed components -->
<FormContainer>
	<FormHeader {title} />
	<FormFields {schema} bind:data />
	<FormActions on:submit on:cancel />
</FormContainer>
```

### State Management Rules

Flag improper state usage:

```typescript
// 🚨 FLAG: Global state for local data
import { globalStore } from '$lib/stores';

// ✅ REQUIRE: Local state for component data
let localData = $state([]);
```

## Error Handling Requirements

### API Error Handling Rules

Flag missing error handling:

```typescript
// 🚨 FLAG: No error handling
const users = await pb.collection('users').getList();

// ✅ REQUIRE: Comprehensive error handling
try {
	const users = await pb.collection('users').getList();
	return users;
} catch (error) {
	console.error('Failed to fetch users:', error);
	throw new Error('Unable to load users. Please try again.');
}
```

### User Feedback Requirements

Flag silent failures:

```svelte
<!-- 🚨 FLAG: Silent failures -->
<script>
  async function saveData() {
    await api.save(data);
  }
</script>

<!-- ✅ REQUIRE: User feedback -->
<script>
  let saving = $state(false);
  let error = $state<string | null>(null);

  async function saveData() {
    saving = true;
    error = null;
    try {
      await api.save(data);
      showToast('Data saved successfully');
    } catch (err) {
      error = 'Failed to save data';
    } finally {
      saving = false;
    }
  }
</script>
```

## Accessibility Requirements

### Semantic HTML Rules

Flag generic elements used as buttons:

```svelte
<!-- 🚨 FLAG: Generic elements -->
<div class="button" on:click={handleClick}>Click me</div>

<!-- ✅ REQUIRE: Semantic elements -->
<button type="button" on:click={handleClick}>Click me</button>
```

### Form Label Requirements

Flag missing form labels:

```svelte
<!-- 🚨 FLAG: Missing labels -->
<input type="email" placeholder="Email" />

<!-- ✅ REQUIRE: Proper labels -->
<label for="email">Email Address</label>
<input id="email" type="email" required />
```

### ARIA Requirements

Flag missing ARIA attributes:

```svelte
<!-- 🚨 FLAG: No ARIA -->
<button on:click={toggleMenu}>☰</button>

<!-- ✅ REQUIRE: Descriptive ARIA -->
<button on:click={toggleMenu} aria-label="Toggle navigation menu" aria-expanded={menuOpen}>
	☰
</button>
```

### Live Region Requirements

Flag missing screen reader announcements:

```svelte
<!-- 🚨 FLAG: No announcements -->
{#if loading}
	<div>Loading...</div>
{/if}

<!-- ✅ REQUIRE: Screen reader announcements -->
<div aria-live="polite" aria-atomic="true">
	{#if loading}
		<span>Loading content, please wait...</span>
	{/if}
</div>
```

## BlendSphere-Specific Rules

### Backend Integration Rules

Flag direct backend calls without service layer:

```typescript
// 🚨 FLAG: Direct PocketBase calls in components
const users = await pb.collection('users').getList();

// ✅ REQUIRE: Use service layer
const users = await userService.getUsers();
```

### API Pattern Requirements

Flag mixing PocketBase and FastAPI calls:

```typescript
// 🚨 FLAG: Mixed backend calls
const flashcards = await pb.collection('flashcards').getList();
const aiResponse = await fetch('/api/ai/generate');

// ✅ REQUIRE: Separate service modules
const flashcards = await flashcardService.getFlashcards(); // PocketBase
const aiResponse = await aiService.generateCards(); // FastAPI
```

### Form Handling Rules

Flag forms without Superforms integration:

```svelte
<!-- 🚨 FLAG: Manual form handling -->
<form on:submit={handleSubmit}>
	<input bind:value={email} />
</form>

<!-- ✅ REQUIRE: Superforms integration -->
<form method="POST" use:enhance>
	<Form.Field {form} name="email">
		<Form.Control let:attrs>
			<Input {...attrs} bind:value={$formData.email} />
		</Form.Control>
	</Form.Field>
</form>
```

## Critical Anti-Patterns

### Security Critical Issues

Flag these immediately:

```typescript
// 🚨 CRITICAL: Direct DOM manipulation without sanitization
element.innerHTML = userInput;

// 🚨 CRITICAL: Exposing secrets in client
const config = { apiKey: 'secret-key-123' };

// 🚨 CRITICAL: No CSRF protection
fetch('/api/delete-user', { method: 'POST' });
```

### Performance Critical Issues

Flag these patterns:

```typescript
// 🚨 CRITICAL: Creating objects in render
{#each items as item}
  <Component data={{ ...item, computed: expensiveCalc() }} />
{/each}

// 🚨 CRITICAL: No key in each block
{#each items as item}
  <ListItem {item} />
{/each}

// 🚨 CRITICAL: Memory leaks
$effect(() => {
  const interval = setInterval(() => {}, 1000);
  // Missing cleanup
});
```

### Code Quality Critical Issues

Flag these patterns:

```typescript
// 🚨 CRITICAL: Magic numbers
setTimeout(callback, 86400000);

// 🚨 CRITICAL: Deep nesting (>3 levels)
if (user) {
	if (user.role === 'teacher') {
		if (user.classes.length > 0) {
			if (user.permissions.includes('edit')) {
				// Logic here
			}
		}
	}
}
```

## Review Response Templates

### Security Issue Template

```markdown
🔒 **Security Issue**

- **Risk:** [High/Medium/Low]
- **Issue:** [Brief description]
- **Fix:** [Specific solution]
```

### Performance Issue Template

```markdown
⚡ **Performance Issue**

- **Impact:** [Bundle size/Runtime/Memory]
- **Issue:** [Brief description]
- **Fix:** [Specific optimization]
```

### Code Quality Issue Template

```markdown
📝 **Code Quality Issue**

- **Category:** [TypeScript/Architecture/Maintainability]
- **Issue:** [Brief description]
- **Fix:** [Specific improvement]
```

### Accessibility Issue Template

```markdown
♿ **Accessibility Issue**

- **WCAG Level:** [A/AA/AAA]
- **Issue:** [Brief description]
- **Fix:** [Specific solution]
```

## Review Priority Levels

### P0 - Critical (Block merge)

- Security vulnerabilities
- Performance regressions
- Breaking accessibility issues
- Type safety violations

### P1 - High (Require fix)

- Missing error handling
- Poor component architecture
- Accessibility improvements needed
- Performance optimizations

### P2 - Medium (Consider fixing)

- Code quality improvements
- Documentation updates
- Minor performance optimizations
- UX enhancements

### P3 - Low (Nice to have)

- Code style consistency
- Additional test coverage
- Documentation improvements
- Refactoring opportunities

## File-Specific Review Focus

### \*.svelte files

1. Component props and state management
2. Event handling and accessibility
3. Performance optimization
4. Styling and responsiveness

### \*.service.ts files

1. API integration patterns
2. Error handling completeness
3. Type safety and interfaces
4. Security considerations

### \*.store.ts files

1. State management patterns
2. Subscription cleanup
3. Performance optimization
4. Type definitions

### \*.test.ts files

1. Test coverage completeness
2. Test quality and clarity
3. Mock usage correctness
4. Accessibility testing inclusion

## Auto-Review Triggers

Flag for immediate review when:

- `any` type is used
- No error handling in async functions
- Missing ARIA attributes on interactive elements
- Direct DOM manipulation
- Hardcoded secrets or credentials
- Missing type definitions
- Performance anti-patterns
- Security vulnerabilities

## Review Completion Checklist

- [ ] Security review completed
- [ ] Performance analysis done
- [ ] TypeScript compliance verified
- [ ] Accessibility requirements met
- [ ] Error handling adequate
- [ ] Testing coverage sufficient
- [ ] Documentation updated
- [ ] BlendSphere patterns followed
