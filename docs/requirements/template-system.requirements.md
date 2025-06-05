# Template System Requirements

---

component: TemplateSystem
type: requirements
version: 2.1.0
dependencies:

- rich-text-editor
- ai-integration
- media-upload
- user-management
  context_tags:
- template
- layout
- fields
- ai-generation
- rich-text
- customization
- flashcard-design
  last_updated: 2025-05-29
  ai_context: |
  Template system for BlendSphere that allows users to create structured flashcard
  templates with customizable layouts and AI-assisted content generation. Templates
  define both visual appearance and data structure of flashcards with field-based
  content management and rich text layout design.

---

## 1. Overview

### 1.1 Purpose

Provide a comprehensive template system that enables users to create structured flashcard templates with customizable layouts and AI-assisted content generation for the BlendSphere language learning platform.

### 1.2 Scope

- Template creation and management
- Field definition and configuration
- Rich text layout design with placeholders
- Style customization and theming
- Template sharing and discovery
- AI integration for content generation
- Starter templates for common use cases

### 1.3 Dependencies

- **Frontend**: Rich text editor, drag-and-drop, style controls, preview system
- **Backend**: PocketBase templates/fields collections, FastAPI AI service
- **External**: Image/audio upload storage, rich text processing libraries

## 2. Functional Requirements

### 2.1 Template Creation and Management

#### REQ-TS-001: Template Structure Definition

**Priority**: P0 (Critical)
**Component**: TemplateEditor, TemplateService
**Dependencies**: PocketBase templates collection

**Description**:
Users must be able to create templates with comprehensive metadata and configuration for AI-assisted flashcard generation.

**AI Context**:

- Component type: Multi-step form with Svelte 5 components
- Data structure: Template entity with versioning support
- UI library: shadcn-svelte form components
- State management: Template creation wizard store

**Acceptance Criteria**:

1. Template name (required, max 100 characters, unique per user)
2. Description (optional, max 500 characters, used as AI context)
3. Semantic versioning (1.0.0 format)
4. Author automatically set to current user
5. Language pair configuration (native/learning)
6. CEFR level selection (A1-C2)
7. Public/private visibility control

**Implementation Hints**:

```typescript
// Template interface (src/lib/types/template.ts)
interface Template {
	id: string;
	name: string;
	description?: string;
	version: string;
	author: string;
	nativeLanguage: Language;
	learningLanguage: Language;
	languageLevel: CEFRLevel;
	frontLayout: string;
	backLayout: string;
	styles: TemplateStyles;
	user: string;
	isPublic: boolean;
	created: string;
	updated: string;
}

// Template creation store pattern
let templateData = $state<Partial<Template>>({
	version: '1.0.0',
	isPublic: false
});

let currentStep = $state<'info' | 'fields' | 'layout' | 'styles' | 'preview'>('info');
let isValid = $derived(validateCurrentStep(templateData, currentStep));
```

**Related Files**:

- `src/lib/components/template/TemplateEditor.svelte`
- `src/lib/services/template.service.ts`
- `src/lib/types/template.ts`
- `src/lib/stores/template-creation.store.ts`

#### REQ-TS-002: Rich Text Layout System

**Priority**: P0 (Critical)
**Component**: LayoutEditor, PlaceholderManager
**Dependencies**: Rich text editor library, placeholder system

**Description**:
Users must be able to design front and back layouts using rich text editor with placeholder insertion and live preview.

**AI Context**:

- Editor: TinyMCE or similar WYSIWYG editor
- Placeholders: `{{fieldName}}` syntax for field insertion
- Preview: Real-time rendering with sample data
- Components: Rich text wrapper, placeholder toolbar

**Acceptance Criteria**:

1. Rich text editor with formatting (bold, italic, underline)
2. Text alignment and list support
3. Text size controls (XS, S, M, L, XL)
4. Vertical alignment (top, center, bottom)
5. Color controls (text, highlight, background)
6. Placeholder insertion via UI
7. Live preview mode with sample data
8. Placeholder validation against defined fields

**Implementation Hints**:

```typescript
// Layout editor component pattern
let frontLayout = $state('');
let backLayout = $state('');
let selectedEditor = $state<'front' | 'back'>('front');
let availablePlaceholders = $derived(
	fields.map((f) => ({ name: f.label, placeholder: `{{${f.label}}}` }))
);

// Rich text editor integration
import { Editor } from '@tinymce/tinymce-svelte';

function insertPlaceholder(placeholder: string) {
	const editor = tinymce.get(selectedEditor + '-editor');
	editor?.insertContent(placeholder);
}

// Live preview with placeholder replacement
let previewContent = $derived(() => {
	const layout = selectedEditor === 'front' ? frontLayout : backLayout;
	return replacePlaceholders(layout, sampleData);
});
```

