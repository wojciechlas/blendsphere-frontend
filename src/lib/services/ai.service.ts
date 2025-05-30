import type {
	AIBatchGenerationRequest,
	AIBatchGenerationResponse,
	FlashcardRow,
	AIGenerationItem
} from '$lib/types/flashcard-creator.js';
import type { Template } from '$lib/services/template.service.js';

// FastAPI AI service configuration
const AI_SERVICE_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001';

export interface AIServiceError {
	type: 'network' | 'rate-limit' | 'content-filter' | 'invalid-response' | 'server-error';
	message: string;
	details?: unknown;
}

export class AIServiceException extends Error {
	public readonly error: AIServiceError;

	constructor(error: AIServiceError) {
		super(error.message);
		this.error = error;
		this.name = 'AIServiceException';
	}
}

/**
 * AI Service for communicating with FastAPI AI backend
 * Handles batch generation and individual card generation
 */
export const aiService = {
	/**
	 * Generate content for flashcards - handles both single and multiple cards
	 */
	generate: async (request: AIBatchGenerationRequest): Promise<AIBatchGenerationResponse> => {
		try {
			const response = await fetch(`${AI_SERVICE_BASE_URL}/api/ai/generate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(request)
			});

			if (!response.ok) {
				return aiService.handleErrorResponse(response);
			}

			const data = await response.json();
			return data as AIBatchGenerationResponse;
		} catch (error) {
			console.error('AI generation error:', error);
			if (error instanceof AIServiceException) {
				throw error;
			}
			throw new AIServiceException({
				type: 'network',
				message: 'Unable to connect to AI service. Please check your connection.',
				details: error
			});
		}
	},

	/**
	 * Handle error responses from the AI service
	 */
	handleErrorResponse: async (response: Response): Promise<never> => {
		const status = response.status;
		let errorData;

		try {
			errorData = await response.json();
		} catch {
			errorData = { message: 'Unknown error occurred' };
		}

		let error: AIServiceError;

		switch (status) {
			case 429:
				error = {
					type: 'rate-limit',
					message: 'AI generation temporarily unavailable. Please try again in a few minutes.',
					details: errorData
				};
				break;
			case 400:
				error = {
					type: 'content-filter',
					message: 'Generated content was filtered. Please modify your input and try again.',
					details: errorData
				};
				break;
			case 422:
				error = {
					type: 'invalid-response',
					message: 'AI generated invalid content. Please try again or enter manually.',
					details: errorData
				};
				break;
			case 500:
			case 502:
			case 503:
			case 504:
				error = {
					type: 'server-error',
					message: 'AI service is temporarily unavailable. Please try again later.',
					details: errorData
				};
				break;
			default:
				error = {
					type: 'server-error',
					message: errorData.message || 'An unexpected error occurred.',
					details: errorData
				};
		}

		throw new AIServiceException(error);
	},

	/**
	 * Build generation request from template and data - supports both single and multiple cards
	 */
	buildRequest: (
		template: Template,
		items: AIGenerationItem[],
		batchContext?: string
	): AIBatchGenerationRequest => {
		return {
			templateId: template.id,
			batchContext: batchContext || template.description,
			items: items
		};
	},

	/**
	 * Build generation request from table data (legacy method for backward compatibility)
	 */
	buildBatchRequest: (
		template: Template,
		rows: FlashcardRow[],
		batchContext: string
	): AIBatchGenerationRequest => {
		// Filter rows that are eligible for AI generation (have input data)
		const eligibleRows = rows.filter((row) => {
			// Check if row has input fields with content
			return Object.values(row.cells).some(
				(cell) => cell.content && cell.content.trim().length > 0
			);
		});

		// Convert to AIGenerationItem format
		const items: AIGenerationItem[] = [];

		eligibleRows.forEach((row, rowIndex) => {
			// For each field in the row, create a generation item
			Object.entries(row.cells).forEach(([fieldId, cell]) => {
				if (cell.content && cell.content.trim().length > 0) {
					items.push({
						id: `${row.id || `row_${rowIndex}`}_${fieldId}`,
						instructions: batchContext,
						field_name: fieldId,
						field_type: 'text', // Default to text, could be enhanced to detect type
						field_description: undefined,
						current_content: cell.content,
						overwrite: true
					});
				}
			});
		});

		return {
			templateId: template.id,
			batchContext,
			items
		};
	},

	/**
	 * Check if AI service is available
	 */
	healthCheck: async (): Promise<boolean> => {
		try {
			const response = await fetch(`${AI_SERVICE_BASE_URL}/health`, {
				method: 'GET',
				timeout: 5000 // 5 second timeout
			} as RequestInit);
			return response.ok;
		} catch {
			return false;
		}
	}
};
