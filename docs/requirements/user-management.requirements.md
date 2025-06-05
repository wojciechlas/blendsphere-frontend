# User Management & Authentication Requirements

---

component: UserManagement
type: requirements
version: 1.2.0
dependencies:

- pocketbase-auth
- oauth-providers
- user-profile-components
  context_tags:
- user-management
- authentication
- authorization
- pocketbase
- oauth
- security
  last_updated: 2025-05-29
  ai_context: |
  User management system for BlendSphere using PocketBase built-in authentication.
  Handles user registration, authentication, profile management, and role-based access.
  Supports email/password, OAuth (Google, Facebook), and OTP authentication methods.

---

## 1. Overview

### 1.1 Purpose

Provide comprehensive user management and authentication system for BlendSphere language learning platform using PocketBase backend integration.

### 1.2 Scope

- User registration and authentication
- Profile management and customization
- Role-based access control
- Multi-method authentication support
- User preference and context management for AI personalization

### 1.3 Dependencies

- **Frontend**: User profile components, authentication forms, role guards
- **Backend**: PocketBase users collection, OAuth2 providers, email verification
- **External**: Google OAuth, Facebook OAuth, email service provider

## 2. Functional Requirements

### 2.1 User Entity Management

#### REQ-USER-001: User Profile Structure

**Priority**: P0 (Critical)
**Component**: UserProfileService, UserStore
**Dependencies**: PocketBase users collection

**Description**:
Users must have comprehensive profiles supporting personalization and AI context.

**AI Context**:

- Data structure: PocketBase users collection schema
- Frontend components: ProfileForm, AvatarUpload, LanguageSelector
- State management: Svelte stores for user data
- Validation: Zod schemas for user input

**Acceptance Criteria**:

1. Support optional name field with username fallback
2. Unique username and email validation
3. Optional avatar upload with default fallback
4. Role-based permission system
5. Native language selection for AI personalization
6. About me field for AI context (max 500 chars)
7. Email verification status tracking

**Implementation Hints**:

```typescript
// User type definition (src/lib/types/user.ts)
interface User {
	id: string;
	username: string;
	email: string;
	name?: string;
	avatar?: string;
	role: UserRole;
	nativeLanguage: Language;
	aboutMe?: string;
	verified: boolean;
	created: string;
	updated: string;
}

enum UserRole {
	ADMIN = 'ADMIN',
	TEACHER = 'TEACHER',
	STUDENT = 'STUDENT',
	INDIVIDUAL_LEARNER = 'INDIVIDUAL_LEARNER'
}

// Profile component pattern
let profileData = $state<Partial<User>>({});
let isEditing = $state(false);
```

**Related Files**:

- `src/lib/types/user.ts`
- `src/lib/services/user.service.ts`
- `src/lib/components/profile/UserProfile.svelte`
- `src/lib/stores/auth.store.ts`

#### REQ-USER-002: Profile Validation and Constraints

**Priority**: P1 (High)
**Component**: ValidationService, UserProfileForm
**Dependencies**: Zod validation library

**Description**:
All user input must be validated with appropriate constraints and error handling.

**AI Context**:

- Validation library: Zod for TypeScript-first validation
- UI components: shadcn-svelte form components
- Error handling: Field-level and form-level validation
- UX patterns: Real-time validation feedback

**Acceptance Criteria**:

1. Username: 3-30 characters, alphanumeric and underscore only
2. Email: Valid email format with uniqueness check
3. Name: Optional, max 100 characters
4. About me: Optional, max 500 characters
5. Avatar: Image files only (JPG, PNG, WebP), max 5MB
6. Real-time validation feedback

**Implementation Hints**:

```typescript
// Validation schema (src/lib/schemas/user.schema.ts)
import { z } from 'zod';

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

// Form validation pattern
let errors = $state<Record<string, string>>({});

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
```

### 2.2 Authentication System

#### REQ-AUTH-001: Multi-Method Authentication

**Priority**: P0 (Critical)
**Component**: AuthService, LoginForm, SignupForm
**Dependencies**: PocketBase authentication, OAuth providers

**Description**:
Support multiple authentication methods with secure implementation using PocketBase.

**AI Context**:

- Backend: PocketBase built-in authentication
- OAuth: Google and Facebook providers
- Components: Login/signup forms with method selection
- State: Authentication state management
- Security: HTTPS, secure token handling

**Acceptance Criteria**:

1. Email/password authentication with validation
2. Google OAuth integration
3. Facebook OAuth integration
4. Email OTP for passwordless login
5. Secure token management
6. Remember me functionality
7. Account lockout protection

**Implementation Hints**:

