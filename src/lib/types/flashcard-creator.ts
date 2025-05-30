// Types for the new three-step flashcard creation process

import type { Template } from '$lib/services/template.service.js';
import type { Field } from '$lib/services/field.service.js';
import type { Flashcard } from '$lib/services/flashcard.service.js';

// AI Generation types
export interface AIGenerationItem {
	id: string;
	instructions: string;
	field_name: string;
	field_type: string;
	field_description?: string;
	current_content?: string;
	overwrite?: boolean;
}

export interface FlashcardCreationSession {
	id: string; // Session ID
	templateId: string | null;
	template: Template | null;
	selectedTemplate: Template | null; // Alias for template to match usage
	flashcardRows: FlashcardRow[]; // Array of flashcards being created/refined
	cards: FlashcardRow[]; // Alias for flashcardRows to match usage
	selectedDeckId: string | null;
	metadata: {
		tags: string[];
		difficulty: string;
	};
	createdAt: Date;
	created: string; // ISO string version of createdAt
	updated: string; // ISO string for last update
	currentStep: 'template-selection' | 'create-refine' | 'saving';
	batchContext: string; // Context for AI batch generation
}

export interface FlashcardRow {
	id: string; // Unique ID for this row in the current session
	front: FlashcardCell;
	back: FlashcardCell;
	cells: Record<string, FlashcardCell>; // fieldId -> FlashcardCell mapping
	isSelected: boolean;
	status: 'manual' | 'ai-generated' | 'edited'; // Track how the card was created
	metadata: {
		createdAt: Date;
		aiGenerated: boolean;
	};
}

export interface FlashcardCell {
	fieldId: string;
	content: string;
	aiGenerated: boolean;
	isAIGenerated: boolean; // Alias for aiGenerated to match usage
	feedback?: AIGeneratedCellFeedback | undefined;
}

export interface AIGeneratedCellFeedback {
	rating: 'positive' | 'negative';
	comment: string;
	timestamp: string;
}

export interface AIBatchGenerationRequest {
	templateId: string;
	batchContext?: string;
	items: AIGenerationItem[];
}

export interface AIBatchGenerationResponse {
	results: Array<{
		id: string; // Matches the ID from the request item
		success: boolean;
		content?: string; // Generated content for the field
		error?: string;
	}>;
	batchError?: string;
}

export interface TemplateField {
	id: string;
	name: string;
	type: 'TEXT' | 'IMAGE' | 'AUDIO';
	required: boolean;
	placeholder?: string;
}

export interface Deck {
	id: string;
	name: string;
	description: string;
	cards: Flashcard[];
	metadata: Record<string, unknown>;
}

export interface FlashcardTableCreatorProps {
	template: Template;
	fields: Field[];
	deck?: Deck;
	session: FlashcardCreationSession;
}

export interface SaveToDeckModalProps {
	deck: Deck;
	cards: FlashcardRow[];
	template: Template | null;
	isLoading: boolean;
}

export interface FlashcardRowActionsProps {
	row: FlashcardRow;
	template: Template;
	batchContext: string;
	onRegenerateAI: (rowId: string) => void;
	onPreview: (row: FlashcardRow) => void;
	onDelete: (rowId: string) => void;
}

export interface FlashcardPreviewModalProps {
	row: FlashcardRow | null;
	template: Template;
	open: boolean;
	onClose: () => void;
}
