import { writable, derived, type Readable } from 'svelte/store';
import { pb, currentUser } from '../pocketbase';
import type { AuthModel } from 'pocketbase';
import {
    loginRateLimiter,
    signupRateLimiter,
    getRateLimitIdentifier,
    SecureStorage,
    logSecurityEvent,
    sanitizeRedirectUrl
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
        update(state => ({
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

        if (currentState.isAuthenticated &&
            Date.now() - currentState.lastActivity > SESSION_TIMEOUT) {
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
            throw new Error(`Too many login attempts. Please wait ${remainingTime} seconds before trying again.`);
        }

        update(state => ({ ...state, isLoading: true }));

        try {
            const authData = await pb.collection('users').authWithPassword(email, password);

            // Store session securely
            SecureStorage.setItem('lastLoginTime', Date.now().toString());

            update(state => ({
                ...state,
                user: authData.record,
                isAuthenticated: true,
                isLoading: false,
                lastActivity: Date.now()
            }));

            logSecurityEvent('login_success', { userId: authData.record.id, email });

            return authData;
        } catch (error) {
            update(state => ({
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
    const signup = async (email: string, password: string, passwordConfirm: string, name?: string) => {
        const rateLimitId = getRateLimitIdentifier();

        // Check rate limiting
        if (!signupRateLimiter.isAllowed(rateLimitId)) {
            const remainingTime = Math.ceil(signupRateLimiter.getRemainingTime(rateLimitId) / 1000);
            logSecurityEvent('signup_rate_limited', { rateLimitId, remainingTime });
            throw new Error(`Too many signup attempts. Please wait ${remainingTime} seconds before trying again.`);
        }

        update(state => ({ ...state, isLoading: true }));

        try {
            const userData = {
                email,
                password,
                passwordConfirm,
                ...(name && { name })
            };

            // Create user account
            const record = await pb.collection('users').create(userData);

            logSecurityEvent('signup_success', { userId: record.id, email });

            // Automatically log in after successful registration
            const authData = await login(email, password);

            return authData;
        } catch (error) {
            update(state => ({
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

    // Listen to PocketBase auth changes
    pb.authStore.onChange((token, model) => {
        update(state => ({
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
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true });
        });
    }

    return {
        subscribe,
        login,
        signup,
        logout,
        updateActivity
    };
}

export const authStore = createAuthStore();

// Derived stores for convenient access
export const user: Readable<AuthModel | null> = derived(
    authStore,
    $authStore => $authStore.user
);

export const isAuthenticated: Readable<boolean> = derived(
    authStore,
    $authStore => $authStore.isAuthenticated
);

export const isLoading: Readable<boolean> = derived(
    authStore,
    $authStore => $authStore.isLoading
);
