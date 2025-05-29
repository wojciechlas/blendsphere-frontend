---
title: 'User Management & Authentication Behavior Specification'
description: 'Comprehensive behavior specification for user management system including authentication, profile management, and role-based access control using PocketBase'
type: 'behavior_specification'
component: 'UserManagement'
dependencies:
  frontend:
    - 'shadcn-svelte form components'
    - 'Svelte 5 runes and reactivity'
    - 'Zod validation library'
    - 'TypeScript interfaces'
  backend:
    - 'PocketBase authentication system'
    - 'OAuth2 providers (Google, Facebook)'
    - 'Email verification service'
    - 'File upload handling'
  external:
    - 'Google OAuth API'
    - 'Facebook OAuth API'
    - 'Email service provider'
ai_context:
  complexity: 'high'
  user_interaction: 'extensive'
  integration_points:
    - 'PocketBase users collection'
    - 'OAuth provider APIs'
    - 'Email verification system'
    - 'File upload service'
    - 'Route protection system'
  state_management: 'complex'
  validation_requirements: 'strict'
context_tags:
  - 'user-management'
  - 'authentication'
  - 'authorization'
  - 'pocketbase'
  - 'oauth'
  - 'security'
  - 'profile-management'
  - 'role-based-access'
validation_criteria:
  - 'All authentication methods working correctly'
  - 'Role-based access control enforced'
  - 'Input validation and sanitization'
  - 'Secure token management'
  - 'Accessibility compliance'
  - 'Performance optimization'
last_updated: '2025-05-29'
---

# User Management & Authentication Behavior Specification

## Overview

This document specifies the behavior and implementation details for the BlendSphere user management system, including authentication, profile management, and role-based access control using PocketBase as the backend authentication provider.

## Component Architecture

### Core TypeScript Interfaces

```typescript
// src/lib/types/user.ts
export interface User {
	id: string;
	username: string;
	email: string;
	emailVisibility?: boolean;
	verified: boolean;
	name?: string;
	avatar?: string;
	role: UserRole;
	nativeLanguage: Language;
	aboutMe?: string;
	created: string;
	updated: string;
}

export enum UserRole {
	ADMIN = 'ADMIN',
	TEACHER = 'TEACHER',
	STUDENT = 'STUDENT',
	INDIVIDUAL_LEARNER = 'INDIVIDUAL_LEARNER'
}

export enum Language {
	EN = 'EN',
	ES = 'ES',
	FR = 'FR',
	DE = 'DE',
	IT = 'IT',
	PL = 'PL'
}

export interface AuthResult {
	success: boolean;
	user?: User;
	error?: string;
}

export interface SignUpData {
	username: string;
	email: string;
	password: string;
	passwordConfirm: string;
	name?: string;
	role: UserRole;
	nativeLanguage: Language;
}

export interface AuthCredentials {
	email?: string;
	password?: string;
	provider?: 'google' | 'facebook';
	rememberMe?: boolean;
}

export enum AuthMethod {
	EMAIL_PASSWORD = 'email_password',
	GOOGLE_OAUTH = 'google_oauth',
	FACEBOOK_OAUTH = 'facebook_oauth',
	EMAIL_OTP = 'email_otp'
}
```

### Authentication Service Architecture

```typescript
// src/lib/services/auth.service.ts
export interface AuthServiceBehavior {
	// Core authentication methods
	signInWithEmail(email: string, password: string, rememberMe?: boolean): Promise<AuthResult>;
	signInWithOAuth(provider: 'google' | 'facebook'): Promise<AuthResult>;
	signInWithOTP(email: string, otp: string): Promise<AuthResult>;
	signUp(userData: SignUpData): Promise<AuthResult>;
	signOut(): Promise<void>;

	// Account management
	requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }>;
	resetPassword(token: string, newPassword: string): Promise<AuthResult>;
	verifyEmail(token: string): Promise<{ success: boolean; error?: string }>;
	resendVerification(email: string): Promise<{ success: boolean; error?: string }>;

	// Session management
	refreshAuth(): Promise<AuthResult>;
	checkAuthStatus(): Promise<boolean>;

	// Security features
	enableTwoFactor(): Promise<{ success: boolean; qrCode?: string; error?: string }>;
	disableTwoFactor(code: string): Promise<{ success: boolean; error?: string }>;
}

export class AuthService implements AuthServiceBehavior {
	private pb: PocketBase;
	private authStore: AuthStore;

	constructor(pocketbase: PocketBase, authStore: AuthStore) {
		this.pb = pocketbase;
		this.authStore = authStore;
	}

	async signInWithEmail(email: string, password: string, rememberMe = false): Promise<AuthResult> {
		try {
			const authData = await this.pb.collection('users').authWithPassword(email, password);

			if (rememberMe) {
				localStorage.setItem('auth_remember', 'true');
			}

			this.authStore.setUser(authData.record as User);
			this.authStore.setToken(authData.token);

			return { success: true, user: authData.record as User };
		} catch (error) {
			return { success: false, error: this.handleAuthError(error) };
		}
	}

	async signInWithOAuth(provider: 'google' | 'facebook'): Promise<AuthResult> {
		try {
			const authData = await this.pb.collection('users').authWithOAuth2({ provider });

			this.authStore.setUser(authData.record as User);
			this.authStore.setToken(authData.token);

			return { success: true, user: authData.record as User };
		} catch (error) {
			return { success: false, error: this.handleAuthError(error) };
		}
	}

	async signUp(userData: SignUpData): Promise<AuthResult> {
		try {
			// Create user account
			const user = await this.pb.collection('users').create({
				...userData,
				emailVisibility: true
			});

			// Send verification email
			await this.pb.collection('users').requestVerification(userData.email);

			return { success: true, user: user as User };
		} catch (error) {
			return { success: false, error: this.handleAuthError(error) };
		}
	}

	async signOut(): Promise<void> {
		this.pb.authStore.clear();
		this.authStore.clear();
		localStorage.removeItem('auth_remember');
	}

	private handleAuthError(error: any): string {
		if (error?.status === 400) {
			return 'Invalid credentials. Please check your email and password.';
		}
		if (error?.status === 403) {
			return 'Account is disabled or not verified. Please check your email.';
		}
		if (error?.status === 429) {
			return 'Too many login attempts. Please try again later.';
		}
		return 'Authentication failed. Please try again.';
	}
}
```

