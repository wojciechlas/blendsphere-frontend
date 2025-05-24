---
layout: default
title: Data Structure
---

# Data Structure

The data structure of BlendSphere defines how information is organized, stored, and related within the application. This page outlines the key entities and their relationships in the BlendSphere data model.

## Data Structure Diagram

![Data Structure Diagram](images/BlendSphere%20Data%20Structure%20-%20PocketBase%20Compatible.png)

## Key Entities

### User

The central entity representing a user of the application. Users can be teachers, students, or individual learners.

### Deck

A collection of flashcards created by a user. Decks can be personal or shared within classes.

### Flashcard

The fundamental learning unit containing question/answer pairs and additional metadata for SRS scheduling.

### Template

Defines the structure and format of flashcards. Templates can be shared and reused.

### Class

Represents an educational class or group. Classes have members (teachers and students) and associated learning materials.

### Review Session

Records of user's review activities, including performance metrics used by the SRS algorithm.

### AI Generation

History of AI-assisted content generation, including prompts and responses.

## Data Relationships

- **User to Deck**: One-to-many (a user can have multiple decks)
- **Deck to Flashcard**: One-to-many (a deck contains multiple flashcards)
- **Template to Flashcard**: One-to-many (a template can be used for multiple flashcards)
- **User to Class**: Many-to-many (users can be part of multiple classes, classes have multiple users)
- **Class to Deck**: One-to-many (a class can have multiple associated decks)
- **User to Review Session**: One-to-many (a user has multiple review sessions)
- **Flashcard to Review Record**: One-to-many (a flashcard has multiple review records)

## Data Storage

BlendSphere uses PocketBase as its primary database for storing core application data. The data structure is designed to be efficient and compatible with PocketBase's document-based storage model.

## Synchronization

The application supports offline mode, with a synchronization mechanism that ensures data consistency between the local storage and the backend database.