#### REQ-TS-003: Field Management System

**Priority**: P0 (Critical)
**Component**: FieldManager, FieldEditor
**Dependencies**: Field validation, media upload

**Description**:
Users must be able to define fields with types, properties, and AI generation context for template-based flashcard creation.

**AI Context**:

- Field types: TEXT, IMAGE, AUDIO
- Properties: Input vs output fields, language, validation
- UI pattern: Dynamic form with field list management
- Drag-and-drop: Field reordering support

**Acceptance Criteria**:

1. Field types: TEXT, IMAGE, AUDIO
2. Field properties: label, type, language, isInput
3. Optional description for AI context
4. Optional example values
5. Field validation rules
6. Drag-and-drop field reordering
7. Field deletion with layout validation

**Implementation Hints**:

```typescript
// Field interface (src/lib/types/field.ts)
interface Field {
	id: string;
	template: string;
	type: FieldType;
	isInput: boolean;
	language: Language;
	label: string;
	description?: string;
	example?: string;
	order: number;
	created: string;
	updated: string;
}

enum FieldType {
	TEXT = 'TEXT',
	IMAGE = 'IMAGE',
	AUDIO = 'AUDIO'
}

// Field management component
let fields = $state<Field[]>([]);
let draggedField = $state<Field | null>(null);

function addField(type: FieldType) {
	const newField: Partial<Field> = {
		type,
		isInput: true,
		language: template.learningLanguage,
		label: `New ${type} field`,
		order: fields.length
	};
	fields = [...fields, newField as Field];
}

function reorderFields(oldIndex: number, newIndex: number) {
	const reordered = [...fields];
	const [moved] = reordered.splice(oldIndex, 1);
	reordered.splice(newIndex, 0, moved);

	// Update order values
	fields = reordered.map((field, index) => ({
		...field,
		order: index
	}));
}
```

### 2.2 Template Discovery and Sharing

#### REQ-TS-004: Template Browser Interface

**Priority**: P1 (High)
**Component**: TemplateBrowser, TemplateCard
**Dependencies**: Search service, filtering system

**Description**:
Users must be able to discover, search, and clone public templates created by other users.

**AI Context**:

- Layout: Grid-based template cards with previews
- Filtering: Language, level, category, author filters
- Search: Full-text search in names and descriptions
- Actions: Preview, clone, favorite templates

**Acceptance Criteria**:

1. Grid layout with template preview cards
2. Language pair filtering
3. CEFR level filtering
4. Public/starter template toggle
5. Text search functionality
6. Template preview modal
7. One-click template cloning
8. User rating and favorites system

**Implementation Hints**:

```typescript
// Template browser store
let templates = $state<Template[]>([]);
let filters = $state({
	languages: [] as string[],
	levels: [] as CEFRLevel[],
	showStarter: true,
	search: ''
});

let filteredTemplates = $derived(() => {
	return templates.filter((template) => {
		if (filters.search && !template.name.toLowerCase().includes(filters.search.toLowerCase())) {
			return false;
		}
		if (filters.languages.length && !filters.languages.includes(template.learningLanguage)) {
			return false;
		}
		if (filters.levels.length && !filters.levels.includes(template.languageLevel)) {
			return false;
		}
		return true;
	});
});

// Template cloning
async function cloneTemplate(sourceTemplate: Template) {
	const clonedTemplate = {
		...sourceTemplate,
		id: undefined,
		name: `${sourceTemplate.name} (Copy)`,
		author: currentUser.id,
		user: currentUser.id,
		isPublic: false,
		created: undefined,
		updated: undefined
	};

	const newTemplate = await templateService.create(clonedTemplate);
	await cloneTemplateFields(sourceTemplate.id, newTemplate.id);

	return newTemplate;
}
```

#### REQ-TS-005: Starter Templates System

**Priority**: P1 (High)
**Component**: StarterTemplateService, TemplateInitializer
**Dependencies**: Predefined template data, template cloning

**Description**:
System must provide predefined starter templates for common flashcard types to help users get started quickly.

**AI Context**:

- Templates: Vocabulary, grammar, conversation, verb conjugation
- Data: JSON/TypeScript template definitions
- UI: Starter template selection during creation
- Customization: Full editing capabilities after selection

**Acceptance Criteria**:

