---
title: PocketBase Integration API Reference
description: Comprehensive API reference for PocketBase backend integration
version: 1.0.0
last_updated: 2024-12-19
component: PocketBaseIntegration
dependencies:
  - PocketBase
  - AuthService
  - DataServices
context_tags:
  - '#api'
  - '#pocketbase'
  - '#backend'
  - '#authentication'
  - '#data-access'
related_docs:
  - 'docs/api/pocketbase-setup.md'
  - 'docs/api/pocketbase-collections.md'
  - 'docs/architecture/data-structure.md'
ai_context:
  intent: 'Provide complete PocketBase integration patterns for AI code generation'
  patterns: ['service layer', 'authentication', 'data access', 'error handling']
  considerations: ['type safety', 'real-time updates', 'offline support']
---

# PocketBase Integration API Reference

## Overview

This document provides comprehensive API reference for integrating with PocketBase backend in the BlendSphere application. It includes authentication patterns, data access services, real-time features, and error handling strategies.

## Core Integration

### PocketBase Client Setup

```typescript
// src/lib/pocketbase.ts
import PocketBase from 'pocketbase';
import { writable, type Writable } from 'svelte/store';
import type { Record as PBRecord, AuthModel } from 'pocketbase';

// Client configuration
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090');

// Authentication store
export const currentUser: Writable<AuthModel | null> = writable(pb.authStore.model);

// Reactive authentication state
pb.authStore.onChange((auth) => {
	currentUser.set(pb.authStore.model);
});

// Collection type-safe accessors
export const collections = {
	users: pb.collection('users'),
	templates: pb.collection('templates'),
	decks: pb.collection('decks'),
	flashcards: pb.collection('flashcards'),
	classes: pb.collection('classes'),
	studyProgress: pb.collection('study_progress'),
	userPreferences: pb.collection('user_preferences')
} as const;

// Utility functions
export function isLoggedIn(): boolean {
	return pb.authStore.isValid;
}

export function getCurrentUserId(): string | null {
	return pb.authStore.model?.id || null;
}
```

### Environment Configuration

```typescript
// Environment variables for PocketBase integration
interface PocketBaseConfig {
	url: string;
	timeout: number;
	retryAttempts: number;
	retryDelay: number;
}

export const pocketbaseConfig: PocketBaseConfig = {
	url: import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090',
	timeout: parseInt(import.meta.env.VITE_PB_TIMEOUT || '10000'),
	retryAttempts: parseInt(import.meta.env.VITE_PB_RETRY_ATTEMPTS || '3'),
	retryDelay: parseInt(import.meta.env.VITE_PB_RETRY_DELAY || '1000')
};
```

---

## Authentication Service

### API-AUTH-001: User Authentication

```typescript
// src/lib/services/auth.service.ts
import { pb, currentUser } from '$lib/pocketbase';
import type { AuthModel, RecordAuthResponse } from 'pocketbase';

export interface RegisterData {
	email: string;
	password: string;
	passwordConfirm: string;
	name: string;
	role?: 'student' | 'teacher' | 'individual';
}

export interface LoginData {
	email: string;
	password: string;
}

export interface PasswordResetData {
	email: string;
}

export interface PasswordConfirmData {
	token: string;
	password: string;
	passwordConfirm: string;
}

export class AuthService {
	/**
	 * Register a new user account
	 */
	async register(data: RegisterData): Promise<RecordAuthResponse<AuthModel>> {
		try {
			const record = await pb.collection('users').create({
				...data,
				role: data.role || 'individual',
				emailVisibility: true
			});

			// Automatically log in after registration
			const authData = await pb.collection('users').authWithPassword(data.email, data.password);

			return authData;
		} catch (error) {
			throw this.handleAuthError(error);
		}
	}

	/**
	 * Authenticate user with email and password
	 */
	async login(data: LoginData): Promise<RecordAuthResponse<AuthModel>> {
		try {
			const authData = await pb.collection('users').authWithPassword(data.email, data.password);

			return authData;
		} catch (error) {
			throw this.handleAuthError(error);
		}
	}

	/**
	 * Log out current user
	 */
	logout(): void {
		pb.authStore.clear();
		currentUser.set(null);
	}

	/**
	 * Get current authenticated user
	 */
	getCurrentUser(): AuthModel | null {
		return pb.authStore.model;
	}

	/**
	 * Check if user is authenticated
	 */
	isAuthenticated(): boolean {
		return pb.authStore.isValid;
	}

	/**
	 * Request password reset email
	 */
	async requestPasswordReset(data: PasswordResetData): Promise<void> {
		try {
			await pb.collection('users').requestPasswordReset(data.email);
		} catch (error) {
			throw this.handleAuthError(error);
		}
	}

	/**
	 * Confirm password reset with token
	 */
	async confirmPasswordReset(data: PasswordConfirmData): Promise<void> {
		try {
			await pb
				.collection('users')
				.confirmPasswordReset(data.token, data.password, data.passwordConfirm);
		} catch (error) {
			throw this.handleAuthError(error);
		}
	}

	/**
	 * Refresh authentication token
	 */
	async refreshAuth(): Promise<RecordAuthResponse<AuthModel> | null> {
		try {
			if (pb.authStore.isValid) {
				return await pb.collection('users').authRefresh();
			}
			return null;
		} catch (error) {
			// If refresh fails, clear auth
			this.logout();
			return null;
		}
	}

	/**
	 * Handle authentication errors with user-friendly messages
	 */
	private handleAuthError(error: any): Error {
		if (error?.response?.data) {
			const data = error.response.data;

			// Handle field-specific errors
			if (data.data) {
				const fieldErrors = Object.entries(data.data)
					.map(([field, errors]) => {
						return `${field}: ${(errors as any).message || errors}`;
					})
					.join('; ');

				return new Error(fieldErrors);
			}

			// Handle general errors
			return new Error(data.message || 'Authentication failed');
		}

		return new Error(error.message || 'An unexpected error occurred');
	}
}

// Export singleton instance
export const authService = new AuthService();
```

