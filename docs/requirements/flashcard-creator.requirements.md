# Flashcard Creator System Requirements

---

component: FlashcardCreator
type: requirements
version: 2.0.0
dependencies:

- template-system
- ai-integration
- deck-management
- media-upload
- bulk-processing
  context_tags:
- flashcard
- ai-generation
- template
- bulk-creation
- media-handling
- content-creation
- user-interface
  last_updated: 2025-05-29
  ai_context: |
  Flashcard Creator System for BlendSphere that enables users to create flashcards
  using templates with AI-powered content generation, bulk creation capabilities,
  and comprehensive media handling. Integrates with template system and AI services
  for enhanced content creation workflow.

---

## 1. Overview

### 1.1 Purpose

Provide an intuitive and powerful interface for creating flashcards using the template system, with AI-assisted content generation, bulk creation capabilities, and seamless integration with deck management for the BlendSphere language learning platform.

### 1.2 Scope

- Template-based flashcard creation interface
- AI content generation with context awareness
- Bulk creation from clipboard and file upload
- Media handling (images, audio) with validation
- Real-time preview and validation
- Session management with auto-save
- Integration with deck management system
- Test mode for flashcard simulation

### 1.3 Dependencies

- **Frontend**: Template selection, dynamic forms, AI generation UI, media upload
- **Backend**: PocketBase flashcards collection, FastAPI AI service, media storage
- **External**: File processing libraries, media optimization services

## 2. Functional Requirements

### 2.1 Template Integration

#### REQ-FC-001: Template Selection Interface

**Priority**: P0 (Critical)
**Component**: TemplateSelector, FlashcardCreator
**Dependencies**: TemplateService, TemplateStore

**Description**:
Users must be able to select from available templates when creating flashcards with proper filtering and preview capabilities.

**AI Context**:

- Component type: Svelte 5 component with template selection
- UI library: shadcn-svelte components (Dialog, Card, Button)
- Data source: PocketBase templates collection
- State management: Template selection store

**Acceptance Criteria**:

1. Display templates in filterable grid layout
2. Show template preview with field structure
3. Filter by user permissions (owned, public, shared)
4. Template compatibility validation
5. Language pair matching with user preferences
6. Search functionality in template names/descriptions

**Implementation Hints**:

```typescript
// Template selection component
let selectedTemplate = $state<Template | null>(null);
let availableTemplates = $state<Template[]>([]);
let templateFilter = $state({
	languages: [] as string[],
	levels: [] as CEFRLevel[],
	search: ''
});

let filteredTemplates = $derived(() => {
	return availableTemplates.filter((template) => {
		// Filter logic
		return (
			matchesLanguageFilter(template) &&
			matchesLevelFilter(template) &&
			matchesSearchFilter(template)
		);
	});
});

async function selectTemplate(template: Template) {
	selectedTemplate = template;
	const fields = await fieldService.getByTemplate(template.id);
	initializeFormFromTemplate(template, fields);
}
```

**Related Files**:

- `src/lib/components/flashcard/TemplateSelector.svelte`
- `src/lib/components/flashcard/FlashcardCreator.svelte`
- `src/lib/services/template.service.ts`

#### REQ-FC-002: Dynamic Form Generation

**Priority**: P0 (Critical)
**Component**: DynamicForm, FieldRenderer
**Dependencies**: Template fields, form validation

**Description**:
System must generate forms dynamically based on template field definitions with proper validation and type handling.

**AI Context**:

- Form generation: Dynamic Svelte components based on field types
- Validation: Zod schemas generated from field definitions
- UI components: Input, Textarea, FileUpload from shadcn-svelte
- State: Reactive form data with field-level validation

**Acceptance Criteria**:

1. Generate form fields based on template field definitions
2. Distinguish between input fields and AI-generated output fields
3. Required field validation and visual indicators
4. Field type-specific validation (text, image, audio)
5. Language-specific input handling
6. Real-time validation feedback

**Implementation Hints**:

