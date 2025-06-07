// Types for the new three-step flashcard creation process

import type { Template } from '$lib/services/template.service.js';
import type { Flashcard } from '$lib/services/flashcard.service.js';

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
	status: 'manual' | 'ai-generated' | 'edited' | 'ready' | 'saved' | 'incomplete'; // Track how the card was created
	metadata: {
		createdAt: Date;
		aiGenerated: boolean;
		saved: boolean;
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

// AI Generation types
export interface GenerationFieldData {
	fieldId: string; // ID of field from fields collection
	flashcardId?: number; // Optional ID/index of the row this flashcard belongs to (for batch generation)
	value: string; // Generated content for this field
}

export interface FlashcardGenerationRequest {
	templateId: string;
	batchContext?: string;
	inputFields: GenerationFieldData[]; // Input data for generation
}

export interface FlashcardGenerationResponse {
	fields: GenerationFieldData[]; // Array of generated flashcards, each with multiple fields
	error?: string; // Optional error message
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
