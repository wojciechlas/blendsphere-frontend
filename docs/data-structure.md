---
layout: default
title: Data Structure
---

# Data Structure

The data structure of BlendSphere defines how information is organized, stored, and related within the application. This page outlines the key entities and their relationships in the BlendSphere data model.

## Data Structure Diagram

![Data Structure Diagram](images/BlendSphere%20Data%20Structure%20-%20PocketBase%20Compatible.png)

## Key Entities

### Users
Represents a user of the application. Users can have roles like ADMIN, TEACHER, STUDENT, or INDIVIDUAL_LEARNER. Stores user profile information, preferences, and authentication details.

### Templates
Defines the structure, layout, and styling for flashcards. Templates are created by users and can be public or private. Each template can have multiple fields.

### Fields
Represents a piece of data within a template, such as text, image, or audio. Fields have a type, language, and can be designated as input fields.

### Decks
A collection of flashcards created or owned by a user. Decks can be public or private and are used to organize flashcards for study.

### Flashcards
The core learning unit. Each flashcard is based on a template and contains data for its fields. Flashcards store FSRS (Free Spaced Repetition Scheduler) state, difficulty, stability, and review history.

### Classes
Represents an educational group or class, typically managed by a teacher. Students can enroll in classes.

### ClassEnrollments
Tracks the enrollment of students in classes, including their status (e.g., PENDING, ACTIVE).

### Lessons
Represents a unit of learning within a class, created by a teacher. Lessons can have associated posts for discussion.

### StudySessions
Records a user's study activity, including start/end times and performance metrics like cards reviewed and correct/incorrect answers.

### FlashcardReviews
Detailed records of individual flashcard reviews by a user during a study session. Includes the rating given, time taken, and the FSRS state after the review.

### Posts
User-generated content within a lesson, such as questions, resources, announcements, or discussions.

### Comments
Replies or comments made by users on posts.

### Reactions
User reactions (e.g., LIKE, HELPFUL) to posts or comments.

### AIPrompts
Stores records of interactions with AI features, such as prompts for flashcard generation, explanations, or translations, along with the AI's response.

## Data Relationships

- **Users "1" -- "0..*" Templates**: A user can create multiple templates.
- **Users "1" -- "0..*" Decks**: A user owns multiple decks.
- **Users "1" -- "0..*" Classes**: A user (teacher) can teach multiple classes.
- **Users "1" -- "0..*" ClassEnrollments**: A user (student) enrolls in classes via enrollments.
- **Users "1" -- "0..*" StudySessions**: A user participates in multiple study sessions.
- **Users "1" -- "0..*" FlashcardReviews**: A user provides multiple flashcard reviews.
- **Users "1" -- "0..*" Posts**: A user creates multiple posts.
- **Users "1" -- "0..*" Comments**: A user writes multiple comments.
- **Users "1" -- "0..*" Reactions**: A user gives multiple reactions.
- **Users "1" -- "0..*" AIPrompts**: A user submits multiple AI prompts.

- **Templates "1" -- "0..*" Fields**: A template contains multiple fields.
- **Templates "1" -- "0..*" Flashcards**: A template is used by multiple flashcards.

- **Decks "1" -- "0..*" Flashcards**: A deck contains multiple flashcards.

- **Classes "1" -- "0..*" ClassEnrollments**: A class has multiple enrollments.
- **Classes "1" -- "0..*" Lessons**: A class contains multiple lessons.

- **Lessons "1" -- "0..*" Posts**: A lesson contains multiple posts.

- **StudySessions "1" -- "0..*" FlashcardReviews**: A study session includes multiple flashcard reviews.

- **Posts "1" -- "0..*" Comments**: A post has multiple comments.
- **Posts "1" -- "0..*" Reactions**: A post receives multiple reactions.

- **Comments "1" -- "0..*" Reactions**: A comment receives multiple reactions.

## Data Storage

BlendSphere uses PocketBase as its primary database for storing core application data. The data structure is designed to be efficient and compatible with PocketBase's document-based storage model.

## Synchronization

The application supports offline mode, with a synchronization mechanism that ensures data consistency between the local storage and the backend database.