1. Basic vocabulary template (word → translation, example)
2. Advanced vocabulary template (word → translation, definition, pronunciation)
3. Verb conjugation template (infinitive → conjugated forms)
4. Grammar patterns template (rule → explanation, examples)
5. Conversation practice template (topic → dialogue, phrases)
6. Template preview before selection
7. Full customization after starting from template

**Implementation Hints**:

```typescript
// Starter template definitions (src/lib/data/starter-templates.ts)
export const STARTER_TEMPLATES: Partial<Template>[] = [
	{
		name: 'Basic Vocabulary',
		description: 'Simple word to translation flashcards',
		languageLevel: CEFRLevel.A1,
		frontLayout: '<div class="text-center"><h2>{{word}}</h2></div>',
		backLayout: '<div class="text-center"><h2>{{translation}}</h2><p>{{example}}</p></div>',
		fields: [
			{ label: 'word', type: FieldType.TEXT, isInput: true, language: 'learning' },
			{ label: 'translation', type: FieldType.TEXT, isInput: false, language: 'native' },
			{ label: 'example', type: FieldType.TEXT, isInput: false, language: 'learning' }
		]
	}
	// ... other starter templates
];

// Template initialization from starter
async function initializeFromStarter(starterTemplate: Partial<Template>) {
	const template = await templateService.create({
		...starterTemplate,
		user: currentUser.id,
		version: '1.0.0'
	});

	await Promise.all(
		starterTemplate.fields.map((field) => fieldService.create({ ...field, template: template.id }))
	);

	return template;
}
```

### 2.3 AI Integration

#### REQ-TS-006: AI Content Generation Context

**Priority**: P0 (Critical)
**Component**: AIPromptBuilder, ContentGenerator
**Dependencies**: FastAPI AI service, template context

**Description**:
Templates must provide comprehensive context for AI content generation including field descriptions and template metadata.

**AI Context**:

- Context building: Template + field descriptions → AI prompts
- Generation: FastAPI service integration
- Validation: Generated content validation
- Editing: Post-generation content editing

**Acceptance Criteria**:

1. Template description used as overall AI context
2. Field descriptions used as specific generation prompts
3. Language pair influences model selection
4. Language level adjusts content complexity
5. User context (aboutMe) included in prompts
6. Generated content validation and error handling
7. Regeneration capabilities for individual fields

**Implementation Hints**:

```typescript
// AI prompt building (src/lib/services/ai-prompt.service.ts)
export class AIPromptService {
	buildPrompt(
		template: Template,
		fields: Field[],
		inputData: Record<string, unknown>
	): AIGenerationRequest {
		return {
			templateContext: {
				description: template.description,
				nativeLanguage: template.nativeLanguage,
				learningLanguage: template.learningLanguage,
				level: template.languageLevel
			},
			fields: fields
				.filter((f) => !f.isInput)
				.map((field) => ({
					name: field.label,
					type: field.type,
					language: field.language,
					description: field.description,
					example: field.example
				})),
			inputData,
			userContext: {
				aboutMe: currentUser.aboutMe,
				nativeLanguage: currentUser.nativeLanguage
			}
		};
	}
}

// Content generation workflow
let generating = $state(false);
let generatedContent = $state<Record<string, unknown>>({});

async function generateContent(inputData: Record<string, unknown>) {
	generating = true;
	try {
		const prompt = aiPromptService.buildPrompt(template, fields, inputData);
		const response = await aiService.generateContent(prompt);
		generatedContent = response.generatedFields;
	} catch (error) {
		// Handle generation errors
	} finally {
		generating = false;
	}
}
```

## 3. Technical Specifications

### 3.1 Data Structures

```typescript
// Core template interfaces (src/lib/types/template.ts)
interface Template {
	id: string;
	name: string;
	description?: string;
	version: string;
	author: string;
	nativeLanguage: Language;
	learningLanguage: Language;
	languageLevel: CEFRLevel;
	frontLayout: string;
	backLayout: string;
	styles: TemplateStyles;
	user: string;
	isPublic: boolean;
	created: string;
	updated: string;
}

interface Field {
	id: string;
	template: string;
	type: FieldType;
	isInput: boolean;
	language: Language;
	label: string;
	description?: string;
	example?: string;
	order: number;
	created: string;
	updated: string;
}

interface TemplateStyles {
	theme: string;
	fontFamily: string;
	fontSize: string;
	textColor: string;
	backgroundColor: string;
	borderRadius: string;
	padding: string;
	customCSS?: string;
}

enum FieldType {
	TEXT = 'TEXT',
	IMAGE = 'IMAGE',
	AUDIO = 'AUDIO'
}

enum CEFRLevel {
	A1 = 'A1',
	A2 = 'A2',
	B1 = 'B1',
	B2 = 'B2',
	C1 = 'C1',
	C2 = 'C2'
}
```

