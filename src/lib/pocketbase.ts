import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
import { isSecureContext, logSecurityEvent } from './utils/security';

// Validate PocketBase URL
const validatePocketBaseUrl = (url: string): string => {
    try {
        const parsed = new URL(url);

        // In production, enforce HTTPS
        if (!import.meta.env.DEV && parsed.protocol !== 'https:') {
            console.warn('Warning: PocketBase URL should use HTTPS in production');
        }

        return url;
    } catch (error) {
        console.error('Invalid PocketBase URL:', url);
        throw new Error('Invalid PocketBase URL configuration');
    }
};

// Create a PocketBase instance with enhanced security
const pocketbaseUrl = validatePocketBaseUrl(
    import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090'
);

export const pb = new PocketBase(pocketbaseUrl);

// Enhanced security configuration
if (typeof window !== 'undefined') {
    // Check if running in secure context
    if (!isSecureContext() && import.meta.env.PROD) {
        logSecurityEvent('insecure_context_warning', {
            protocol: window.location.protocol,
            hostname: window.location.hostname
        });
    }

    // Configure PocketBase auth store with enhanced security
    pb.authStore.onChange((token, model) => {
        if (pb.authStore.isValid && model) {
            logSecurityEvent('auth_state_changed', {
                isValid: pb.authStore.isValid,
                userId: model.id
            });
        }
    });
}

// Create a store for the current user
export const currentUser = writable(pb.authStore.model);

// Subscribe to authStore changes and update the currentUser store
pb.authStore.onChange((token, model) => {
    currentUser.set(model);
});

// Helper function to check if user is logged in
export const isLoggedIn = () => pb.authStore.isValid;

// Export the collections for easy access
export const collections = {
    users: pb.collection('users'),
    authMethods: pb.collection('authMethods'),
    templates: pb.collection('templates'),
    fields: pb.collection('fields'),
    decks: pb.collection('decks'),
    flashcards: pb.collection('flashcards'),
    classes: pb.collection('classes'),
    classEnrollments: pb.collection('classEnrollments'),
    lessons: pb.collection('lessons'),
    studySessions: pb.collection('studySessions'),
    flashcardReviews: pb.collection('flashcardReviews'),
    posts: pb.collection('posts'),
    comments: pb.collection('comments'),
    reactions: pb.collection('reactions'),
    aiPrompts: pb.collection('aiPrompts')
};