### User Profile Management

```typescript
// src/lib/services/user.service.ts
export interface UserServiceBehavior {
	// Profile management
	updateProfile(userId: string, data: Partial<User>): Promise<User>;
	uploadAvatar(userId: string, file: File): Promise<string>;
	deleteAvatar(userId: string): Promise<void>;

	// User queries
	getUserById(id: string): Promise<User | null>;
	getUserByUsername(username: string): Promise<User | null>;
	searchUsers(query: string, filters?: UserSearchFilters): Promise<User[]>;

	// Preferences
	updatePreferences(userId: string, preferences: UserPreferences): Promise<void>;
	getPreferences(userId: string): Promise<UserPreferences>;
}

export interface UserSearchFilters {
	role?: UserRole;
	language?: Language;
	verified?: boolean;
	limit?: number;
	offset?: number;
}

export interface UserPreferences {
	theme: 'light' | 'dark' | 'system';
	language: Language;
	notifications: {
		email: boolean;
		push: boolean;
		reminders: boolean;
	};
	privacy: {
		profileVisibility: 'public' | 'friends' | 'private';
		showEmail: boolean;
		showProgress: boolean;
	};
}
```

## State Management

### Authentication Store Behavior

```typescript
// src/lib/stores/auth.store.ts
export function createAuthStore() {
	let user = $state<User | null>(null);
	let token = $state<string | null>(null);
	let isLoading = $state(true);
	let isInitialized = $state(false);

	let isAuthenticated = $derived(!!user && !!token);
	let userRole = $derived(user?.role || null);
	let isVerified = $derived(user?.verified || false);

	async function initialize() {
		isLoading = true;
		try {
			// Check for existing auth state
			if (pb.authStore.isValid && pb.authStore.model) {
				user = pb.authStore.model as User;
				token = pb.authStore.token;
			}

			// Auto-refresh if token exists
			if (token) {
				await refreshAuth();
			}
		} catch (error) {
			console.error('Auth initialization failed:', error);
			clear();
		} finally {
			isLoading = false;
			isInitialized = true;
		}
	}

	async function refreshAuth(): Promise<void> {
		try {
			if (pb.authStore.isValid) {
				await pb.collection('users').authRefresh();
				user = pb.authStore.model as User;
				token = pb.authStore.token;
			}
		} catch (error) {
			console.error('Auth refresh failed:', error);
			clear();
		}
	}

	function setUser(newUser: User): void {
		user = newUser;
	}

	function setToken(newToken: string): void {
		token = newToken;
	}

	function clear(): void {
		user = null;
		token = null;
		pb.authStore.clear();
	}

	// Auto-refresh token periodically
	let refreshInterval: NodeJS.Timeout;
	$effect(() => {
		if (isAuthenticated && !refreshInterval) {
			refreshInterval = setInterval(
				() => {
					refreshAuth();
				},
				15 * 60 * 1000
			); // Refresh every 15 minutes
		} else if (!isAuthenticated && refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}

		return () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		};
	});

	return {
		// Getters
		get user() {
			return user;
		},
		get token() {
			return token;
		},
		get isLoading() {
			return isLoading;
		},
		get isInitialized() {
			return isInitialized;
		},
		get isAuthenticated() {
			return isAuthenticated;
		},
		get userRole() {
			return userRole;
		},
		get isVerified() {
			return isVerified;
		},

		// Actions
		initialize,
		refreshAuth,
		setUser,
		setToken,
		clear
	};
}

export const authStore = createAuthStore();
```

## Component Behaviors

### Login Form Component

