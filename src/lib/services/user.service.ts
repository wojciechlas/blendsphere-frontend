import { pb } from '../pocketbase';

export interface User {
	id: string;
	email: string;
	name?: string;
	username: string; // Added username
	avatar?: string;
	nativeLanguage: string; // Added nativeLanguage
	aboutMe?: string; // Added aboutMe
	role: string; // Added role, assuming it's a string representation of UserRole
	verified: boolean; // Added verified
	created: string;
	updated: string;
}

export const userService = {
	/**
	 * Get user by ID
	 */
	getById: async (id: string): Promise<User> => {
		try {
			const user = await pb.collection('users').getOne(id);
			return user as unknown as User;
		} catch (error) {
			console.error('Error fetching user:', error);
			throw error;
		}
	},

	/**
	 * Update user profile
	 */
	updateProfile: async (id: string, data: Partial<User>): Promise<User> => {
		try {
			const user = await pb.collection('users').update(id, data);
			return user as unknown as User;
		} catch (error) {
			console.error('Error updating user profile:', error);
			throw error;
		}
	},

	/**
	 * Upload avatar
	 */
	uploadAvatar: async (id: string, fileData: File): Promise<User> => {
		try {
			const formData = new FormData();
			formData.append('avatar', fileData);

			const user = await pb.collection('users').update(id, formData);
			return user as unknown as User;
		} catch (error) {
			console.error('Error uploading avatar:', error);
			throw error;
		}
	},

	/**
	 * Change password
	 */
	changePassword: async (
		id: string,
		currentPassword: string,
		newPassword: string,
		newPasswordConfirm: string
	): Promise<boolean> => {
		try {
			// First verify the current password
			await pb.collection('users').authWithPassword(pb.authStore.model?.email, currentPassword);

			// If authentication successful, change the password
			await pb.collection('users').update(id, {
				password: newPassword,
				passwordConfirm: newPasswordConfirm
			});

			return true;
		} catch (error) {
			console.error('Error changing password:', error);
			throw error;
		}
	},

	/**
	 * List users (admin only)
	 * This should be protected on the backend to admin users only
	 */
	listUsers: async (
		page: number = 1,
		limit: number = 20
	): Promise<{ items: User[]; totalItems: number; totalPages: number }> => {
		try {
			const resultList = await pb.collection('users').getList(page, limit);
			return {
				items: resultList.items as unknown as User[],
				totalItems: resultList.totalItems,
				totalPages: resultList.totalPages
			};
		} catch (error) {
			console.error('Error listing users:', error);
			throw error;
		}
	}
};