### API-AUTH-002: OAuth Integration

```typescript
// OAuth provider authentication
export class OAuthService {
	/**
	 * Authenticate with Google OAuth
	 */
	async loginWithGoogle(): Promise<RecordAuthResponse<AuthModel>> {
		try {
			const authData = await pb.collection('users').authWithOAuth2({
				provider: 'google'
			});

			return authData;
		} catch (error) {
			throw new Error('Google authentication failed');
		}
	}

	/**
	 * Authenticate with Facebook OAuth
	 */
	async loginWithFacebook(): Promise<RecordAuthResponse<AuthModel>> {
		try {
			const authData = await pb.collection('users').authWithOAuth2({
				provider: 'facebook'
			});

			return authData;
		} catch (error) {
			throw new Error('Facebook authentication failed');
		}
	}
}

export const oauthService = new OAuthService();
```

---

## Data Access Services

### API-DATA-001: Base Service Pattern

```typescript
// src/lib/services/base.service.ts
import { pb } from '$lib/pocketbase';
import type { RecordService, ListResult, RecordFullListOptions } from 'pocketbase';

export abstract class BaseService<T extends Record<string, any>> {
	protected collection: RecordService;

	constructor(collectionName: string) {
		this.collection = pb.collection(collectionName);
	}

	/**
	 * Create a new record
	 */
	async create(data: Partial<T>): Promise<T> {
		try {
			return await this.collection.create(data);
		} catch (error) {
			throw this.handleError(error, 'create');
		}
	}

	/**
	 * Get record by ID
	 */
	async getById(id: string, expand?: string): Promise<T> {
		try {
			return await this.collection.getOne(id, { expand });
		} catch (error) {
			throw this.handleError(error, 'get');
		}
	}

	/**
	 * Update record
	 */
	async update(id: string, data: Partial<T>): Promise<T> {
		try {
			return await this.collection.update(id, data);
		} catch (error) {
			throw this.handleError(error, 'update');
		}
	}

	/**
	 * Delete record
	 */
	async delete(id: string): Promise<boolean> {
		try {
			return await this.collection.delete(id);
		} catch (error) {
			throw this.handleError(error, 'delete');
		}
	}

	/**
	 * List records with pagination
	 */
	async list(
		page: number = 1,
		perPage: number = 20,
		options?: RecordFullListOptions
	): Promise<ListResult<T>> {
		try {
			return await this.collection.getList(page, perPage, options);
		} catch (error) {
			throw this.handleError(error, 'list');
		}
	}

	/**
	 * Get full list (no pagination)
	 */
	async getFullList(options?: RecordFullListOptions): Promise<T[]> {
		try {
			return await this.collection.getFullList(options);
		} catch (error) {
			throw this.handleError(error, 'fullList');
		}
	}

	/**
	 * Subscribe to real-time changes
	 */
	subscribe(callback: (e: { action: string; record: T }) => void, filter?: string): () => void {
		return this.collection.subscribe('*', callback, filter);
	}

	/**
	 * Handle service errors with context
	 */
	protected handleError(error: any, operation: string): Error {
		console.error(`PocketBase ${operation} error:`, error);

		if (error?.response?.data?.message) {
			return new Error(error.response.data.message);
		}

		return new Error(`Failed to ${operation} record`);
	}
}
```

