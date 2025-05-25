import { pb } from '../pocketbase';
import type { RecordModel } from 'pocketbase';

export interface StudySession extends RecordModel {
    user: string;
    startTime: string;
    endTime?: string;
    cardsReviewed: number;
    correctAnswers: number;
}

export const studySessionService = {
    /**
     * Start a new study session
     */
    startSession: async (userId: string): Promise<StudySession> => {
        try {
            const sessionData = {
                user: userId,
                startTime: new Date().toISOString(),
                cardsReviewed: 0,
                correctAnswers: 0
            };

            const session = await pb.collection('studySessions').create(sessionData);
            return session as unknown as StudySession;
        } catch (error) {
            console.error('Error starting study session:', error);
            throw error;
        }
    },

    /**
     * End a study session
     */
    endSession: async (sessionId: string, stats: { cardsReviewed: number, correctAnswers: number }): Promise<StudySession> => {
        try {
            const sessionData = {
                endTime: new Date().toISOString(),
                cardsReviewed: stats.cardsReviewed,
                correctAnswers: stats.correctAnswers
            };

            const session = await pb.collection('studySessions').update(sessionId, sessionData);
            return session as unknown as StudySession;
        } catch (error) {
            console.error('Error ending study session:', error);
            throw error;
        }
    },

    /**
     * Get a study session by ID
     */
    getById: async (id: string): Promise<StudySession> => {
        try {
            const session = await pb.collection('studySessions').getOne(id);
            return session as unknown as StudySession;
        } catch (error) {
            console.error('Error fetching study session:', error);
            throw error;
        }
    },

    /**
     * List study sessions by user
     */
    listByUser: async (
        userId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<{ items: StudySession[], totalItems: number, totalPages: number }> => {
        try {
            const resultList = await pb.collection('studySessions').getList(page, limit, {
                filter: `user="${userId}"`,
                sort: '-created'
            });

            return {
                items: resultList.items as unknown as StudySession[],
                totalItems: resultList.totalItems,
                totalPages: resultList.totalPages
            };
        } catch (error) {
            console.error('Error listing study sessions by user:', error);
            throw error;
        }
    },

    /**
     * Get user study statistics
     */
    getUserStats: async (userId: string, days: number = 30): Promise<{
        totalSessions: number;
        totalCards: number;
        correctRate: number;
        averageCardsPerDay: number;
        dailyStats: Array<{ date: string; cards: number; correct: number }>;
    }> => {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const sessions = await pb.collection('studySessions').getFullList({
                filter: `user="${userId}" && created >= "${startDate.toISOString()}"`,
                sort: 'created'
            });

            const sessionsTyped = sessions as unknown as StudySession[];

            // Calculate total statistics
            const totalSessions = sessionsTyped.length;
            const totalCards = sessionsTyped.reduce((sum, session) => sum + session.cardsReviewed, 0);
            const totalCorrect = sessionsTyped.reduce((sum, session) => sum + session.correctAnswers, 0);
            const correctRate = totalCards > 0 ? (totalCorrect / totalCards) * 100 : 0;
            const averageCardsPerDay = totalCards / days;

            // Calculate daily statistics
            const dailyMap = new Map<string, { cards: number; correct: number }>();

            // Initialize all days in the range
            for (let i = 0; i < days; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                dailyMap.set(dateStr, { cards: 0, correct: 0 });
            }

            // Fill in actual data
            sessionsTyped.forEach(session => {
                const dateStr = new Date(session.created).toISOString().split('T')[0];
                const existing = dailyMap.get(dateStr) || { cards: 0, correct: 0 };

                dailyMap.set(dateStr, {
                    cards: existing.cards + session.cardsReviewed,
                    correct: existing.correct + session.correctAnswers
                });
            });

            // Convert map to array
            const dailyStats = Array.from(dailyMap.entries()).map(([date, stats]) => ({
                date,
                cards: stats.cards,
                correct: stats.correct
            }));

            return {
                totalSessions,
                totalCards,
                correctRate,
                averageCardsPerDay,
                dailyStats
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }
};