```svelte
<!-- src/lib/components/auth/LoginForm.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { authService } from '$lib/services/auth.service.js';
	import { loginSchema } from '$lib/schemas/auth.schema.js';
	import { goto } from '$app/navigation';
	import type { AuthMethod } from '$lib/types/user.js';

	interface Props {
		redirectTo?: string;
		showOAuthOptions?: boolean;
		onSuccess?: (user: User) => void;
	}

	let { redirectTo = '/dashboard', showOAuthOptions = true, onSuccess }: Props = $props();

	let formData = $state({
		email: '',
		password: '',
		rememberMe: false
	});

	let errors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);
	let selectedMethod = $state<AuthMethod>(AuthMethod.EMAIL_PASSWORD);

	async function handleEmailLogin() {
		isSubmitting = true;
		errors = {};

		try {
			// Validate form data
			const validation = loginSchema.safeParse(formData);
			if (!validation.success) {
				validation.error.issues.forEach((issue) => {
					errors[issue.path[0]] = issue.message;
				});
				return;
			}

			const result = await authService.signInWithEmail(
				formData.email,
				formData.password,
				formData.rememberMe
			);

			if (result.success && result.user) {
				onSuccess?.(result.user);
				await goto(redirectTo);
			} else {
				errors.general = result.error || 'Login failed';
			}
		} catch (error) {
			errors.general = 'An unexpected error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleOAuthLogin(provider: 'google' | 'facebook') {
		isSubmitting = true;
		errors = {};

		try {
			const result = await authService.signInWithOAuth(provider);

			if (result.success && result.user) {
				onSuccess?.(result.user);
				await goto(redirectTo);
			} else {
				errors.general = result.error || `${provider} login failed`;
			}
		} catch (error) {
			errors.general = 'OAuth login failed';
		} finally {
			isSubmitting = false;
		}
	}

	// Real-time validation
	async function validateField(field: string, value: string) {
		try {
			loginSchema.pick({ [field]: true }).parse({ [field]: value });
			delete errors[field];
			errors = { ...errors };
		} catch (error) {
			if (error instanceof z.ZodError) {
				errors[field] = error.issues[0].message;
				errors = { ...errors };
			}
		}
	}

	// Keyboard navigation support
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !isSubmitting) {
			handleEmailLogin();
		}
	}
</script>

<div class="login-form" role="main" aria-label="Login form">
	<form on:submit|preventDefault={handleEmailLogin} onkeydown={handleKeydown}>
		<div class="form-group">
			<Label for="email">Email</Label>
			<Input
				id="email"
				type="email"
				bind:value={formData.email}
				oninput={(e) => validateField('email', e.currentTarget.value)}
				placeholder="Enter your email"
				disabled={isSubmitting}
				required
				aria-describedby={errors.email ? 'email-error' : undefined}
				aria-invalid={!!errors.email}
			/>
			{#if errors.email}
				<span id="email-error" class="error-message" role="alert">
					{errors.email}
				</span>
			{/if}
		</div>

		<div class="form-group">
			<Label for="password">Password</Label>
			<Input
				id="password"
				type="password"
				bind:value={formData.password}
				oninput={(e) => validateField('password', e.currentTarget.value)}
				placeholder="Enter your password"
				disabled={isSubmitting}
				required
				aria-describedby={errors.password ? 'password-error' : undefined}
				aria-invalid={!!errors.password}
			/>
			{#if errors.password}
				<span id="password-error" class="error-message" role="alert">
					{errors.password}
				</span>
			{/if}
		</div>

		<div class="form-group">
			<div class="checkbox-group">
				<Checkbox id="rememberMe" bind:checked={formData.rememberMe} disabled={isSubmitting} />
				<Label for="rememberMe">Remember me</Label>
			</div>
		</div>

		{#if errors.general}
			<div class="error-message general-error" role="alert">
				{errors.general}
			</div>
		{/if}

		<Button
			type="submit"
			disabled={isSubmitting}
			class="login-button"
			aria-label={isSubmitting ? 'Signing in...' : 'Sign in'}
		>
			{isSubmitting ? 'Signing in...' : 'Sign in'}
		</Button>
	</form>

	{#if showOAuthOptions}
		<div class="oauth-section">
			<div class="divider">
				<span>or continue with</span>
			</div>

			<div class="oauth-buttons">
				<Button
					variant="outline"
					onclick={() => handleOAuthLogin('google')}
					disabled={isSubmitting}
					class="oauth-button"
					aria-label="Sign in with Google"
				>
					<GoogleIcon />
					Google
				</Button>

				<Button
					variant="outline"
					onclick={() => handleOAuthLogin('facebook')}
					disabled={isSubmitting}
					class="oauth-button"
					aria-label="Sign in with Facebook"
				>
					<FacebookIcon />
					Facebook
				</Button>
			</div>
		</div>
	{/if}

	<div class="footer-links">
		<a href="/auth/forgot-password" class="link"> Forgot your password? </a>
		<p>
			Don't have an account?
			<a href="/auth/signup" class="link">Sign up</a>
		</p>
	</div>
</div>

<style>
	.login-form {
		max-width: 400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.checkbox-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.error-message {
		color: hsl(var(--destructive));
		font-size: 0.875rem;
		margin-top: 0.25rem;
		display: block;
	}

	.general-error {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: hsl(var(--destructive) / 0.1);
		border: 1px solid hsl(var(--destructive) / 0.2);
		border-radius: 0.375rem;
	}

	.login-button {
		width: 100%;
		margin-bottom: 1rem;
	}

	.oauth-section {
		margin: 2rem 0;
	}

	.divider {
		text-align: center;
		margin: 1rem 0;
		position: relative;
	}

	.divider::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: hsl(var(--border));
	}

	.divider span {
		background: hsl(var(--background));
		padding: 0 1rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
	}

	.oauth-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.oauth-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.footer-links {
		text-align: center;
		margin-top: 2rem;
	}

	.footer-links p {
		margin: 0.5rem 0;
		color: hsl(var(--muted-foreground));
	}

	.link {
		color: hsl(var(--primary));
		text-decoration: none;
	}

	.link:hover {
		text-decoration: underline;
	}
</style>
```