### API-DATA-002: Template Service

```typescript
// src/lib/services/template.service.ts
import { BaseService } from './base.service';
import type { TemplateRecord, TemplateField } from '$lib/types/template';

export class TemplateService extends BaseService<TemplateRecord> {
	constructor() {
		super('templates');
	}

	/**
	 * Get templates by user
	 */
	async getByUser(userId: string): Promise<TemplateRecord[]> {
		return await this.getFullList({
			filter: `creator = "${userId}"`,
			sort: '-updated'
		});
	}

	/**
	 * Get public templates
	 */
	async getPublicTemplates(filters?: {
		nativeLanguage?: string;
		learningLanguage?: string;
		category?: string;
		level?: string;
	}): Promise<TemplateRecord[]> {
		let filterString = 'isPublic = true';

		if (filters) {
			const conditions = Object.entries(filters)
				.filter(([_, value]) => value)
				.map(([key, value]) => `${key} = "${value}"`);

			if (conditions.length > 0) {
				filterString += ' && ' + conditions.join(' && ');
			}
		}

		return await this.getFullList({
			filter: filterString,
			sort: '-usageCount,-rating'
		});
	}

	/**
	 * Clone template
	 */
	async clone(templateId: string, userId: string): Promise<TemplateRecord> {
		const original = await this.getById(templateId);

		const cloneData = {
			...original,
			id: undefined,
			name: `${original.name} (Copy)`,
			creator: userId,
			isPublic: false,
			clonedFrom: templateId,
			usageCount: 0,
			rating: 0
		};

		return await this.create(cloneData);
	}

	/**
	 * Update template fields
	 */
	async updateFields(templateId: string, fields: TemplateField[]): Promise<TemplateRecord> {
		return await this.update(templateId, { fields });
	}

	/**
	 * Increment usage count
	 */
	async incrementUsage(templateId: string): Promise<void> {
		try {
			await this.collection.update(templateId, {
				'usageCount+': 1
			});
		} catch (error) {
			// Non-critical operation, log but don't throw
			console.warn('Failed to increment template usage:', error);
		}
	}

	/**
	 * Search templates
	 */
	async search(query: string, filters?: Record<string, any>): Promise<TemplateRecord[]> {
		let filterString = `name ~ "${query}" || description ~ "${query}"`;

		if (filters) {
			const conditions = Object.entries(filters)
				.filter(([_, value]) => value)
				.map(([key, value]) => `${key} = "${value}"`);

			if (conditions.length > 0) {
				filterString = `(${filterString}) && ${conditions.join(' && ')}`;
			}
		}

		return await this.getFullList({
			filter: filterString,
			sort: '-usageCount'
		});
	}
}

export const templateService = new TemplateService();
```

### API-DATA-003: Flashcard Service

