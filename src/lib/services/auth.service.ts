import { pb, currentUser } from '../pocketbase';
import { get } from 'svelte/store';

export interface RegisterUser {
    email: string;
    password: string;
    passwordConfirm: string;
    name?: string;
}

export interface LoginUser {
    email: string;
    password: string;
}

export const authService = {
    /**
     * Register a new user
     */
    register: async (userData: RegisterUser) => {
        try {
            const record = await pb.collection('users').create(userData);

            // Automatically log in the user after registration if needed
            if (record) {
                return await authService.login({
                    email: userData.email,
                    password: userData.password
                });
            }

            return record;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    /**
     * Log in a user
     */
    login: async (userData: LoginUser) => {
        try {
            return await pb.collection('users').authWithPassword(
                userData.email,
                userData.password
            );
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Log out the current user
     */
    logout: () => {
        pb.authStore.clear();
    },

    /**
     * Get the current authenticated user
     */
    getCurrentUser: () => {
        return get(currentUser);
    },

    /**
     * Check if a user is authenticated
     */
    isAuthenticated: () => {
        return pb.authStore.isValid;
    },

    /**
     * Request password reset email
     */
    requestPasswordReset: async (email: string) => {
        try {
            return await pb.collection('users').requestPasswordReset(email);
        } catch (error) {
            console.error('Password reset request error:', error);
            throw error;
        }
    },

    /**
     * Confirm password reset
     */
    confirmPasswordReset: async (token: string, password: string, passwordConfirm: string) => {
        try {
            return await pb.collection('users').confirmPasswordReset(
                token,
                password,
                passwordConfirm
            );
        } catch (error) {
            console.error('Password reset confirmation error:', error);
            throw error;
        }
    }
};