```typescript
// Auth service (src/lib/services/auth.service.ts)
export class AuthService {
	async signInWithEmail(email: string, password: string): Promise<AuthResult> {
		try {
			const authData = await pb.collection('users').authWithPassword(email, password);
			this.updateAuthStore(authData);
			return { success: true, user: authData.record };
		} catch (error) {
			return { success: false, error: this.handleAuthError(error) };
		}
	}

	async signInWithOAuth(provider: 'google' | 'facebook'): Promise<AuthResult> {
		try {
			const authData = await pb.collection('users').authWithOAuth2({ provider });
			this.updateAuthStore(authData);
			return { success: true, user: authData.record };
		} catch (error) {
			return { success: false, error: this.handleAuthError(error) };
		}
	}

	async signUp(userData: SignUpData): Promise<AuthResult> {
		try {
			const user = await pb.collection('users').create(userData);
			await pb.collection('users').requestVerification(userData.email);
			return { success: true, user };
		} catch (error) {
			return { success: false, error: this.handleAuthError(error) };
		}
	}
}

// Auth store pattern (src/lib/stores/auth.store.ts)
function createAuthStore() {
	let user = $state<User | null>(null);
	let isLoading = $state(true);
	let isAuthenticated = $derived(!!user);

	return {
		get user() {
			return user;
		},
		get isLoading() {
			return isLoading;
		},
		get isAuthenticated() {
			return isAuthenticated;
		},

		async initialize() {
			// Initialize auth state from PocketBase
		},

		async signIn(method: AuthMethod, credentials: AuthCredentials) {
			// Handle sign in
		},

		async signOut() {
			// Handle sign out
		}
	};
}
```

#### REQ-AUTH-002: Role-Based Access Control

**Priority**: P0 (Critical)
**Component**: AuthGuard, RoleGuard, PermissionService
**Dependencies**: User roles, route protection

**Description**:
Implement role-based access control throughout the application with proper route and component protection.

**AI Context**:

- Roles: ADMIN, TEACHER, STUDENT, INDIVIDUAL_LEARNER
- Components: Route guards, permission checks
- Patterns: Higher-order components, reactive permissions
- Security: Client and server-side validation

**Acceptance Criteria**:

1. Role assignment during registration
2. Route-level permission checking
3. Component-level permission rendering
4. Admin panel access control
5. Teacher-specific features (class management)
6. Student enrollment permissions
7. Individual learner private workspace

**Implementation Hints**:

```typescript
// Permission service (src/lib/services/permission.service.ts)
export class PermissionService {
  canAccessRoute(user: User | null, route: string): boolean {
    if (!user) return this.isPublicRoute(route);

    const permissions = this.getRolePermissions(user.role);
    return permissions.routes.includes(route) || permissions.routes.includes('*');
  }

  canManageClasses(user: User | null): boolean {
    return user?.role === UserRole.ADMIN || user?.role === UserRole.TEACHER;
  }

  canCreateDecks(user: User | null): boolean {
    return !!user; // All authenticated users can create decks
  }
}

// Route guard (src/hooks.server.ts)
export const handle: Handle = async ({ event, resolve }) => {
  const user = await getUserFromRequest(event);

  if (requiresAuth(event.url.pathname) && !user) {
    throw redirect(302, '/login');
  }

  if (!permissionService.canAccessRoute(user, event.url.pathname)) {
    throw redirect(302, '/unauthorized');
  }

  event.locals.user = user;
  return resolve(event);
};

// Component permission pattern
<script lang="ts">
  import { authStore } from '$lib/stores/auth.store.js';
  import { permissionService } from '$lib/services/permission.service.js';

  let canManageClasses = $derived(
    permissionService.canManageClasses($authStore.user)
  );
</script>

{#if canManageClasses}
  <ClassManagementPanel />
{/if}
```

## 3. Technical Specifications

### 3.1 Data Structures

```typescript
// Core user interfaces (src/lib/types/user.ts)
interface User {
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

interface AuthResult {
	success: boolean;
	user?: User;
	error?: string;
}

interface SignUpData {
	username: string;
	email: string;
	password: string;
	passwordConfirm: string;
	name?: string;
	role: UserRole;
	nativeLanguage: Language;
}

enum UserRole {
	ADMIN = 'ADMIN',
	TEACHER = 'TEACHER',
	STUDENT = 'STUDENT',
	INDIVIDUAL_LEARNER = 'INDIVIDUAL_LEARNER'
}

enum Language {
	EN = 'EN',
	ES = 'ES',
	FR = 'FR',
	DE = 'DE',
	IT = 'IT',
	PL = 'PL'
}
```

### 3.2 PocketBase Collection Schema