```typescript
// src/lib/services/flashcard.service.ts
import { BaseService } from './base.service';
import type { FlashcardRecord, StudySession } from '$lib/types/flashcard';

export class FlashcardService extends BaseService<FlashcardRecord> {
	constructor() {
		super('flashcards');
	}

	/**
	 * Get flashcards by deck
	 */
	async getByDeck(deckId: string): Promise<FlashcardRecord[]> {
		return await this.getFullList({
			filter: `deck = "${deckId}"`,
			sort: 'order'
		});
	}

	/**
	 * Get due flashcards for review
	 */
	async getDueFlashcards(userId: string, limit: number = 20): Promise<FlashcardRecord[]> {
		const now = new Date().toISOString();

		return await this.list(1, limit, {
			filter: `deck.creator = "${userId}" && (nextReview <= "${now}" || nextReview = "")`,
			sort: 'nextReview',
			expand: 'deck'
		}).then((result) => result.items);
	}

	/**
	 * Update flashcard after study session
	 */
	async updateAfterStudy(
		flashcardId: string,
		rating: number,
		studyData: StudySession
	): Promise<FlashcardRecord> {
		const updateData = {
			difficulty: studyData.newDifficulty,
			interval: studyData.newInterval,
			repetitions: studyData.newRepetitions,
			easeFactor: studyData.newEaseFactor,
			nextReview: studyData.nextReview,
			lastReviewed: new Date().toISOString(),
			totalReviews: '+1',
			correctAnswers: rating >= 3 ? '+1' : undefined
		};

		return await this.update(flashcardId, updateData);
	}

	/**
	 * Create flashcard from template
	 */
	async createFromTemplate(
		templateId: string,
		deckId: string,
		content: Record<string, any>
	): Promise<FlashcardRecord> {
		const flashcardData = {
			template: templateId,
			deck: deckId,
			content,
			difficulty: 0,
			interval: 1,
			repetitions: 0,
			easeFactor: 2.5,
			nextReview: new Date().toISOString(),
			order: await this.getNextOrder(deckId)
		};

		return await this.create(flashcardData);
	}

	/**
	 * Get next order number for deck
	 */
	private async getNextOrder(deckId: string): Promise<number> {
		const lastCard = await this.list(1, 1, {
			filter: `deck = "${deckId}"`,
			sort: '-order'
		});

		return lastCard.items.length > 0 ? lastCard.items[0].order + 1 : 0;
	}

	/**
	 * Bulk update flashcard order
	 */
	async reorderFlashcards(deckId: string, cardIds: string[]): Promise<void> {
		const updates = cardIds.map((id, index) => this.update(id, { order: index }));

		await Promise.all(updates);
	}
}

export const flashcardService = new FlashcardService();
```

---

## Real-time Features

### API-REALTIME-001: Live Updates

```typescript
// src/lib/services/realtime.service.ts
import { pb } from '$lib/pocketbase';
import { writable, type Writable } from 'svelte/store';

export interface RealtimeSubscription {
	id: string;
	collection: string;
	unsubscribe: () => void;
}

export class RealtimeService {
	private subscriptions = new Map<string, RealtimeSubscription>();

	/**
	 * Subscribe to collection changes
	 */
	subscribeToCollection<T>(
		collection: string,
		callback: (action: string, record: T) => void,
		filter?: string
	): string {
		const subscriptionId = `${collection}_${Date.now()}`;

		const unsubscribe = pb.collection(collection).subscribe(
			'*',
			(e) => {
				callback(e.action, e.record as T);
			},
			filter
		);

		this.subscriptions.set(subscriptionId, {
			id: subscriptionId,
			collection,
			unsubscribe
		});

		return subscriptionId;
	}

	/**
	 * Unsubscribe from specific subscription
	 */
	unsubscribe(subscriptionId: string): void {
		const subscription = this.subscriptions.get(subscriptionId);
		if (subscription) {
			subscription.unsubscribe();
			this.subscriptions.delete(subscriptionId);
		}
	}

	/**
	 * Unsubscribe from all subscriptions
	 */
	unsubscribeAll(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
		this.subscriptions.clear();
	}

	/**
	 * Create reactive store for collection
	 */
	createReactiveStore<T>(
		collection: string,
		initialData: T[] = [],
		filter?: string
	): {
		store: Writable<T[]>;
		subscriptionId: string;
	} {
		const store = writable<T[]>(initialData);

		const subscriptionId = this.subscribeToCollection<T>(
			collection,
			(action, record) => {
				store.update((items) => {
					switch (action) {
						case 'create':
							return [...items, record];
						case 'update':
							return items.map((item) => ((item as any).id === (record as any).id ? record : item));
						case 'delete':
							return items.filter((item) => (item as any).id !== (record as any).id);
						default:
							return items;
					}
				});
			},
			filter
		);

		return { store, subscriptionId };
	}
}

export const realtimeService = new RealtimeService();
```

---

## Error Handling

### API-ERROR-001: Comprehensive Error Management

