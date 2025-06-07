import type {
	FlashcardGenerationRequest,
	FlashcardGenerationResponse,
	GenerationFieldData
} from '$lib/types/flashcard-creator.js';
import type { Template } from '$lib/services/template.service.js';
import { pb } from '$lib/pocketbase.js';

// FastAPI AI service configuration
const AI_SERVICE_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8090';
const ENABLE_MOCK_AI =
	import.meta.env.VITE_ENABLE_MOCK_AI === 'true' || import.meta.env.NODE_ENV === 'development';

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
 * Mock AI service for development when FastAPI backend is not available
 * Now expects input fields and generates output fields based on template
 */
const mockAIGenerate = async (
	request: FlashcardGenerationRequest
): Promise<FlashcardGenerationResponse> => {
	console.log('🤖 Mock AI Generate - Request received:', request);

	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

	const fields: GenerationFieldData[] = [];

	// Group input fields by flashcardId to process each flashcard
	const flashcardMap = new Map<number, GenerationFieldData[]>();
	request.inputFields.forEach((inputField) => {
		const flashcardId = inputField.flashcardId;
		if (flashcardId === undefined) {
			console.warn('Input field missing flashcardId:', inputField);
			return;
		}
		if (!flashcardMap.has(flashcardId)) {
			flashcardMap.set(flashcardId, []);
		}
		flashcardMap.get(flashcardId)!.push(inputField);
	});

	console.log(`🤖 Processing ${flashcardMap.size} flashcards:`, Array.from(flashcardMap.keys()));

	// For each flashcard, generate output fields based on input fields
	flashcardMap.forEach((inputFields, flashcardId) => {
		console.log(`🤖 Processing flashcard ${flashcardId} with input fields:`, inputFields);

		// Combine all input content for context
		const inputContext = inputFields.map((f) => f.value).join(', ');
		console.log(`🤖 Input context for flashcard ${flashcardId}:`, inputContext);

		// Mock output field IDs - in real implementation, these would come from template configuration
		// For now, we'll generate common output field types
		const mockOutputFields = [
			{ fieldId: 'z8xm8cbf131oq6n', type: 'translation' }, // Translation field
			{ fieldId: '608wcu31y4o842b', type: 'example' } // Example field
		];

		mockOutputFields.forEach((outputField) => {
			let mockContent = '';

			// Generate different content based on field type
			switch (outputField.type) {
				case 'translation':
					mockContent = `Translation of: ${inputContext}`;
					break;
				case 'example':
					mockContent = `Example sentence with: ${inputContext}`;
					break;
				case 'definition':
					mockContent = `Definition of: ${inputContext}`;
					break;
				default:
					mockContent = `Generated content for ${outputField.fieldId}: ${inputContext}`;
			}

			console.log(
				`🤖 Generated for flashcard ${flashcardId}, field ${outputField.fieldId}:`,
				mockContent
			);

			fields.push({
				fieldId: outputField.fieldId,
				flashcardId: flashcardId,
				value: mockContent
			});
		});
	});

	// Simulate occasional errors
	const hasError = Math.random() > 0.95;

	const response = {
		fields,
		error: hasError ? 'Mock generation error' : undefined
	};

	console.log('🤖 Mock AI Generate - Response:', response);
	return response;
};

/**
 * AI Service for communicating with FastAPI AI backend
 * Handles batch generation and individual card generation
 */
export const aiService = {
	/**
	 * Generate content for flashcards - handles both single and multiple cards
	 */
	generate: async (request: FlashcardGenerationRequest): Promise<FlashcardGenerationResponse> => {
		// Use mock service in development when AI service is not available
		if (ENABLE_MOCK_AI) {
			console.warn('Using mock AI service for development');
			return mockAIGenerate(request);
		}

		try {
			// Get the current user token from PocketBase
			const token = pb.authStore.token;

			if (!token) {
				throw new AIServiceException({
					type: 'invalid-response',
					message: 'User authentication required for AI generation.',
					details: 'No valid authentication token found'
				});
			}

			const response = await fetch(`${AI_SERVICE_BASE_URL}/api/flashcards/generate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(request)
			});

			if (!response.ok) {
				return aiService.handleErrorResponse(response);
			}

			const data = await response.json();
			return data as FlashcardGenerationResponse;
		} catch (error) {
			console.error('AI generation error:', error);

			// Fallback to mock service if real service is unavailable
			if (import.meta.env.NODE_ENV === 'development') {
				console.warn('AI service unavailable, falling back to mock service');
				return mockAIGenerate(request);
			}

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
			case 401:
				error = {
					type: 'invalid-response',
					message: 'Authentication failed. Please login again.',
					details: errorData
				};
				break;
			case 403:
				error = {
					type: 'invalid-response',
					message: 'You do not have permission to access AI generation.',
					details: errorData
				};
				break;
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
		inputFields: GenerationFieldData[],
		batchContext?: string
	): FlashcardGenerationRequest => {
		return {
			templateId: template.id,
			batchContext: batchContext || template.description,
			inputFields: inputFields
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