```typescript
// Dynamic form generation
let formData = $state<Record<string, unknown>>({});
let fieldErrors = $state<Record<string, string>>({});
let inputFields = $derived(fields.filter((f) => f.isInput));
let outputFields = $derived(fields.filter((f) => !f.isInput));

// Field validation schema generation
function generateValidationSchema(fields: Field[]) {
	const schema: Record<string, z.ZodSchema> = {};

	fields.forEach((field) => {
		switch (field.type) {
			case FieldType.TEXT:
				schema[field.label] = z.string().min(1, `${field.label} is required`);
				break;
			case FieldType.IMAGE:
				schema[field.label] = z
					.instanceof(File)
					.refine((file) => file.size <= 5 * 1024 * 1024, 'File must be less than 5MB')
					.refine(
						(file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
						'Invalid file type'
					);
				break;
			// ... other field types
		}
	});

	return z.object(schema);
}

// Dynamic field rendering
function renderField(field: Field) {
	switch (field.type) {
		case FieldType.TEXT:
			return TextInput;
		case FieldType.IMAGE:
			return ImageUpload;
		case FieldType.AUDIO:
			return AudioUpload;
	}
}
```

### 2.2 AI Content Generation

#### REQ-FC-003: AI Generation Workflow

**Priority**: P0 (Critical)
**Component**: AIGenerationPanel, ContentGenerator
**Dependencies**: FastAPI AI service, template context

**Description**:
Users must be able to trigger AI generation for output fields with comprehensive context and feedback mechanisms.

**AI Context**:

- Service integration: FastAPI AI service calls
- Context building: Template + field descriptions + user input
- UI patterns: Loading states, progress indicators, error handling
- Generation workflow: Input validation → Context building → AI call → Result display

**Acceptance Criteria**:

1. Trigger AI generation after input field completion
2. Loading indicators during AI processing
3. Generated content displayed in editable fields
4. Individual field regeneration capabilities
5. Generation history and alternatives
6. Context-aware generation based on template and user data

**Implementation Hints**:

```typescript
// AI generation workflow
let generating = $state(false);
let generatedContent = $state<Record<string, unknown>>({});
let generationHistory = $state<GenerationResult[]>([]);

async function generateContent() {
	if (!validateInputFields()) return;

	generating = true;
	try {
		const prompt = buildGenerationPrompt();
		const response = await aiService.generateContent(prompt);

		generatedContent = { ...generatedContent, ...response.generatedFields };
		generationHistory = [...generationHistory, response];

		// Apply generated content to form
		Object.entries(response.generatedFields).forEach(([field, value]) => {
			formData[field] = value;
		});
	} catch (error) {
		handleGenerationError(error);
	} finally {
		generating = false;
	}
}

function buildGenerationPrompt(): AIGenerationRequest {
	return {
		templateId: selectedTemplate.id,
		inputFields: getInputFieldValues(),
		language: {
			native: selectedTemplate.nativeLanguage,
			learning: selectedTemplate.learningLanguage,
			level: selectedTemplate.languageLevel
		},
		context: {
			userAbout: currentUser.aboutMe,
			templateDescription: selectedTemplate.description
		}
	};
}

async function regenerateField(fieldName: string) {
	generating = true;
	try {
		const response = await aiService.regenerateField(fieldName, buildGenerationPrompt());
		formData[fieldName] = response.value;
		generatedContent[fieldName] = response.value;
	} catch (error) {
		handleGenerationError(error);
	} finally {
		generating = false;
	}
}
```

#### REQ-FC-004: Content Quality Management

**Priority**: P1 (High)
**Component**: ContentReview, QualityFeedback
**Dependencies**: Generation service, user feedback system

**Description**:
System must provide mechanisms for users to review, rate, and provide feedback on AI-generated content quality.

**AI Context**:

- Feedback collection: Rating system, alternative requests
- Quality tracking: Success rates, user satisfaction
- UI components: Rating stars, feedback forms, regeneration buttons
- Analytics: Generation quality metrics

**Acceptance Criteria**:

1. Content quality rating system (1-5 stars)
2. Alternative generation requests
3. Feedback collection for improvement
4. Generation success rate tracking
5. Error handling for AI service failures
6. Content editing capabilities post-generation

**Implementation Hints**:

```typescript
// Content quality management
let contentRatings = $state<Record<string, number>>({});
let qualityFeedback = $state<Record<string, string>>({});

async function rateContent(fieldName: string, rating: number, feedback?: string) {
	contentRatings[fieldName] = rating;
	if (feedback) qualityFeedback[fieldName] = feedback;

	// Send feedback to analytics
	await analyticsService.recordContentRating({
		fieldName,
		rating,
		feedback,
		templateId: selectedTemplate.id,
		generationId: generationHistory[generationHistory.length - 1]?.id
	});
}

async function requestAlternative(fieldName: string) {
	try {
		const alternatives = await aiService.generateAlternatives(fieldName, buildGenerationPrompt());
		// Show alternatives selection UI
		showAlternativesDialog(fieldName, alternatives);
	} catch (error) {
		handleGenerationError(error);
	}
}
```

### 2.3 Bulk Creation Capabilities

#### REQ-FC-005: Clipboard and Text Import

**Priority**: P1 (High)
**Component**: BulkImport, TextProcessor
**Dependencies**: Text parsing, validation system

**Description**:
Users must be able to create multiple flashcards from clipboard text or manual input with proper parsing and validation.

**AI Context**:

- Text processing: Line-by-line parsing, delimiter detection
- Validation: Format validation, field mapping
- UI components: Textarea, import preview, validation feedback
- Batch processing: Queue management for AI generation

**Acceptance Criteria**:

1. Paste newline-separated text for bulk creation
2. Automatic format detection and parsing
3. Preview and validation before processing
4. Batch AI generation for all items
5. Individual item editing capabilities
6. Progress indicators for bulk operations

**Implementation Hints**:

```typescript
// Bulk import functionality
let bulkText = $state('');
let parsedItems = $state<BulkItem[]>([]);
let bulkMode = $state<'text' | 'file'>('text');
let processingBulk = $state(false);

function parseBulkText(text: string): BulkItem[] {
	const lines = text.split('\n').filter((line) => line.trim());

	return lines.map((line, index) => {
		// Parse based on template input fields
		const values = detectDelimiter(line);
		const mappedValues: Record<string, unknown> = {};

		inputFields.forEach((field, fieldIndex) => {
			if (values[fieldIndex]) {
				mappedValues[field.label] = values[fieldIndex];
			}
		});

		return {
			id: `bulk-${index}`,
			inputValues: mappedValues,
			isValid: validateBulkItem(mappedValues),
			errors: []
		};
	});
}

async function processBulkItems() {
	processingBulk = true;
	const results: FlashcardData[] = [];

	try {
		for (let i = 0; i < parsedItems.length; i++) {
			const item = parsedItems[i];
			if (!item.isValid) continue;

			// Generate content for this item
			const generatedContent = await generateContentForItem(item.inputValues);

			results.push({
				...item.inputValues,
				...generatedContent,
				template: selectedTemplate.id
			});

			// Update progress
			bulkProgress = (i + 1) / parsedItems.length;
		}

		// Save all flashcards
		await flashcardService.createBulk(results, selectedDeck.id);
	} catch (error) {
		handleBulkProcessingError(error);
	} finally {
		processingBulk = false;
	}
}
```

#### REQ-FC-006: File Upload Support

**Priority**: P2 (Medium)
**Component**: FileUpload, CSVProcessor
**Dependencies**: File processing, CSV parsing

**Description**:
System must support CSV/TSV file upload for bulk flashcard creation with proper validation and processing.

**AI Context**:

- File handling: CSV parsing, validation, preview
- UI components: File upload, drag-and-drop, progress indicators
- Processing: Stream processing for large files
- Validation: File format, size limits, content validation

**Acceptance Criteria**:

1. CSV/TSV file upload support
2. File size limit (1MB maximum)
3. Format validation and error reporting
4. Column mapping to template fields
5. Upload progress indicators
6. Preview before processing

**Implementation Hints**:

```typescript
// File upload and processing
let uploadedFile = $state<File | null>(null);
let csvData = $state<string[][]>([]);
let columnMapping = $state<Record<number, string>>({});
let uploadProgress = $state(0);

async function handleFileUpload(file: File) {
	if (file.size > 1024 * 1024) {
		throw new Error('File size must be less than 1MB');
	}

	if (!['text/csv', 'text/tab-separated-values'].includes(file.type)) {
		throw new Error('Only CSV and TSV files are supported');
	}

	uploadedFile = file;
	csvData = await parseCSVFile(file);

	// Auto-detect column mapping
	autoMapColumns();
}

function parseCSVFile(file: File): Promise<string[][]> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onprogress = (event) => {
			uploadProgress = (event.loaded / event.total) * 100;
		};
		reader.onload = (event) => {
			const csv = event.target?.result as string;
			const rows = csv.split('\n').map((row) => row.split(','));
			resolve(rows);
		};
		reader.onerror = reject;
		reader.readAsText(file);
	});
}
```

