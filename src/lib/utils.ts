import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Format a date as relative time (e.g., "2 minutes ago", "3 days ago")
 * @param date - The date to format (string or Date object)
 * @returns A string representing the relative time
 */
export function formatRelativeTime(date: string | Date): string {
	const now = new Date();
	const targetDate = new Date(date);
	const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

	// If the date is in the future, return "just now"
	if (diffInSeconds < 0) {
		return 'just now';
	}

	// Less than a minute
	if (diffInSeconds < 60) {
		return 'just now';
	}

	// Minutes
	const minutes = Math.floor(diffInSeconds / 60);
	if (minutes < 60) {
		return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
	}

	// Hours
	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return `${hours} hour${hours === 1 ? '' : 's'} ago`;
	}

	// Days
	const days = Math.floor(hours / 24);
	if (days < 30) {
		return `${days} day${days === 1 ? '' : 's'} ago`;
	}

	// Months
	const months = Math.floor(days / 30);
	if (months < 12) {
		return `${months} month${months === 1 ? '' : 's'} ago`;
	}

	// Years
	const years = Math.floor(months / 12);
	return `${years} year${years === 1 ? '' : 's'} ago`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