### User Profile Component

```svelte
<!-- src/lib/components/profile/UserProfile.svelte -->
<script lang="ts">
	import type { User } from '$lib/types/user.js';
	import { userService } from '$lib/services/user.service.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select/index.js';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar/index.js';
	import { userProfileSchema } from '$lib/schemas/user.schema.js';
	import { Language } from '$lib/types/user.js';
	import AvatarUpload from './AvatarUpload.svelte';

	interface Props {
		user: User;
		editable?: boolean;
		onUpdate?: (updatedUser: User) => void;
	}

	let { user, editable = false, onUpdate }: Props = $props();

	let isEditing = $state(false);
	let formData = $state<Partial<User>>({ ...user });
	let errors = $state<Record<string, string>>({});
	let saving = $state(false);
	let showAvatarUpload = $state(false);

	async function handleSave() {
		saving = true;
		errors = {};

		try {
			// Validate form data
			const validation = userProfileSchema.safeParse(formData);
			if (!validation.success) {
				validation.error.issues.forEach((issue) => {
					errors[issue.path[0]] = issue.message;
				});
				return;
			}

			const updatedUser = await userService.updateProfile(user.id, formData);
			user = updatedUser;
			formData = { ...updatedUser };
			isEditing = false;
			onUpdate?.(updatedUser);
		} catch (error) {
			errors.general = 'Failed to update profile. Please try again.';
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		formData = { ...user };
		errors = {};
		isEditing = false;
	}

	async function handleAvatarChange(newAvatarUrl: string) {
		try {
			const updatedUser = await userService.updateProfile(user.id, { avatar: newAvatarUrl });
			user = updatedUser;
			formData.avatar = newAvatarUrl;
			showAvatarUpload = false;
			onUpdate?.(updatedUser);
		} catch (error) {
			errors.avatar = 'Failed to update avatar';
		}
	}

	async function validateField(field: string, value: unknown) {
		try {
			userProfileSchema.pick({ [field]: true }).parse({ [field]: value });
			delete errors[field];
			errors = { ...errors };
		} catch (error) {
			if (error instanceof z.ZodError) {
				errors[field] = error.issues[0].message;
				errors = { ...errors };
			}
		}
	}

	function getInitials(name?: string, username?: string): string {
		const displayName = name || username || '';
		return displayName
			.split(' ')
			.map((word) => word.charAt(0))
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<div class="profile-container" role="main" aria-label="User profile">
	<div class="profile-header">
		<div class="avatar-section">
			<Avatar class="profile-avatar">
				<AvatarImage src={user.avatar} alt="{user.name || user.username}'s avatar" />
				<AvatarFallback>{getInitials(user.name, user.username)}</AvatarFallback>
			</Avatar>

			{#if editable}
				<Button
					variant="outline"
					size="sm"
					onclick={() => (showAvatarUpload = true)}
					class="avatar-edit-button"
					aria-label="Change avatar"
				>
					Change Avatar
				</Button>
			{/if}
		</div>

		<div class="profile-info">
			<h1 class="profile-name">{user.name || user.username}</h1>
			<p class="profile-username">@{user.username}</p>
			<div class="profile-meta">
				<span class="role-badge" data-role={user.role.toLowerCase()}>
					{user.role.replace('_', ' ')}
				</span>
				{#if user.verified}
					<span class="verified-badge" aria-label="Verified account">✓ Verified</span>
				{/if}
			</div>
		</div>
	</div>

	{#if isEditing}
		<form on:submit|preventDefault={handleSave} class="profile-form">
			<div class="form-grid">
				<div class="form-group">
					<Label for="name">Full Name</Label>
					<Input
						id="name"
						bind:value={formData.name}
						oninput={(e) => validateField('name', e.currentTarget.value)}
						placeholder="Enter your full name"
						disabled={saving}
						aria-describedby={errors.name ? 'name-error' : undefined}
						aria-invalid={!!errors.name}
					/>
					{#if errors.name}
						<span id="name-error" class="error-message" role="alert">
							{errors.name}
						</span>
					{/if}
				</div>

				<div class="form-group">
					<Label for="nativeLanguage">Native Language</Label>
					<Select bind:selected={formData.nativeLanguage} disabled={saving}>
						<SelectTrigger id="nativeLanguage">
							<SelectValue placeholder="Select your native language" />
						</SelectTrigger>
						<SelectContent>
							{#each Object.values(Language) as language}
								<SelectItem value={language}>
									{language === Language.EN
										? 'English'
										: language === Language.ES
											? 'Spanish'
											: language === Language.FR
												? 'French'
												: language === Language.DE
													? 'German'
													: language === Language.IT
														? 'Italian'
														: language === Language.PL
															? 'Polish'
															: language}
								</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div class="form-group">
				<Label for="aboutMe">About Me</Label>
				<Textarea
					id="aboutMe"
					bind:value={formData.aboutMe}
					oninput={(e) => validateField('aboutMe', e.currentTarget.value)}
					placeholder="Tell us about yourself..."
					maxlength={500}
					disabled={saving}
					rows={4}
					aria-describedby={errors.aboutMe ? 'aboutMe-error' : 'aboutMe-help'}
					aria-invalid={!!errors.aboutMe}
				/>
				<small id="aboutMe-help" class="form-help">
					{formData.aboutMe?.length || 0}/500 characters
				</small>
				{#if errors.aboutMe}
					<span id="aboutMe-error" class="error-message" role="alert">
						{errors.aboutMe}
					</span>
				{/if}
			</div>

			{#if errors.general}
				<div class="error-message general-error" role="alert">
					{errors.general}
				</div>
			{/if}

			<div class="form-actions">
				<Button
					type="submit"
					disabled={saving}
					aria-label={saving ? 'Saving changes...' : 'Save changes'}
				>
					{saving ? 'Saving...' : 'Save Changes'}
				</Button>
				<Button type="button" variant="outline" onclick={handleCancel} disabled={saving}>
					Cancel
				</Button>
			</div>
		</form>
	{:else}
		<div class="profile-view">
			<div class="profile-section">
				<h2>About</h2>
				<p class="about-text">
					{user.aboutMe || 'No bio provided yet.'}
				</p>
			</div>

			<div class="profile-section">
				<h2>Details</h2>
				<dl class="profile-details">
					<dt>Email</dt>
					<dd>{user.email}</dd>

					<dt>Native Language</dt>
					<dd>
						{user.nativeLanguage === Language.EN
							? 'English'
							: user.nativeLanguage === Language.ES
								? 'Spanish'
								: user.nativeLanguage === Language.FR
									? 'French'
									: user.nativeLanguage === Language.DE
										? 'German'
										: user.nativeLanguage === Language.IT
											? 'Italian'
											: user.nativeLanguage === Language.PL
												? 'Polish'
												: user.nativeLanguage}
					</dd>

					<dt>Member Since</dt>
					<dd>{new Date(user.created).toLocaleDateString()}</dd>
				</dl>
			</div>

			{#if editable}
				<div class="profile-actions">
					<Button onclick={() => (isEditing = true)}>Edit Profile</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if showAvatarUpload}
	<AvatarUpload
		currentAvatar={user.avatar}
		onUpload={handleAvatarChange}
		onCancel={() => (showAvatarUpload = false)}
	/>
{/if}

<style>
	.profile-container {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem;
	}

	.profile-header {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 2rem;
		align-items: flex-start;
	}

	.avatar-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.profile-avatar {
		width: 100px;
		height: 100px;
	}

	.avatar-edit-button {
		font-size: 0.75rem;
	}

	.profile-info {
		flex: 1;
	}

	.profile-name {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
	}

	.profile-username {
		color: hsl(var(--muted-foreground));
		margin: 0 0 0.5rem 0;
	}

	.profile-meta {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.role-badge {
		background: hsl(var(--secondary));
		color: hsl(var(--secondary-foreground));
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		text-transform: capitalize;
	}

	.role-badge[data-role='admin'] {
		background: hsl(var(--destructive));
		color: hsl(var(--destructive-foreground));
	}

	.role-badge[data-role='teacher'] {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.verified-badge {
		color: hsl(142 76% 36%);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.profile-form {
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-help {
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
		margin-top: 0.25rem;
		display: block;
	}

	.error-message {
		color: hsl(var(--destructive));
		font-size: 0.875rem;
		margin-top: 0.25rem;
		display: block;
	}

	.general-error {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: hsl(var(--destructive) / 0.1);
		border: 1px solid hsl(var(--destructive) / 0.2);
		border-radius: 0.375rem;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	.profile-view {
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.profile-section {
		margin-bottom: 2rem;
	}

	.profile-section h2 {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 0.75rem 0;
		color: hsl(var(--foreground));
	}

	.about-text {
		color: hsl(var(--muted-foreground));
		line-height: 1.6;
		margin: 0;
	}

	.profile-details {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem 1rem;
		margin: 0;
	}

	.profile-details dt {
		font-weight: 500;
		color: hsl(var(--muted-foreground));
	}

	.profile-details dd {
		margin: 0;
		color: hsl(var(--foreground));
	}

	.profile-actions {
		margin-top: 1.5rem;
		display: flex;
		justify-content: flex-end;
	}

	@media (max-width: 640px) {
		.profile-header {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.form-actions {
			justify-content: stretch;
		}

		.form-actions > * {
			flex: 1;
		}
	}
</style>
```