### 2.4 Media Handling

#### REQ-FC-007: File Upload and Validation

**Priority**: P1 (High)
**Component**: MediaUpload, FileValidator
**Dependencies**: File storage, media processing

**Description**:
System must support image and audio file uploads with proper validation, optimization, and preview capabilities.

**AI Context**:

- File types: JPEG, PNG, WebP for images; MP3, WAV, OGG for audio
- Validation: File size, type, integrity checks
- Processing: Image optimization, thumbnail generation
- UI components: Drag-and-drop upload, preview, progress indicators

**Acceptance Criteria**:

1. Support image uploads (JPEG, PNG, WebP)
2. Support audio uploads (MP3, WAV, OGG)
3. File size limits (5MB per file)
4. File validation and error handling
5. Preview capabilities for all media types
6. Progress indicators during upload

**Implementation Hints**:

```typescript
// Media upload component
let uploadingFiles = $state<Map<string, number>>(new Map());
let uploadedMedia = $state<Record<string, MediaFile>>({});

interface MediaFile {
	id: string;
	filename: string;
	url: string;
	type: 'image' | 'audio';
	size: number;
	thumbnail?: string;
}

async function handleMediaUpload(fieldName: string, file: File) {
	// Validate file
	validateMediaFile(file);

	// Start upload with progress tracking
	uploadingFiles.set(fieldName, 0);

	try {
		const mediaFile = await mediaService.uploadFile(file, {
			onProgress: (progress) => {
				uploadingFiles.set(fieldName, progress);
				uploadingFiles = new Map(uploadingFiles);
			}
		});

		// Process uploaded file
		if (file.type.startsWith('image/')) {
			mediaFile.thumbnail = await generateThumbnail(mediaFile);
		}

		uploadedMedia[fieldName] = mediaFile;
		formData[fieldName] = mediaFile.url;
	} catch (error) {
		handleUploadError(fieldName, error);
	} finally {
		uploadingFiles.delete(fieldName);
		uploadingFiles = new Map(uploadingFiles);
	}
}

function validateMediaFile(file: File) {
	const maxSize = 5 * 1024 * 1024; // 5MB
	const allowedTypes = [
		'image/jpeg',
		'image/png',
		'image/webp',
		'audio/mpeg',
		'audio/wav',
		'audio/ogg'
	];

	if (file.size > maxSize) {
		throw new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`);
	}

	if (!allowedTypes.includes(file.type)) {
		throw new Error('Unsupported file type');
	}
}
```

### 2.5 Session Management and Performance

#### REQ-FC-008: Auto-Save and Session Persistence

**Priority**: P1 (High)
**Component**: SessionManager, AutoSave
**Dependencies**: Local storage, network handling

**Description**:
System must provide automatic saving of form data with session persistence and network interruption handling.

**AI Context**:

- Auto-save: Periodic saving every 30 seconds
- Storage: Browser localStorage for session persistence
- Network handling: Retry mechanisms, offline support
- UI feedback: Save status indicators

**Acceptance Criteria**:

1. Auto-save form data every 30 seconds
2. Network interruption handling
3. Save status notifications (saved, saving, error)
4. Session persistence across browser refresh
5. Conflict resolution for concurrent edits
6. Recovery from failed saves

**Implementation Hints**:

```typescript
// Session management and auto-save
let saveStatus = $state<'saved' | 'saving' | 'error' | 'unsaved'>('saved');
let lastSaveTime = $state<Date | null>(null);
let sessionId = $state<string>(crypto.randomUUID());

// Auto-save effect
$effect(() => {
	const interval = setInterval(async () => {
		if (hasUnsavedChanges()) {
			await autoSave();
		}
	}, 30000); // 30 seconds

	return () => clearInterval(interval);
});