### 3.2 PocketBase Collection Schemas

```javascript
// Templates collection schema
{
  "name": "templates",
  "type": "base",
  "schema": [
    {
      "name": "name",
      "type": "text",
      "required": true,
      "options": { "max": 100 }
    },
    {
      "name": "description",
      "type": "text",
      "required": false,
      "options": { "max": 500 }
    },
    {
      "name": "version",
      "type": "text",
      "required": true
    },
    {
      "name": "nativeLanguage",
      "type": "select",
      "required": true,
      "options": {
        "values": ["EN", "ES", "FR", "DE", "IT", "PL"]
      }
    },
    {
      "name": "learningLanguage",
      "type": "select",
      "required": true,
      "options": {
        "values": ["EN", "ES", "FR", "DE", "IT", "PL"]
      }
    },
    {
      "name": "languageLevel",
      "type": "select",
      "required": true,
      "options": {
        "values": ["A1", "A2", "B1", "B2", "C1", "C2"]
      }
    },
    {
      "name": "frontLayout",
      "type": "text",
      "required": true
    },
    {
      "name": "backLayout",
      "type": "text",
      "required": true
    },
    {
      "name": "styles",
      "type": "json",
      "required": true
    },
    {
      "name": "user",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "users",
        "cascadeDelete": true
      }
    },
    {
      "name": "isPublic",
      "type": "bool",
      "required": true
    }
  ]
}

// Fields collection schema
{
  "name": "fields",
  "type": "base",
  "schema": [
    {
      "name": "template",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "templates",
        "cascadeDelete": true
      }
    },
    {
      "name": "type",
      "type": "select",
      "required": true,
      "options": {
        "values": ["TEXT", "IMAGE", "AUDIO"]
      }
    },
    {
      "name": "isInput",
      "type": "bool",
      "required": true
    },
    {
      "name": "language",
      "type": "select",
      "required": true,
      "options": {
        "values": ["EN", "ES", "FR", "DE", "IT", "PL", "NEUTRAL"]
      }
    },
    {
      "name": "label",
      "type": "text",
      "required": true,
      "options": { "max": 50 }
    },
    {
      "name": "description",
      "type": "text",
      "required": false,
      "options": { "max": 200 }
    },
    {
      "name": "example",
      "type": "text",
      "required": false,
      "options": { "max": 100 }
    },
    {
      "name": "order",
      "type": "number",
      "required": true
    }
  ]
}
```

### 3.3 Component Architecture

```svelte
<!-- Template editor main component (src/lib/components/template/TemplateEditor.svelte) -->
<script lang="ts">
	import type { Template, Field } from '$lib/types/template.js';
	import { templateCreationStore } from '$lib/stores/template-creation.store.js';
	import { TemplateInfoForm } from './steps/TemplateInfoForm.svelte';
	import { FieldManager } from './steps/FieldManager.svelte';
	import { LayoutEditor } from './steps/LayoutEditor.svelte';
	import { StyleCustomizer } from './steps/StyleCustomizer.svelte';
	import { TemplatePreview } from './steps/TemplatePreview.svelte';

	interface Props {
		existingTemplate?: Template;
		mode: 'create' | 'edit';
	}

	let { existingTemplate, mode }: Props = $props();

	let currentStep = $state<'info' | 'fields' | 'layout' | 'styles' | 'preview'>('info');
	let template = $state<Partial<Template>>(existingTemplate || {});
	let fields = $state<Field[]>([]);
	let saving = $state(false);

	const steps = [
		{ id: 'info', title: 'Template Info', component: TemplateInfoForm },
		{ id: 'fields', title: 'Fields', component: FieldManager },
		{ id: 'layout', title: 'Layout', component: LayoutEditor },
		{ id: 'styles', title: 'Styles', component: StyleCustomizer },
		{ id: 'preview', title: 'Preview', component: TemplatePreview }
	];

	let canProceed = $derived(() => {
		switch (currentStep) {
			case 'info':
				return template.name && template.nativeLanguage && template.learningLanguage;
			case 'fields':
				return fields.length > 0 && fields.some((f) => f.isInput);
			case 'layout':
				return template.frontLayout && template.backLayout;
			default:
				return true;
		}
	});

	async function handleSave() {
		saving = true;
		try {
			const savedTemplate = await templateCreationStore.saveTemplate(template, fields);
			// Navigate to template or show success
		} catch (error) {
			// Handle error
		} finally {
			saving = false;
		}
	}
</script>

<div class="template-editor">
	<nav class="steps-nav">
		{#each steps as step, index}
			<button
				class="step-button"
				class:active={currentStep === step.id}
				class:completed={index < steps.findIndex((s) => s.id === currentStep)}
				onclick={() => (currentStep = step.id)}
			>
				{step.title}
			</button>
		{/each}
	</nav>

	<main class="step-content">
		{#if currentStep === 'info'}
			<TemplateInfoForm bind:template />
		{:else if currentStep === 'fields'}
			<FieldManager bind:fields {template} />
		{:else if currentStep === 'layout'}
			<LayoutEditor bind:template {fields} />
		{:else if currentStep === 'styles'}
			<StyleCustomizer bind:template />
		{:else if currentStep === 'preview'}
			<TemplatePreview {template} {fields} />
		{/if}
	</main>

	<footer class="editor-actions">
		<Button
			variant="outline"
			onclick={() => {
				const currentIndex = steps.findIndex((s) => s.id === currentStep);
				if (currentIndex > 0) currentStep = steps[currentIndex - 1].id;
			}}
			disabled={currentStep === 'info'}
		>
			Previous
		</Button>

		{#if currentStep === 'preview'}
			<Button onclick={handleSave} disabled={saving}>
				{saving ? 'Saving...' : mode === 'create' ? 'Create Template' : 'Save Changes'}
			</Button>
		{:else}
			<Button
				onclick={() => {
					const currentIndex = steps.findIndex((s) => s.id === currentStep);
					if (currentIndex < steps.length - 1) currentStep = steps[currentIndex + 1].id;
				}}
				disabled={!canProceed}
			>
				Next
			</Button>
		{/if}
	</footer>
</div>
```