## Validation and Security

### Input Validation Schemas

```typescript
// src/lib/schemas/auth.schema.ts
import { z } from 'zod';
import { UserRole, Language } from '$lib/types/user.js';

export const loginSchema = z.object({
	email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
	password: z.string().min(1, 'Password is required'),
	rememberMe: z.boolean().optional()
});

export const signupSchema = z
	.object({
		username: z
			.string()
			.min(3, 'Username must be at least 3 characters')
			.max(30, 'Username must be less than 30 characters')
			.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
		email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				'Password must contain uppercase, lowercase, and number'
			),
		passwordConfirm: z.string(),
		name: z.string().max(100, 'Name must be less than 100 characters').optional(),
		role: z.nativeEnum(UserRole),
		nativeLanguage: z.nativeEnum(Language)
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: 'Passwords do not match',
		path: ['passwordConfirm']
	});

export const userProfileSchema = z.object({
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters')
		.max(30, 'Username must be less than 30 characters')
		.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
	email: z.string().email('Please enter a valid email address'),
	name: z.string().max(100, 'Name must be less than 100 characters').optional(),
	aboutMe: z.string().max(500, 'About me must be less than 500 characters').optional(),
	nativeLanguage: z.nativeEnum(Language),
	role: z.nativeEnum(UserRole)
});

export const passwordResetSchema = z.object({
	email: z.string().min(1, 'Email is required').email('Please enter a valid email address')
});

export const passwordChangeSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				'Password must contain uppercase, lowercase, and number'
			),
		confirmPassword: z.string()
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});
```