async function autoSave() {
	if (saveStatus === 'saving') return;

	saveStatus = 'saving';

	try {
		// Save to localStorage
		localStorage.setItem(
			`flashcard-session-${sessionId}`,
			JSON.stringify({
				formData,
				selectedTemplate,
				generatedContent,
				timestamp: new Date().toISOString()
			})
		);

		// Attempt network save if online
		if (navigator.onLine) {
			await sessionService.saveSession(sessionId, {
				formData,
				templateId: selectedTemplate.id,
				status: 'draft'
			});
		}

		saveStatus = 'saved';
		lastSaveTime = new Date();
	} catch (error) {
		saveStatus = 'error';
		handleAutoSaveError(error);
	}
}

function restoreSession() {
	const sessionData = localStorage.getItem(`flashcard-session-${sessionId}`);
	if (sessionData) {
		const restored = JSON.parse(sessionData);
		formData = restored.formData || {};
		selectedTemplate = restored.selectedTemplate;
		generatedContent = restored.generatedContent || {};
	}
}
```

## 3. Technical Specifications

### 3.1 Data Structures

```typescript
// Flashcard creation interfaces (src/lib/types/flashcard-creator.ts)
interface FlashcardCreationSession {
	id: string;
	templateId: string;
	formData: Record<string, unknown>;
	generatedContent: Record<string, unknown>;
	status: 'draft' | 'generating' | 'complete';
	created: string;
	updated: string;
}

interface BulkCreationItem {
	id: string;
	inputValues: Record<string, unknown>;
	generatedValues?: Record<string, unknown>;
	isValid: boolean;
	errors: string[];
	status: 'pending' | 'processing' | 'complete' | 'error';
}

interface MediaFile {
	id: string;
	filename: string;
	url: string;
	type: 'image' | 'audio';
	size: number;
	mimeType: string;
	thumbnail?: string;
	duration?: number; // for audio files
}

interface AIGenerationRequest {
	templateId: string;
	inputFields: Record<string, unknown>;
	language: {
		native: string;
		learning: string;
		level: CEFRLevel;
	};
	context?: {
		userAbout?: string;
		templateDescription?: string;
		previousCards?: string[];
	};
}

interface AIGenerationResponse {
	success: boolean;
	generatedFields: Record<string, unknown>;
	confidence: number;
	alternatives?: Record<string, unknown[]>;
	error?: string;
	generationId: string;
}
```

### 3.2 Component Architecture

```svelte
<!-- Main flashcard creator component (src/lib/components/flashcard/FlashcardCreator.svelte) -->
<script lang="ts">
	import type { Template, Field } from '$lib/types/template.js';
	import { flashcardCreationStore } from '$lib/stores/flashcard-creation.store.js';
	import { TemplateSelector } from './TemplateSelector.svelte';
	import { DynamicForm } from './DynamicForm.svelte';
	import { AIGenerationPanel } from './AIGenerationPanel.svelte';
	import { FlashcardPreview } from './FlashcardPreview.svelte';
	import { BulkImport } from './BulkImport.svelte';

	interface Props {
		deckId: string;
		mode?: 'single' | 'bulk';
	}

	let { deckId, mode = 'single' }: Props = $props();

	let selectedTemplate = $state<Template | null>(null);
	let fields = $state<Field[]>([]);
	let formData = $state<Record<string, unknown>>({});
	let generatedContent = $state<Record<string, unknown>>({});
	let currentStep = $state<'template' | 'form' | 'generate' | 'preview'>('template');

	let canProceed = $derived(() => {
		switch (currentStep) {
			case 'template':
				return !!selectedTemplate;
			case 'form':
				return validateFormData(
					formData,
					fields.filter((f) => f.isInput)
				);
			case 'generate':
				return Object.keys(generatedContent).length > 0;
			default:
				return true;
		}
	});

	async function handleTemplateSelected(template: Template) {
		selectedTemplate = template;
		fields = await fieldService.getByTemplate(template.id);
		initializeFormData();
		currentStep = 'form';
	}

	async function handleFormComplete() {
		if (
			validateFormData(
				formData,
				fields.filter((f) => f.isInput)
			)
		) {
			currentStep = 'generate';
		}
	}

	async function handleGenerationComplete(generated: Record<string, unknown>) {
		generatedContent = generated;
		currentStep = 'preview';
	}

	async function handleSaveFlashcard() {
		const flashcardData = {
			...formData,
			...generatedContent,
			template: selectedTemplate.id,
			deck: deckId
		};

		await flashcardService.create(flashcardData);

		// Reset for next card or close
		resetCreator();
	}