```typescript
// src/lib/services/error.service.ts
export interface PocketBaseError {
	status: number;
	message: string;
	data?: Record<string, any>;
	isNetworkError: boolean;
	isValidationError: boolean;
	isAuthError: boolean;
}

export class ErrorService {
	/**
	 * Parse PocketBase error into standardized format
	 */
	static parsePocketBaseError(error: any): PocketBaseError {
		const isNetworkError = !error.response;
		const status = error.response?.status || 0;
		const data = error.response?.data;

		return {
			status,
			message: this.extractErrorMessage(error),
			data,
			isNetworkError,
			isValidationError: status === 400 && data?.data,
			isAuthError: status === 401 || status === 403
		};
	}

	/**
	 * Extract user-friendly error message
	 */
	private static extractErrorMessage(error: any): string {
		if (error.response?.data?.message) {
			return error.response.data.message;
		}

		if (error.response?.data?.data) {
			// Handle validation errors
			const fieldErrors = Object.entries(error.response.data.data)
				.map(([field, errors]: [string, any]) => {
					const message = errors.message || errors;
					return `${field}: ${message}`;
				})
				.join('; ');

			return fieldErrors;
		}

		if (!error.response) {
			return 'Network error - please check your connection';
		}

		return error.message || 'An unexpected error occurred';
	}

	/**
	 * Handle common error scenarios
	 */
	static handleError(error: any, context?: string): never {
		const pbError = this.parsePocketBaseError(error);

		console.error(`PocketBase error${context ? ` in ${context}` : ''}:`, pbError);

		if (pbError.isAuthError) {
			// Handle authentication errors
			throw new Error('Authentication required - please log in');
		}

		if (pbError.isNetworkError) {
			throw new Error('Unable to connect to server - please try again');
		}

		throw new Error(pbError.message);
	}
}
```

---

## Performance Optimization

### API-PERF-001: Caching and Optimization

```typescript
// src/lib/services/cache.service.ts
export class CacheService {
	private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

	/**
	 * Get cached data
	 */
	get<T>(key: string): T | null {
		const cached = this.cache.get(key);

		if (!cached) return null;

		if (Date.now() - cached.timestamp > cached.ttl) {
			this.cache.delete(key);
			return null;
		}

		return cached.data;
	}

	/**
	 * Set cached data
	 */
	set<T>(key: string, data: T, ttl: number = 300000): void {
		// 5 minutes default
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl
		});
	}

	/**
	 * Clear cache
	 */
	clear(pattern?: string): void {
		if (pattern) {
			const regex = new RegExp(pattern);
			for (const key of this.cache.keys()) {
				if (regex.test(key)) {
					this.cache.delete(key);
				}
			}
		} else {
			this.cache.clear();
		}
	}
}

export const cacheService = new CacheService();

// Enhanced service with caching
export class CachedTemplateService extends TemplateService {
	async getPublicTemplates(filters?: any): Promise<TemplateRecord[]> {
		const cacheKey = `public_templates_${JSON.stringify(filters)}`;

		let templates = cacheService.get<TemplateRecord[]>(cacheKey);

		if (!templates) {
			templates = await super.getPublicTemplates(filters);
			cacheService.set(cacheKey, templates, 600000); // 10 minutes
		}

		return templates;
	}
}
```

---

## Setup and Configuration

### API-SETUP-001: Development Environment

```bash
# PocketBase setup script
#!/bin/bash
# install_pocketbase.sh

POCKETBASE_VERSION="0.28.2"
PLATFORM="linux_amd64"
DOWNLOAD_URL="https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_${PLATFORM}.zip"

echo "Installing PocketBase v${POCKETBASE_VERSION}..."

# Download PocketBase
curl -L "$DOWNLOAD_URL" -o pocketbase.zip

# Extract
unzip pocketbase.zip

# Make executable
chmod +x pocketbase

# Clean up
rm pocketbase.zip

echo "PocketBase installed successfully!"
echo "Run './run_pocketbase.sh' to start the server"
```

```bash
# PocketBase run script
#!/bin/bash
# run_pocketbase.sh

echo "Starting PocketBase server..."
./pocketbase serve --http=0.0.0.0:8090
```

### API-SETUP-002: Environment Variables

```env
# .env.local
VITE_POCKETBASE_URL=http://localhost:8090
VITE_PB_TIMEOUT=10000
VITE_PB_RETRY_ATTEMPTS=3
VITE_PB_RETRY_DELAY=1000
```

---

## Validation Checklist

### Functional Validation

- [ ] Authentication flow works with all providers
- [ ] CRUD operations handle all data types correctly
- [ ] Real-time subscriptions update UI immediately
- [ ] Error handling provides meaningful feedback
- [ ] Caching improves performance without stale data

### Security Validation

- [ ] Authentication tokens are handled securely
- [ ] User permissions are enforced on all operations
- [ ] Input validation prevents injection attacks
- [ ] Sensitive data is not exposed in errors
- [ ] CORS configuration allows only trusted origins

### Performance Validation

- [ ] Database queries are optimized with proper filters
- [ ] Pagination works for large datasets
- [ ] Caching reduces redundant API calls
- [ ] Real-time connections don't cause memory leaks
- [ ] Service layer provides efficient data access patterns
