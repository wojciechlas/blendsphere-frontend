import { render, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import ReviewPage from './+page.svelte';

// Mock the necessary stores and services
vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn((fn) => {
			fn({ url: { searchParams: { get: () => null } } });
			return () => {};
		})
	}
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$lib/stores/review-session.store', () => ({
	reviewSessionStore: {
		subscribe: vi.fn((fn) => {
			fn({
				isLoading: true,
				error: null,
				cards: [],
				currentCardIndex: 0,
				isFlipped: false,
				session: null
			});
			return () => {};
		})
	},
	reviewSessionActions: {
		initializeSession: vi.fn(() => Promise.resolve(false)),
		flipCard: vi.fn(),
		rateCard: vi.fn(),
		resetSession: vi.fn(),
		getSessionSummary: vi.fn(() => null)
	}
}));

vi.mock('$lib/services/template.service', () => ({
	templateService: {
		getById: vi.fn(() => Promise.resolve({}))
	}
}));

test('renders loading state initially', () => {
	render(ReviewPage);
	expect(screen.getByText('Review Session')).toBeInTheDocument();
});