## 4. Implementation Guidelines

### 4.1 File Structure

```
src/lib/
├── components/
│   └── template/
│       ├── TemplateEditor.svelte
│       ├── TemplateBrowser.svelte
│       ├── TemplateCard.svelte
│       └── steps/
│           ├── TemplateInfoForm.svelte
│           ├── FieldManager.svelte
│           ├── LayoutEditor.svelte
│           ├── StyleCustomizer.svelte
│           └── TemplatePreview.svelte
├── services/
│   ├── template.service.ts
│   ├── field.service.ts
│   └── ai-prompt.service.ts
├── stores/
│   ├── template-creation.store.ts
│   └── template-browser.store.ts
├── types/
│   ├── template.ts
│   └── field.ts
└── data/
    └── starter-templates.ts
```

### 4.2 Testing Requirements

- Unit tests for template and field services
- Component tests for all editor steps
- Integration tests for template creation workflow
- E2E tests for complete template creation and usage
- Performance tests for large template handling

### 4.3 Accessibility Requirements

- ARIA labels for all form controls
- Keyboard navigation through editor steps
- Screen reader announcements for step changes
- Focus management during wizard navigation
- High contrast support for visual elements

## 5. Validation Criteria

### 5.1 Functional Validation

- [ ] Template creation with all required fields
- [ ] Field management (add, edit, delete, reorder)
- [ ] Rich text layout editing with placeholders
- [ ] Style customization and preview
- [ ] Template cloning and sharing
- [ ] Starter template initialization
- [ ] AI context integration

### 5.2 Technical Validation

- [ ] Type safety with TypeScript interfaces
- [ ] Proper error handling and validation
- [ ] Performance optimization for large templates
- [ ] Memory management in editor components
- [ ] Data persistence and synchronization

### 5.3 UX Validation

- [ ] Intuitive wizard flow
- [ ] Real-time preview functionality
- [ ] Responsive design across devices
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Error states and user feedback

## Related Documentation

### Requirements

- [Flashcard Creator Requirements](./flashcard-creator.requirements.md)
- [AI Integration Requirements](../architecture/ai-integration.md)
- [User Management Requirements](./user-management.requirements.md)

### API Documentation

- [Template Service API](../api/services/template.service.md)
- [Field Service API](../api/services/field.service.md)
- [AI Service API](../api/services/ai.service.md)

### Component Documentation

- [Template Editor Component](../components/feature/template-editor.component.md)
- [Rich Text Editor Component](../components/ui/rich-text-editor.component.md)

### User Stories

- [Template Creation Workflow](../user-stories/teacher-workflows.md#template-creation)
- [Template Discovery Journey](../user-stories/individual-learner-workflows.md#template-discovery)
