---
layout: default
title: SRS Algorithm
---

# Spaced Repetition System (SRS) Algorithm

The Spaced Repetition System (SRS) is at the core of BlendSphere's learning methodology. This algorithm optimizes the timing of flashcard reviews to maximize long-term memory retention while minimizing review time.

## SRS Algorithm Structure

![SRS Algorithm Structure](images/SRS%20Algorithm%20-%20Class%20Structure.png)

## SRS Algorithm Flashcard Lifecycle

![SRS Algorithm Flashcard Lifecycle](images/SRS%20Algorithm%20-%20Flashcard%20Lifecycle.png)

## SRS Algorithm Simplified

![SRS Algorithm Simple](images/SRS%20Algorithm%20Simple.png)

## How It Works

The SRS algorithm in BlendSphere is based on scientific research in cognitive psychology, particularly the spacing effect and the forgetting curve. It works by:

1. **Initial Learning**: When a flashcard is first created, it's scheduled for review in a short time period (typically 1 day).

2. **Review & Rating**: During review, users rate their recall performance on a scale (typically 1-5):
   - 1: Complete failure to recall
   - 2: Significant difficulty recalling
   - 3: Correct recall with effort
   - 4: Correct recall with slight hesitation
   - 5: Perfect recall with no hesitation

3. **Interval Calculation**: Based on the user's rating, the algorithm calculates the next review interval:
   - For ratings 1-2: The interval is shortened (relearning phase)
   - For rating 3: The interval increases slightly
   - For ratings 4-5: The interval increases significantly

4. **Exponential Growth**: As users consistently demonstrate good recall, intervals grow exponentially (from days to weeks to months).

5. **Personalization**: The algorithm adapts to individual learning patterns over time, optimizing intervals based on historical performance.

## Algorithm Parameters

The SRS algorithm uses several key parameters to determine review intervals:

- **Initial Interval**: The delay after first learning (default: 1 day)
- **Easy Factor**: Multiplier for interval after good performance (default: 2.5)
- **Minimum Interval**: Lower bound for intervals after poor performance (default: 1 day)
- **Maximum Interval**: Upper bound for intervals (default: 6 months)
- **Interval Modifier**: Global scaling factor to adjust all intervals (default: 1.0)

## Flashcard States

Flashcards in the system can exist in several states:

- **New**: Not yet studied
- **Learning**: In the initial learning phase
- **Review**: In the regular review cycle with increasing intervals
- **Relearning**: Returned to learning phase after a poor recall
- **Graduated**: Reached maximum interval (effectively "learned")

## Implementation Details

The SRS algorithm in BlendSphere is implemented as a JavaScript/TypeScript module that:

1. Calculates due dates for flashcards based on review history
2. Updates flashcard metadata after each review
3. Prioritizes flashcards for daily review sessions
4. Provides statistics on learning progress

## Benefits of SRS

- **Efficiency**: Focus on difficult cards while spending less time on well-known material
- **Effectiveness**: Significantly better long-term retention compared to traditional study methods
- **Adaptability**: Personalized to individual learning patterns and different types of material
- **Motivation**: Clear progress tracking and optimized workload distribution