```javascript
// PocketBase users collection schema
{
  "name": "users",
  "type": "auth",
  "system": false,
  "schema": [
    {
      "name": "name",
      "type": "text",
      "required": false,
      "options": {
        "max": 100
      }
    },
    {
      "name": "avatar",
      "type": "file",
      "required": false,
      "options": {
        "maxSelect": 1,
        "maxSize": 5242880,
        "mimeTypes": ["image/jpeg", "image/png", "image/webp"]
      }
    },
    {
      "name": "role",
      "type": "select",
      "required": true,
      "options": {
        "maxSelect": 1,
        "values": ["ADMIN", "TEACHER", "STUDENT", "INDIVIDUAL_LEARNER"]
      }
    },
    {
      "name": "nativeLanguage",
      "type": "select",
      "required": true,
      "options": {
        "maxSelect": 1,
        "values": ["EN", "ES", "FR", "DE", "IT", "PL"]
      }
    },
    {
      "name": "aboutMe",
      "type": "text",
      "required": false,
      "options": {
        "max": 500
      }
    }
  ],
  "indexes": [
    "CREATE UNIQUE INDEX idx_users_username ON users (username)",
    "CREATE UNIQUE INDEX idx_users_email ON users (email)"
  ]
}
```

### 3.3 Component Architecture

```svelte
<!-- User profile component (src/lib/components/profile/UserProfile.svelte) -->
<script lang="ts">
	import type { User } from '$lib/types/user.js';
	import { userService } from '$lib/services/user.service.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';

	interface Props {
		user: User;
		editable?: boolean;
	}

	let { user, editable = false }: Props = $props();
	let isEditing = $state(false);
	let formData = $state({ ...user });
	let saving = $state(false);

	async function handleSave() {
		saving = true;
		try {
			await userService.updateProfile(user.id, formData);
			user = { ...formData };
			isEditing = false;
		} catch (error) {
			// Handle error
		} finally {
			saving = false;
		}
	}
</script>

<div class="profile-container">
	{#if isEditing}
		<form on:submit|preventDefault={handleSave}>
			<Input bind:value={formData.name} placeholder="Full name" disabled={saving} />
			<Textarea
				bind:value={formData.aboutMe}
				placeholder="Tell us about yourself..."
				maxlength={500}
				disabled={saving}
			/>
			<div class="actions">
				<Button type="submit" disabled={saving}>
					{saving ? 'Saving...' : 'Save'}
				</Button>
				<Button variant="outline" onclick={() => (isEditing = false)}>Cancel</Button>
			</div>
		</form>
	{:else}
		<!-- View mode -->
		<div class="profile-view">
			<h2>{user.name || user.username}</h2>
			<p>{user.aboutMe || 'No bio provided'}</p>
			{#if editable}
				<Button onclick={() => (isEditing = true)}>Edit Profile</Button>
			{/if}
		</div>
	{/if}
</div>
```

## 4. Implementation Guidelines

### 4.1 File Structure

```
src/lib/
├── types/
│   ├── user.ts
│   └── auth.ts
├── services/
│   ├── auth.service.ts
│   ├── user.service.ts
│   └── permission.service.ts
├── stores/
│   ├── auth.store.ts
│   └── user.store.ts
├── components/
│   ├── auth/
│   │   ├── LoginForm.svelte
│   │   ├── SignupForm.svelte
│   │   └── OAuthButtons.svelte
│   └── profile/
│       ├── UserProfile.svelte
│       ├── AvatarUpload.svelte
│       └── ProfileForm.svelte
└── schemas/
    └── user.schema.ts
```

### 4.2 Testing Requirements

- Unit tests for authentication service methods
- Integration tests for user registration flow
- Component tests for forms and profile components
- E2E tests for complete authentication workflows
- Security testing for authentication vulnerabilities

### 4.3 Accessibility Requirements

- ARIA labels for all form inputs
- Keyboard navigation support
- Screen reader announcements for auth state changes
- Focus management during form submission
- Error message accessibility

## 5. Validation Criteria

### 5.1 Functional Validation

- [ ] User registration with all authentication methods
- [ ] Profile editing and validation
- [ ] Role-based access control working
- [ ] Email verification process
- [ ] Password reset functionality
- [ ] OAuth integration working
- [ ] Session management and persistence

### 5.2 Technical Validation

- [ ] Type safety with TypeScript interfaces
- [ ] Proper error handling and user feedback
- [ ] Secure token storage and management
- [ ] Performance optimization for auth checks
- [ ] Memory leak prevention in stores
- [ ] Proper cleanup of auth listeners

### 5.3 Security Validation

- [ ] Input sanitization and validation
- [ ] HTTPS enforcement
- [ ] Secure password handling
- [ ] OAuth security best practices
- [ ] Rate limiting for auth attempts
- [ ] Proper session invalidation

## Related Documentation

### Requirements

- [Template System Requirements](./template-system.requirements.md)
- [Flashcard Creator Requirements](./flashcard-creator.requirements.md)

### API Documentation

- [PocketBase Integration](../api/pocketbase-integration.md)
- [User Service API](../api/services/user.service.md)

### Component Documentation

- [Authentication Components](../components/feature/auth-components.md)
- [Profile Components](../components/feature/profile-components.md)

### User Stories

- [Teacher Onboarding Journey](../user-stories/teacher-workflows.md#onboarding)
- [Student Registration Journey](../user-stories/student-workflows.md#registration)