</script>

<div class="flashcard-creator">
	<header class="creator-header">
		<h1>Create Flashcard</h1>
		<div class="mode-selector">
			<Button variant={mode === 'single' ? 'default' : 'outline'} onclick={() => (mode = 'single')}>
				Single
			</Button>
			<Button variant={mode === 'bulk' ? 'default' : 'outline'} onclick={() => (mode = 'bulk')}>
				Bulk
			</Button>
		</div>
	</header>

	{#if mode === 'bulk'}
		<BulkImport
			{selectedTemplate}
			{fields}
			{deckId}
			on:template-selected={handleTemplateSelected}
		/>
	{:else}
		<div class="creator-steps">
			{#if currentStep === 'template'}
				<TemplateSelector on:selected={handleTemplateSelected} />
			{:else if currentStep === 'form'}
				<DynamicForm {fields} bind:formData on:complete={handleFormComplete} />
			{:else if currentStep === 'generate'}
				<AIGenerationPanel
					{selectedTemplate}
					{fields}
					{formData}
					on:generated={handleGenerationComplete}
				/>
			{:else if currentStep === 'preview'}
				<FlashcardPreview
					{selectedTemplate}
					{fields}
					data={{ ...formData, ...generatedContent }}
					on:save={handleSaveFlashcard}
					on:edit={() => (currentStep = 'form')}
				/>
			{/if}
		</div>
	{/if}
</div>
```

## 4. Implementation Guidelines

### 4.1 File Structure

```
src/lib/
├── components/
│   └── flashcard/
│       ├── FlashcardCreator.svelte
│       ├── TemplateSelector.svelte
│       ├── DynamicForm.svelte
│       ├── AIGenerationPanel.svelte
│       ├── FlashcardPreview.svelte
│       ├── BulkImport.svelte
│       └── MediaUpload.svelte
├── services/
│   ├── flashcard.service.ts
│   ├── ai.service.ts
│   ├── media.service.ts
│   └── session.service.ts
├── stores/
│   ├── flashcard-creation.store.ts
│   └── bulk-import.store.ts
├── types/
│   └── flashcard-creator.ts
└── utils/
    ├── file-validation.ts
    └── text-processing.ts
```

### 4.2 Testing Requirements

- Unit tests for all service methods
- Component tests for form generation and validation
- Integration tests for AI generation workflow
- E2E tests for complete flashcard creation flow
- Performance tests for bulk operations

### 4.3 Accessibility Requirements

- ARIA labels for all form controls
- Keyboard navigation through creation steps
- Screen reader announcements for generation status
- Focus management during step transitions
- Error message accessibility

## 5. Validation Criteria

### 5.1 Functional Validation

- [ ] Template selection and form generation
- [ ] Dynamic form validation and submission
- [ ] AI content generation with context
- [ ] Bulk creation from text and files
- [ ] Media upload and processing
- [ ] Session management and auto-save
- [ ] Real-time preview functionality

### 5.2 Technical Validation

- [ ] Type safety with TypeScript interfaces
- [ ] Error handling and recovery
- [ ] Performance optimization for bulk operations
- [ ] Memory management in large sessions
- [ ] Network error handling and retry logic

### 5.3 UX Validation

- [ ] Intuitive creation workflow
- [ ] Clear visual feedback for all operations
- [ ] Responsive design across devices
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Loading states and progress indicators

## Related Documentation

### Requirements

- [Template System Requirements](./template-system.requirements.md)
- [AI Integration Requirements](../architecture/ai-integration.md)
- [Deck Management Requirements](./deck-management.requirements.md)

### API Documentation

- [Flashcard Service API](../api/services/flashcard.service.md)
- [AI Service API](../api/services/ai.service.md)
- [Media Service API](../api/services/media.service.md)

### Component Documentation

- [Flashcard Creator Component](../components/feature/flashcard-creator.component.md)
- [Dynamic Form Component](../components/ui/dynamic-form.component.md)

### User Stories

- [Flashcard Creation Workflow](../user-stories/teacher-workflows.md#flashcard-creation)
- [Bulk Content Import](../user-stories/teacher-workflows.md#bulk-import)