## Role-Based Access Control

### Permission Service Implementation

```typescript
// src/lib/services/permission.service.ts
export interface PermissionServiceBehavior {
	// Route permissions
	canAccessRoute(user: User | null, route: string): boolean;
	canAccessAdminPanel(user: User | null): boolean;

	// Resource permissions
	canManageClasses(user: User | null): boolean;
	canCreateDecks(user: User | null): boolean;
	canEditDeck(user: User | null, deck: Deck): boolean;
	canDeleteDeck(user: User | null, deck: Deck): boolean;

	// User permissions
	canEditProfile(user: User | null, profileUserId: string): boolean;
	canViewProfile(user: User | null, profile: User): boolean;
	canManageUsers(user: User | null): boolean;

	// Class permissions
	canJoinClass(user: User | null, classItem: ClassItem): boolean;
	canLeaveClass(user: User | null, classItem: ClassItem): boolean;

	// Utility methods
	getRolePermissions(role: UserRole): RolePermissions;
	isPublicRoute(route: string): boolean;
}

export interface RolePermissions {
	routes: string[];
	actions: string[];
	resources: string[];
}

export class PermissionService implements PermissionServiceBehavior {
	private rolePermissions: Record<UserRole, RolePermissions> = {
		[UserRole.ADMIN]: {
			routes: ['*'], // All routes
			actions: ['*'], // All actions
			resources: ['*'] // All resources
		},
		[UserRole.TEACHER]: {
			routes: ['/dashboard', '/classes', '/decks', '/profile', '/settings'],
			actions: ['create_class', 'manage_class', 'create_deck', 'edit_deck', 'delete_deck'],
			resources: ['own_classes', 'own_decks', 'student_progress']
		},
		[UserRole.STUDENT]: {
			routes: ['/dashboard', '/classes', '/decks', '/profile', '/learn'],
			actions: ['join_class', 'leave_class', 'create_deck', 'edit_own_deck'],
			resources: ['joined_classes', 'own_decks', 'shared_decks']
		},
		[UserRole.INDIVIDUAL_LEARNER]: {
			routes: ['/dashboard', '/decks', '/profile', '/learn'],
			actions: ['create_deck', 'edit_own_deck', 'delete_own_deck'],
			resources: ['own_decks']
		}
	};

	private publicRoutes = [
		'/',
		'/auth/login',
		'/auth/signup',
		'/auth/forgot-password',
		'/auth/reset-password',
		'/about',
		'/privacy',
		'/terms'
	];

	canAccessRoute(user: User | null, route: string): boolean {
		if (this.isPublicRoute(route)) return true;
		if (!user) return false;

		const permissions = this.getRolePermissions(user.role);
		return (
			permissions.routes.includes('*') ||
			permissions.routes.some((allowedRoute) => route.startsWith(allowedRoute))
		);
	}

	canAccessAdminPanel(user: User | null): boolean {
		return user?.role === UserRole.ADMIN;
	}

	canManageClasses(user: User | null): boolean {
		if (!user) return false;
		return user.role === UserRole.ADMIN || user.role === UserRole.TEACHER;
	}

	canCreateDecks(user: User | null): boolean {
		return !!user; // All authenticated users can create decks
	}

	canEditDeck(user: User | null, deck: Deck): boolean {
		if (!user) return false;
		if (user.role === UserRole.ADMIN) return true;
		return deck.createdBy === user.id;
	}

	canDeleteDeck(user: User | null, deck: Deck): boolean {
		if (!user) return false;
		if (user.role === UserRole.ADMIN) return true;
		return deck.createdBy === user.id;
	}

	canEditProfile(user: User | null, profileUserId: string): boolean {
		if (!user) return false;
		if (user.role === UserRole.ADMIN) return true;
		return user.id === profileUserId;
	}

	canViewProfile(user: User | null, profile: User): boolean {
		if (!user) return false;
		if (user.role === UserRole.ADMIN) return true;

		// Check profile privacy settings
		const preferences = profile.preferences?.privacy;
		if (!preferences) return true; // Default to public

		switch (preferences.profileVisibility) {
			case 'public':
				return true;
			case 'private':
				return user.id === profile.id;
			case 'friends':
				// TODO: Implement friend system
				return user.id === profile.id;
			default:
				return true;
		}
	}

	canManageUsers(user: User | null): boolean {
		return user?.role === UserRole.ADMIN;
	}

	canJoinClass(user: User | null, classItem: ClassItem): boolean {
		if (!user) return false;
		if (user.role === UserRole.ADMIN) return true;
		if (user.role === UserRole.TEACHER && classItem.createdBy === user.id) return false;

		return user.role === UserRole.STUDENT || user.role === UserRole.INDIVIDUAL_LEARNER;
	}

	canLeaveClass(user: User | null, classItem: ClassItem): boolean {
		if (!user) return false;
		return classItem.students?.includes(user.id) || false;
	}

	getRolePermissions(role: UserRole): RolePermissions {
		return this.rolePermissions[role];
	}

	isPublicRoute(route: string): boolean {
		return (
			this.publicRoutes.includes(route) ||
			this.publicRoutes.some((publicRoute) => route.startsWith(publicRoute))
		);
	}
}

export const permissionService = new PermissionService();
```

