---
applyTo: '**/*.md,**/*.puml'
---

# GitHub Copilot Documentation & Requirements Generation Instructions

This document provides comprehensive instructions for GitHub Copilot to generate high-quality, consistent requirements and documentation for the BlendSphere language learning application frontend.

## Table of Contents

- [Documentation Principles](#documentation-principles)
- [Requirements Generation Guidelines](#requirements-generation-guidelines)
- [Documentation Templates](#documentation-templates)
- [Consistency Standards](#consistency-standards)
- [AI Context Optimization](#ai-context-optimization)
- [File Organization](#file-organization)

## Documentation Principles

### 1. Copilot-Centric Approach

All documentation must be optimized for AI code generators and copilots to maintain context and consistency:

```markdown
<!-- ✅ GOOD: Clear context for AI -->

## Authentication Service Requirements

### Purpose

Handle user authentication for BlendSphere using PocketBase backend integration.

### Dependencies

- PocketBase client: `$lib/pocketbase.ts`
- User types: `$lib/types/user.ts`
- Auth stores: `$lib/stores/auth.ts`

### Context Tags

#authentication #pocketbase #security #user-management
```

```markdown
<!-- 🚨 BAD: Vague, no AI context -->

## Auth Stuff

Handle login and stuff.
```

### 2. Structured Information Architecture

Every document must follow a predictable structure that AI can parse and understand:

1. **Header with Context Tags**
2. **Overview/Purpose Section**
3. **Dependencies and Relationships**
4. **Detailed Requirements/Specifications**
5. **Implementation Guidelines**
6. **AI Generation Hints**
7. **Validation Criteria**

### 3. Machine-Readable Metadata

Include structured metadata for AI processing:

```markdown
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
  - user-interface
last_updated: 2025-05-29
ai_context: |
  This component handles flashcard creation using templates with AI-assisted
  content generation. It integrates with PocketBase for data storage and
  FastAPI for AI features.
---
```

## Requirements Generation Guidelines

### 1. Functional Requirements Format

Use structured requirement format with clear AI context:

````markdown
### REQ-FC-001: Template Selection Interface

**Priority**: P0 (Critical)
**Component**: FlashcardCreator
**Dependencies**: TemplateService, TemplateStore

**Description**:
Users must be able to select from available templates when creating flashcards.

**AI Context**:

- Component type: Svelte 5 component with $state runes
- UI library: shadcn-svelte components
- Data source: PocketBase templates collection
- State management: Svelte stores

**Acceptance Criteria**:

1. Display templates in filterable grid layout
2. Show template preview with field structure
3. Filter by user permissions (owned, public, shared)
4. Validate template compatibility before selection

**Implementation Hints**:

```typescript
// Service layer pattern
const templates = await templateService.getUserTemplates(userId);

// Svelte 5 reactivity
let selectedTemplate = $state<Template | null>(null);
let filteredTemplates = $derived(templates.filter((t) => matchesFilter(t, searchFilter)));
```
````

**Related Files**:

- `src/lib/components/flashcard/TemplateSelector.svelte`
- `src/lib/services/template.service.ts`
- `src/lib/types/template.ts`

````

### 2. Technical Specifications Format

Provide clear technical context for AI generators:

```markdown
### TECH-SPEC-001: AI Content Generation Integration

**Component**: FlashcardCreator
**Backend**: FastAPI AI Service
**Integration Pattern**: Service Layer

**API Contract**:
```typescript
interface GenerateContentRequest {
  templateId: string;
  inputFields: Record<string, unknown>;
  language: {
    native: string;
    learning: string;
    level: CEFRLevel;
  };
  context?: {
    userAbout?: string;
    previousCards?: string[];
  };
}

interface GenerateContentResponse {
  success: boolean;
  generatedFields: Record<string, unknown>;
  confidence: number;
  suggestions?: string[];
  error?: string;
}
````

**Implementation Pattern**:

```typescript
// Service layer (src/lib/services/ai.service.ts)
export class AIService {
	async generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
		// Implementation with proper error handling
	}
}

// Component usage (src/lib/components/flashcard/Creator.svelte)
let generating = $state(false);
let generatedContent = $state<Record<string, unknown>>({});

async function handleGenerateContent() {
	generating = true;
	try {
		const response = await aiService.generateContent(request);
		generatedContent = response.generatedFields;
	} catch (error) {
		// Error handling
	} finally {
		generating = false;
	}
}
```

**Error Handling Requirements**:

- Network failures: Retry with exponential backoff
- Validation errors: Show field-specific messages
- AI service errors: Fallback to manual input
- Rate limiting: Queue requests and show progress

````

### 3. User Story Format with AI Context

Structure user stories to provide maximum context for AI:

```markdown
### US-FC-001: Teacher Creates Vocabulary Flashcards

**As a** language teacher
**I want to** create vocabulary flashcards using AI assistance
**So that** I can quickly generate high-quality learning materials for my students

**AI Context**:
- User role: TEACHER
- Workflow: Template selection → Input filling → AI generation → Review → Save
- UI components: MultiStepForm, AIGenerationPanel, PreviewCard
- Data flow: Input → AIService → Validation → Storage

**Acceptance Criteria**:

**Given** a teacher has selected a vocabulary template
**When** they fill in the input fields (word, difficulty level)
**Then** the system should:
1. Validate input completeness and format
2. Generate contextual content (definition, example, pronunciation)
3. Display generated content in editable preview
4. Allow regeneration of individual fields
5. Save to deck with proper associations

**Technical Implementation Hints**:
```svelte
<!-- src/routes/flashcards/create/+page.svelte -->
<script lang="ts">
  import { FlashcardCreator } from '$lib/components/flashcard';
  import { templateStore } from '$lib/stores/template.js';

  let selectedTemplate = $state<Template | null>(null);
  let creationMode = $state<'single' | 'bulk'>('single');
</script>

<FlashcardCreator
  bind:template={selectedTemplate}
  {creationMode}
  on:created={handleCardCreated}
  on:error={handleError}
/>
````

**Related Documentation**:

- Template System Requirements: `docs/template-system-requirements.md`
- AI Integration: `docs/ai-integration.md`
- User Journeys: `docs/user-journeys.md#teacher-onboarding`

````

## Documentation Templates

### 1. Feature Requirements Template

```markdown
<!-- Use this template for new feature requirements -->
# [Feature Name] Requirements

---
component: [ComponentName]
type: requirements
version: [X.Y.Z]
dependencies:
  - [dependency-1]
  - [dependency-2]
context_tags:
  - [tag1]
  - [tag2]
last_updated: [YYYY-MM-DD]
ai_context: |
  [Brief description for AI context]
---

## 1. Overview

### 1.1 Purpose
[Clear purpose statement with AI context]

### 1.2 Scope
[What's included and excluded]

### 1.3 Dependencies
- **Frontend**: [List Svelte components, stores, services]
- **Backend**: [PocketBase collections, FastAPI endpoints]
- **External**: [Third-party libraries, APIs]

## 2. Functional Requirements

### 2.1 [Requirement Category]

#### REQ-[PREFIX]-[NUMBER]: [Requirement Title]

**Priority**: [P0/P1/P2/P3]
**Component**: [Svelte component or service]
**Dependencies**: [Related components/services]

**Description**:
[Clear description with user perspective]

**AI Context**:
- [Technical implementation context]
- [Data structures involved]
- [UI patterns to use]

**Acceptance Criteria**:
1. [Specific, testable criteria]
2. [With technical details]

**Implementation Hints**:
```typescript
// [Code examples for AI generation]
````

## 3. Technical Specifications

### 3.1 Data Structures

```typescript
// [TypeScript interfaces with comments]
interface [InterfaceName] {
  // [Field descriptions for AI context]
}
```

### 3.2 API Integration

```typescript
// [Service layer patterns]
export class [ServiceName] {
  // [Method signatures with AI context]
}
```

### 3.3 Component Architecture

```svelte
<!-- [Component structure examples] -->
<script lang="ts">
	// [Svelte 5 patterns with AI context]
</script>
```

## 4. Implementation Guidelines

### 4.1 File Structure

- [Expected file locations]
- [Naming conventions]

### 4.2 Testing Requirements

- [Unit test patterns]
- [Integration test scenarios]

### 4.3 Accessibility Requirements

- [WCAG compliance details]
- [Screen reader considerations]

## 5. Validation Criteria

### 5.1 Functional Validation

- [ ] [Checklist items for AI verification]

### 5.2 Technical Validation

- [ ] [Code quality checks]
- [ ] [Performance requirements]

### 5.3 UX Validation

- [ ] [User experience checks]
- [ ] [Accessibility compliance]

````

### 2. API Documentation Template

```markdown
# [Service Name] API Documentation

---
service: [ServiceName]
type: api-documentation
backend: [PocketBase/FastAPI]
version: [X.Y.Z]
context_tags:
  - [api]
  - [service]
  - [tag3]
last_updated: [YYYY-MM-DD]
ai_context: |
  [Service purpose and integration context]
---

## Service Overview

**Purpose**: [What this service does]
**Backend Integration**: [PocketBase/FastAPI details]
**Dependencies**: [Required services/stores]

## API Methods

### [methodName]

**Purpose**: [What this method does]
**Parameters**:
```typescript
interface [MethodName]Params {
  // [Parameter definitions with AI context]
}
````

**Returns**:

```typescript
interface [MethodName]Response {
  // [Response structure with AI context]
}
```

**Implementation**:

```typescript
export async function [methodName](
  params: [MethodName]Params
): Promise<[MethodName]Response> {
  // [Implementation pattern for AI reference]
}
```

**Usage Example**:

```svelte
<script lang="ts">
  import { [serviceName] } from '$lib/services/[service-name].service.js';
  
  // [Usage patterns for AI generation]
</script>
```

**Error Handling**:

- [Expected error scenarios]
- [Error response patterns]
- [Recovery strategies]

````

### 3. Component Documentation Template

```markdown
# [Component Name] Documentation

---
component: [ComponentName]
type: component-documentation
category: [UI/Form/Data/Layout]
version: [X.Y.Z]
dependencies:
  - [shadcn-component]
  - [store]
  - [service]
context_tags:
  - [component]
  - [ui]
  - [tag3]
last_updated: [YYYY-MM-DD]
ai_context: |
  [Component purpose and usage context]
---

## Component Overview

**Purpose**: [What this component does]
**Category**: [UI category for AI context]
**Usage Context**: [When and where to use]

## Props Interface

```typescript
interface [ComponentName]Props {
  // [Props with AI generation context]
}
````

## Events

```typescript
interface [ComponentName]Events {
  // [Event definitions with AI context]
}
```

## Usage Examples

### Basic Usage

```svelte
<script lang="ts">
  import { [ComponentName] } from '$lib/components/[category]/[component-name].svelte';

  // [Basic usage pattern]
</script>

<[ComponentName]
  {prop1}
  {prop2}
  on:event={handleEvent}
/>
```

### Advanced Usage

```svelte
<!-- [Advanced patterns with AI context] -->
```

## Styling Guidelines

**CSS Classes**: [shadcn-svelte classes to use]
**Customization**: [How to customize appearance]
**Responsive Behavior**: [Mobile/desktop considerations]

## Accessibility

**ARIA Labels**: [Required ARIA attributes]
**Keyboard Navigation**: [Keyboard interaction patterns]
**Screen Reader**: [Screen reader announcements]

## AI Generation Hints

**Component Pattern**: [Svelte 5 patterns to follow]
**State Management**: [Runes to use]
**Integration**: [How to integrate with other components]

```typescript
// [Code patterns for AI reference]
```

```

## Consistency Standards

### 1. Naming Conventions

**Files and Components**:
```

✅ GOOD:

- flashcard-creator.requirements.md
- FlashcardCreator.svelte
- flashcard.service.ts
- UserAuth.types.ts

🚨 BAD:

- fc-req.md
- creator.svelte
- flashcardSvc.ts
- auth-types.ts

```

**Requirements IDs**:
```

Format: REQ-[COMPONENT]-[NUMBER]
Examples:

- REQ-FC-001 (FlashcardCreator)
- REQ-TS-001 (TemplateSystem)
- REQ-AUTH-001 (Authentication)
- REQ-SRS-001 (SpacedRepetition)

````

### 2. Context Tags System

Use consistent tags for AI categorization:

**Component Tags**:
- `#flashcard` - Flashcard-related features
- `#template` - Template system
- `#auth` - Authentication/authorization
- `#ai-generation` - AI-powered features
- `#srs` - Spaced repetition system
- `#deck` - Deck management
- `#user-management` - User-related features

**Technical Tags**:
- `#svelte5` - Svelte 5 specific features
- `#pocketbase` - PocketBase integration
- `#fastapi` - FastAPI integration
- `#shadcn` - UI components
- `#typescript` - TypeScript specific

**Category Tags**:
- `#requirements` - Requirement documents
- `#api-docs` - API documentation
- `#component-docs` - Component documentation
- `#user-stories` - User story documents

### 3. Cross-Reference Standards

Always include related documentation:

```markdown
## Related Documentation

### Requirements
- [Template System Requirements](./template-system-requirements.md)
- [AI Integration Requirements](./ai-integration.md)

### API Documentation
- [Template Service API](./api/template-service.md)
- [AI Service API](./api/ai-service.md)

### Component Documentation
- [TemplateSelector Component](./components/template-selector.md)
- [FlashcardPreview Component](./components/flashcard-preview.md)

### User Stories
- [Teacher Onboarding Journey](./user-journeys.md#teacher-onboarding)
- [Flashcard Creation Workflow](./user-journeys.md#flashcard-creation)
````

## AI Context Optimization

### 1. Code Examples for AI Learning

Always provide implementation examples:

````markdown
### AI Learning Example: Form Validation

**Context**: Svelte 5 form with shadcn-svelte components

```typescript
// Input validation pattern for AI reference
import { z } from 'zod';

const schema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Invalid email format')
});

// Svelte 5 form pattern
let formData = $state({ name: '', email: '' });
let errors = $state<Record<string, string>>({});

async function handleSubmit() {
	try {
		const validated = schema.parse(formData);
		await userService.createUser(validated);
	} catch (error) {
		if (error instanceof z.ZodError) {
			errors = error.flatten().fieldErrors;
		}
	}
}
```
````

```svelte
<!-- UI pattern for AI reference -->
<script lang="ts">
	// [Script content above]
</script>

<form on:submit|preventDefault={handleSubmit}>
	<Form.Field>
		<Form.Label>Name</Form.Label>
		<Form.Control>
			<Input bind:value={formData.name} />
		</Form.Control>
		{#if errors.name}
			<Form.Message>{errors.name}</Form.Message>
		{/if}
	</Form.Field>
</form>
```

````

### 2. Data Flow Documentation

Provide clear data flow for AI understanding:

```markdown
### Data Flow: Flashcard Creation

````

User Input → Validation → AI Service → Content Generation → Preview → Storage

1. **User Input**: Form data collection

   - Component: `FlashcardCreatorForm.svelte`
   - State: `let inputData = $state({})`
   - Validation: Zod schema

2. **AI Service Call**: Content generation

   - Service: `aiService.generateContent()`
   - Endpoint: `POST /api/ai/generate`
   - Response: Generated field content

3. **Preview & Edit**: User review

   - Component: `FlashcardPreview.svelte`
   - State: `let previewData = $state({})`
   - Actions: Edit, regenerate, approve

4. **Storage**: Save to database
   - Service: `flashcardService.create()`
   - Backend: PocketBase `flashcards` collection
   - Relations: Link to deck and template

```

```

### 3. State Management Patterns

Document state patterns for AI consistency:

````markdown
### State Management Pattern: Entity Management

**Pattern**: CRUD operations with optimistic updates

```typescript
// Store pattern for AI reference
import { writable } from 'svelte/store';

interface EntityStore<T> {
	items: T[];
	loading: boolean;
	error: string | null;
	selectedId: string | null;
}

export function createEntityStore<T extends { id: string }>() {
	const { subscribe, set, update } = writable<EntityStore<T>>({
		items: [],
		loading: false,
		error: null,
		selectedId: null
	});

	return {
		subscribe,
		async load() {
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				const items = await service.getAll();
				update((state) => ({ ...state, items, loading: false }));
			} catch (error) {
				update((state) => ({
					...state,
					loading: false,
					error: error.message
				}));
			}
		}
		// ... other methods
	};
}
```
````

**Usage in Components**:

```svelte
<script lang="ts">
	import { templateStore } from '$lib/stores/template.store.js';

	let templates = $derived($templateStore.items);
	let loading = $derived($templateStore.loading);

	onMount(() => templateStore.load());
</script>
```

```

## File Organization

### 1. Documentation Structure

```

docs/
├── requirements/
│ ├── flashcard-creator.requirements.md
│ ├── template-system.requirements.md
│ └── user-management.requirements.md
├── api/
│ ├── pocketbase-integration.md
│ ├── fastapi-integration.md
│ └── services/
│ ├── template.service.md
│ └── ai.service.md
├── components/
│ ├── ui/
│ │ ├── button.component.md
│ │ └── form.component.md
│ └── feature/
│ ├── flashcard-creator.component.md
│ └── template-selector.component.md
├── user-stories/
│ ├── teacher-workflows.md
│ ├── student-workflows.md
│ └── individual-learner-workflows.md
└── architecture/
├── frontend-architecture.md
├── data-structure.md
└── integration-patterns.md

````

### 2. Cross-Reference Index

Maintain an index file for AI navigation:

```markdown
<!-- docs/index.md -->
# BlendSphere Documentation Index

## By Component

### Flashcard Creator
- [Requirements](requirements/flashcard-creator.requirements.md) `#flashcard #ai-generation #template`
- [API Documentation](api/services/flashcard.service.md) `#api #crud #pocketbase`
- [Component Docs](components/feature/flashcard-creator.component.md) `#svelte5 #form #ui`

### Template System
- [Requirements](requirements/template-system.requirements.md) `#template #layout #fields`
- [User Stories](user-stories/template-creation.md) `#user-workflow #teacher`

## By Technology

### Svelte 5
- [Component Patterns](architecture/svelte5-patterns.md) `#svelte5 #runes #reactivity`
- [State Management](architecture/state-management.md) `#stores #derived #effect`

### Backend Integration
- [PocketBase Integration](api/pocketbase-integration.md) `#pocketbase #auth #crud`
- [FastAPI Integration](api/fastapi-integration.md) `#fastapi #ai #generation`

## By User Role

### Teachers
- [Onboarding Journey](user-stories/teacher-workflows.md#onboarding) `#teacher #workflow`
- [Class Management](user-stories/teacher-workflows.md#class-management) `#teacher #class`

### Students
- [Participation Journey](user-stories/student-workflows.md#participation) `#student #learning`
- [Individual Study](user-stories/student-workflows.md#individual) `#student #srs`
````

## Validation Criteria

### 1. Documentation Quality Checklist

- [ ] **AI Context**: Clear context tags and metadata
- [ ] **Code Examples**: Implementation patterns provided
- [ ] **Cross-References**: Links to related documentation
- [ ] **Consistency**: Follows naming and structure conventions
- [ ] **Completeness**: All required sections included
- [ ] **Accuracy**: Technical details are correct and current
- [ ] **Accessibility**: Includes accessibility requirements
- [ ] **Testing**: Test scenarios and validation criteria

### 2. AI Generation Verification

After generating documentation, verify:

```markdown
## AI Generation Verification Checklist

### Context Quality

- [ ] Component purpose clearly stated
- [ ] Dependencies explicitly listed
- [ ] Technology stack context provided
- [ ] Integration patterns documented

### Code Examples

- [ ] TypeScript interfaces included
- [ ] Svelte 5 patterns demonstrated
- [ ] Service layer examples provided
- [ ] Error handling patterns shown

### Implementation Guidance

- [ ] File structure specified
- [ ] Naming conventions followed
- [ ] State management patterns clear
- [ ] API integration patterns documented

### Cross-References

- [ ] Related requirements linked
- [ ] Component dependencies mapped
- [ ] User stories referenced
- [ ] Architecture documents connected
```

### 3. Consistency Validation

Run validation checks:

```bash
# Check naming conventions
grep -r "REQ-[A-Z]+-[0-9]+" docs/requirements/

# Verify context tags
grep -r "#[a-z-]+" docs/ | grep "context_tags"

# Check cross-references
find docs/ -name "*.md" -exec grep -l "\[.*\](.*\.md)" {} \;
```

## Usage Instructions for Copilot

When generating documentation, follow this workflow:

1. **Start with Template**: Use appropriate template from above
2. **Add Context Metadata**: Include AI-readable frontmatter
3. **Provide Code Examples**: Show implementation patterns
4. **Include Cross-References**: Link related documentation
5. **Add Validation Criteria**: Specify how to verify requirements
6. **Optimize for AI**: Include context tags and hints
7. **Validate Consistency**: Check naming and structure standards

Remember: The goal is to create documentation that helps AI maintain context and consistency across the entire BlendSphere codebase while providing clear guidance for human developers.
