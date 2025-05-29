import { writable, derived, type Readable } from 'svelte/store';
import { pb } from '../pocketbase';
import type { AuthModel } from 'pocketbase';
import {
	loginRateLimiter,
	signupRateLimiter,
	getRateLimitIdentifier,
	SecureStorage,
	logSecurityEvent
} from '../utils/security';

interface AuthState {
	user: AuthModel | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	lastActivity: number;
}

// Session timeout (30 minutes of inactivity)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Create auth store
function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: pb.authStore.model,
		isLoading: false,
		isAuthenticated: pb.authStore.isValid,
		lastActivity: Date.now()
	});

	// Update activity timestamp
	const updateActivity = () => {
		update((state) => ({
			...state,
			lastActivity: Date.now()
		}));
	};

	// Check for session timeout
	const checkSessionTimeout = () => {
		const currentState = {
			user: pb.authStore.model,
			isLoading: false,
			isAuthenticated: pb.authStore.isValid,
			lastActivity: Date.now()
		};

		if (currentState.isAuthenticated && Date.now() - currentState.lastActivity > SESSION_TIMEOUT) {
			logout();
		}
	};

	// Login function
	const login = async (email: string, password: string) => {
		const rateLimitId = getRateLimitIdentifier();

		// Check rate limiting
		if (!loginRateLimiter.isAllowed(rateLimitId)) {
			const remainingTime = Math.ceil(loginRateLimiter.getRemainingTime(rateLimitId) / 1000);
			logSecurityEvent('login_rate_limited', { rateLimitId, remainingTime });
			throw new Error(
				`Too many login attempts. Please wait ${remainingTime} seconds before trying again.`
			);
		}

		update((state) => ({ ...state, isLoading: true }));

		try {
			const authData = await pb.collection('users').authWithPassword(email, password);

			// Check if user is verified
			if (!authData.record.verified) {
				// Log out the user immediately
				pb.authStore.clear();

				update((state) => ({
					...state,
					isLoading: false,
					isAuthenticated: false,
					user: null
				}));

				logSecurityEvent('login_failed_unverified', { userId: authData.record.id, email });
				throw new Error(
					'Please verify your email address before logging in. Check your inbox for a verification link.'
				);
			}

			// Store session securely
			SecureStorage.setItem('lastLoginTime', Date.now().toString());

			update((state) => ({
				...state,
				user: authData.record,
				isAuthenticated: true,
				isLoading: false,
				lastActivity: Date.now()
			}));

			logSecurityEvent('login_success', { userId: authData.record.id, email });

			return authData;
		} catch (error) {
			update((state) => ({
				...state,
				isLoading: false,
				isAuthenticated: false,
				user: null
			}));

			logSecurityEvent('login_failed', { email, error: String(error) });
			throw error;
		}
	};

	// Signup function
	const signup = async (
		email: string,
		password: string,
		passwordConfirm: string,
		name?: string,
		username?: string,
		nativeLanguage?: string,
		aboutMe?: string,
		role?: string
	) => {
		const rateLimitId = getRateLimitIdentifier();

		// Check rate limiting
		if (!signupRateLimiter.isAllowed(rateLimitId)) {
			const remainingTime = Math.ceil(signupRateLimiter.getRemainingTime(rateLimitId) / 1000);
			logSecurityEvent('signup_rate_limited', { rateLimitId, remainingTime });
			throw new Error(
				`Too many signup attempts. Please wait ${remainingTime} seconds before trying again.`
			);
		}

		update((state) => ({ ...state, isLoading: true }));

		try {
			const userData = {
				email,
				password,
				passwordConfirm,
				...(name && { name }),
				...(username && { username }), // Added username
				...(nativeLanguage && { nativeLanguage }), // Added nativeLanguage
				...(aboutMe && { aboutMe }), // Added aboutMe
				...(role && { role }) // Added role
			};

			// Create user account
			const record = await pb.collection('users').create(userData);

			logSecurityEvent('signup_success', { userId: record.id, email });

			// Don't automatically log in - user needs to verify email first
			update((state) => ({ ...state, isLoading: false }));

			return {
				record,
				message:
					'Account created successfully! Please check your email to verify your account before logging in.'
			};
		} catch (error) {
			update((state) => ({
				...state,
				isLoading: false
			}));

			logSecurityEvent('signup_failed', { email, error: String(error) });
			throw error;
		}
	};

	// Logout function
	const logout = () => {
		pb.authStore.clear();
		set({
			user: null,
			isLoading: false,
			isAuthenticated: false,
			lastActivity: Date.now()
		});
	};

	// OAuth provider login function
	const loginWithProvider = async (provider: string, _redirectTo?: string) => {
		update((state) => ({ ...state, isLoading: true }));

		try {
			// For now, just show a message that OAuth is not implemented
			// In the future, this would integrate with PocketBase OAuth
			alert(
				`OAuth login with ${provider} is not implemented yet. Please use email and password for now.`
			);

			update((state) => ({ ...state, isLoading: false }));
		} catch (error) {
			update((state) => ({ ...state, isLoading: false }));
			console.error(`OAuth login with ${provider} failed:`, error);
			throw error;
		}
	};

	// Listen to PocketBase auth changes
	pb.authStore.onChange((token, model) => {
		update((state) => ({
			...state,
			user: model as AuthModel | null,
			isAuthenticated: pb.authStore.isValid,
			lastActivity: Date.now()
		}));
	});

	// Set up session timeout check
	if (typeof window !== 'undefined') {
		setInterval(checkSessionTimeout, 60000); // Check every minute

		// Update activity on user interactions
		['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach((event) => {
			document.addEventListener(event, updateActivity, { passive: true });
		});
	}

	return {
		subscribe,
		login,
		signup, // Ensure signup is exported with new signature
		logout,
		loginWithProvider,
		updateActivity
	};
}

export const authStore = createAuthStore();

// Derived stores for convenient access
export const user: Readable<AuthModel | null> = derived(authStore, ($authStore) => $authStore.user);

export const isAuthenticated: Readable<boolean> = derived(
	authStore,
	($authStore) => $authStore.isAuthenticated
);

export const isLoading: Readable<boolean> = derived(
	authStore,
	($authStore) => $authStore.isLoading
);