## Testing Specifications

### Authentication Service Tests

```typescript
// src/lib/services/__tests__/auth.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../auth.service.js';
import type { PocketBase } from 'pocketbase';

describe('AuthService', () => {
	let authService: AuthService;
	let mockPocketBase: Partial<PocketBase>;
	let mockAuthStore: any;

	beforeEach(() => {
		mockAuthStore = {
			setUser: vi.fn(),
			setToken: vi.fn(),
			clear: vi.fn()
		};

		mockPocketBase = {
			collection: vi.fn().mockReturnValue({
				authWithPassword: vi.fn(),
				authWithOAuth2: vi.fn(),
				create: vi.fn(),
				requestVerification: vi.fn(),
				authRefresh: vi.fn()
			}),
			authStore: {
				clear: vi.fn(),
				isValid: false,
				model: null,
				token: null
			}
		};

		authService = new AuthService(mockPocketBase as PocketBase, mockAuthStore);
	});

	describe('signInWithEmail', () => {
		it('should sign in successfully with valid credentials', async () => {
			const mockUser = { id: '1', email: 'test@example.com', username: 'test' };
			const mockAuthData = { record: mockUser, token: 'mock-token' };

			mockPocketBase.collection().authWithPassword.mockResolvedValue(mockAuthData);

			const result = await authService.signInWithEmail('test@example.com', 'password');

			expect(result.success).toBe(true);
			expect(result.user).toEqual(mockUser);
			expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUser);
			expect(mockAuthStore.setToken).toHaveBeenCalledWith('mock-token');
		});

		it('should handle authentication errors', async () => {
			mockPocketBase.collection().authWithPassword.mockRejectedValue({
				status: 400,
				message: 'Invalid credentials'
			});

			const result = await authService.signInWithEmail('test@example.com', 'wrong-password');

			expect(result.success).toBe(false);
			expect(result.error).toBe('Invalid credentials. Please check your email and password.');
		});

		it('should set remember me flag', async () => {
			const mockUser = { id: '1', email: 'test@example.com', username: 'test' };
			const mockAuthData = { record: mockUser, token: 'mock-token' };

			mockPocketBase.collection().authWithPassword.mockResolvedValue(mockAuthData);
			const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {});

			await authService.signInWithEmail('test@example.com', 'password', true);

			expect(setItemSpy).toHaveBeenCalledWith('auth_remember', 'true');
		});
	});

	describe('signInWithOAuth', () => {
		it('should sign in with Google OAuth', async () => {
			const mockUser = { id: '1', email: 'test@gmail.com', username: 'test' };
			const mockAuthData = { record: mockUser, token: 'mock-token' };

			mockPocketBase.collection().authWithOAuth2.mockResolvedValue(mockAuthData);

			const result = await authService.signInWithOAuth('google');

			expect(result.success).toBe(true);
			expect(result.user).toEqual(mockUser);
			expect(mockPocketBase.collection().authWithOAuth2).toHaveBeenCalledWith({
				provider: 'google'
			});
		});
	});

	describe('signUp', () => {
		it('should create user and send verification email', async () => {
			const signUpData = {
				username: 'newuser',
				email: 'new@example.com',
				password: 'Password123',
				passwordConfirm: 'Password123',
				role: 'STUDENT',
				nativeLanguage: 'EN'
			};

			const mockUser = { id: '1', ...signUpData };
			mockPocketBase.collection().create.mockResolvedValue(mockUser);
			mockPocketBase.collection().requestVerification.mockResolvedValue({});

			const result = await authService.signUp(signUpData);

			expect(result.success).toBe(true);
			expect(result.user).toEqual(mockUser);
			expect(mockPocketBase.collection().requestVerification).toHaveBeenCalledWith(
				signUpData.email
			);
		});
	});

	describe('signOut', () => {
		it('should clear auth state and localStorage', async () => {
			const removeItemSpy = vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {});

			await authService.signOut();

			expect(mockPocketBase.authStore.clear).toHaveBeenCalled();
			expect(mockAuthStore.clear).toHaveBeenCalled();
			expect(removeItemSpy).toHaveBeenCalledWith('auth_remember');
		});
	});
});
```

## Performance Optimization

### Authentication State Optimization

```typescript
// src/lib/stores/auth.store.optimized.ts
export function createOptimizedAuthStore() {
	let user = $state<User | null>(null);
	let token = $state<string | null>(null);
	let isLoading = $state(true);
	let isInitialized = $state(false);
	let lastRefresh = $state<number>(0);

	// Cached computed values
	let isAuthenticated = $derived(!!user && !!token);
	let userRole = $derived(user?.role || null);
	let permissions = $derived(() => {
		if (!user) return null;
		return permissionService.getRolePermissions(user.role);
	});

	// Throttled refresh to prevent excessive API calls
	let refreshPromise: Promise<void> | null = null;

	async function throttledRefresh(): Promise<void> {
		const now = Date.now();
		const timeSinceLastRefresh = now - lastRefresh;

		// Don't refresh more than once per minute
		if (timeSinceLastRefresh < 60000 && refreshPromise) {
			return refreshPromise;
		}

		if (!refreshPromise) {
			refreshPromise = performRefresh();
		}

		try {
			await refreshPromise;
		} finally {
			refreshPromise = null;
		}
	}

	async function performRefresh(): Promise<void> {
		try {
			if (pb.authStore.isValid) {
				await pb.collection('users').authRefresh();
				user = pb.authStore.model as User;
				token = pb.authStore.token;
				lastRefresh = Date.now();
			}
		} catch (error) {
			console.error('Auth refresh failed:', error);
			clear();
		}
	}

	// Memory cleanup for auth listeners
	const cleanupFunctions: (() => void)[] = [];

	function addCleanup(cleanup: () => void): void {
		cleanupFunctions.push(cleanup);
	}

	function cleanup(): void {
		cleanupFunctions.forEach((fn) => fn());
		cleanupFunctions.length = 0;
	}

	return {
		// State getters
		get user() {
			return user;
		},
		get token() {
			return token;
		},
		get isLoading() {
			return isLoading;
		},
		get isInitialized() {
			return isInitialized;
		},
		get isAuthenticated() {
			return isAuthenticated;
		},
		get userRole() {
			return userRole;
		},
		get permissions() {
			return permissions;
		},

		// Actions
		async initialize() {
			// ... initialization logic
		},

		throttledRefresh,
		cleanup,
		addCleanup
	};
}
```

## Security Implementation

### Security Headers and CSP

```typescript
// src/hooks.server.ts - Security implementation
import type { Handle } from '@sveltejs/kit';
import { permissionService } from '$lib/services/permission.service.js';

export const handle: Handle = async ({ event, resolve }) => {
	// Security headers
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			return html.replace(
				'%security.csp%',
				"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.pocketbase.io;"
			);
		}
	});

	// Set security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	// Authentication and authorization
	const user = await getUserFromRequest(event);

	if (requiresAuth(event.url.pathname) && !user) {
		return new Response(null, {
			status: 302,
			headers: { Location: '/auth/login' }
		});
	}

	if (!permissionService.canAccessRoute(user, event.url.pathname)) {
		return new Response(null, {
			status: 302,
			headers: { Location: '/unauthorized' }
		});
	}

	event.locals.user = user;
	return response;
};

async function getUserFromRequest(event: RequestEvent): Promise<User | null> {
	try {
		const authHeader = event.request.headers.get('Authorization');
		if (!authHeader) return null;

		const token = authHeader.replace('Bearer ', '');
		if (!token) return null;

		// Validate token with PocketBase
		pb.authStore.save(token);
		if (pb.authStore.isValid) {
			return pb.authStore.model as User;
		}
	} catch (error) {
		console.error('Auth validation failed:', error);
	}

	return null;
}

function requiresAuth(pathname: string): boolean {
	const publicPaths = ['/', '/auth/', '/about', '/privacy', '/terms'];
	return !publicPaths.some((path) => pathname.startsWith(path));
}
```

## Accessibility Implementation

### ARIA and Keyboard Navigation

```typescript
// src/lib/utils/accessibility.ts
export class AccessibilityManager {
	static announceToScreenReader(
		message: string,
		priority: 'polite' | 'assertive' = 'polite'
	): void {
		const announcement = document.createElement('div');
		announcement.setAttribute('aria-live', priority);
		announcement.setAttribute('aria-atomic', 'true');
		announcement.className = 'sr-only';
		announcement.textContent = message;

		document.body.appendChild(announcement);

		setTimeout(() => {
			document.body.removeChild(announcement);
		}, 1000);
	}

	static focusElement(elementId: string): void {
		const element = document.getElementById(elementId);
		if (element) {
			element.focus();
		}
	}

	static trapFocus(container: HTMLElement): () => void {
		const focusableElements = container.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);

		const firstElement = focusableElements[0] as HTMLElement;
		const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

		function handleKeydown(e: KeyboardEvent) {
			if (e.key === 'Tab') {
				if (e.shiftKey) {
					if (document.activeElement === firstElement) {
						e.preventDefault();
						lastElement.focus();
					}
				} else {
					if (document.activeElement === lastElement) {
						e.preventDefault();
						firstElement.focus();
					}
				}
			}
		}

		container.addEventListener('keydown', handleKeydown);
		firstElement?.focus();

		return () => {
			container.removeEventListener('keydown', handleKeydown);
		};
	}
}
```

## Related Documentation

- **Requirements**: [Template System Requirements](../requirements/template-system.requirements.md)
- **API Integration**: [PocketBase Integration Guide](../api/pocketbase-integration.md)
- **Component Architecture**: [Frontend Architecture](../architecture/frontend-architecture.md)
- **User Stories**: [User Journey Workflows](../user-stories/user-journeys.md)
- **Security**: [Security Implementation Report](../../SECURITY_IMPLEMENTATION_REPORT.md)
