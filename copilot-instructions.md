Absolutely! Let's craft some comprehensive coding copilot instructions for the BlendSphere frontend application, keeping in mind the provided documents and technologies.

## BlendSphere Frontend Coding Copilot Instructions

These instructions are designed to guide developers (and a coding copilot) working on the BlendSphere frontend application. We'll cover product definition, requirements derived from the provided documents, best practices, and technology stack guidelines.

### 1. Product Definition

**BlendSphere** is an innovative language learning application designed to support both group learning in language schools and individual learning. The application utilizes artificial intelligence to:

- Generate personalized flashcards.
- Offers a spaced repetition system (SRS) based on an algorithm.
- Enables sharing materials and collaboration within a community.
- Aims to increase the effectiveness and durability of the language learning process by providing an interactive tool that supports various learning styles.

**Key Focus:** BlendSphere should be intuitive, user-friendly, and performance-driven. The AI-powered features should be seamlessly integrated, and the user experience should be engaging and motivating.

### 2. Requirements

**2.1. Functional Requirements:**

- **User Authentication:** Sign-up/login via email/password, Google, and Facebook. Minimal user data collection for GDPR compliance.
- **Deck/Class Management:** Create, edit, delete, and share flashcard decks. Teachers can create classes and manage student access.
- **Flashcard Creation:** Create flashcards using templates. AI-assisted flashcard generation from input data.
- **Spaced Repetition System (SRS):** Daily flashcard review based on an algorithm. User rating of card recall to adjust review intervals.
- **Learning Progression Tracking:** Track user performance and display progress over time.
- **Community Features:** User posts/comments, community groups (design to be specified).
- **AI Integration:** Seamless integration with GenAI model for flashcard generation (as specified in "analiza-tech-fiszki.pdf").

**2.2. User Journeys/Scenarios:**

- **Teacher Onboarding:** Sign-up, class creation, lesson creation, flashcard template creation, flashcard creation for lessons.
- **Student Participation:** Joining a class, creating personal decks, copying teacher flashcards, managing personal flashcards, accessing lesson materials.
- **Individual Learner Setup:** Sign-up, creating private decks, personal flashcard creation, private class/lesson creation.
- **Daily Repetition:** User login, system presents flashcards for review, user rates recall, system updates review schedule.

**2.3. Key Performance Indicators (KPIs):**

- Daily/Monthly Active Users (DAU/MAU) with Flashcard/SRS Usage
- Time spent learning and improvement in quiz scores.
- Number of new user signups, especially from language schools.
- User Retention Rate, Churn Rate.
- Conversion Rate to Paid Plans, Average Revenue Per User (ARPU).
- Number of user posts/comments, active community groups.
- Brand mentions on social media, user reviews/ratings, Net Promoter Score (NPS).

### 3. Technology Stack

- **Framework:** Svelte 5
- **Build Tool:** Vite
- **Language:** TypeScript
- **UI Library:** shadcn-svelte
- **State Management:** Svelte stores
- **Styling:** Tailwind CSS
- **API Communication:** Fetch API

### 4. Best Practices

**4.1. TypeScript:**

- **Strict Typing:** Utilize TypeScript's strict mode and define explicit types for all variables, function parameters, and return values.
- **Interfaces/Types:** Create interfaces and types for data structures, API responses, and component props.
- **Code Reusability:** Leverage generics to create reusable components and functions.
- **Error Handling:** Use `try-catch` blocks for asynchronous operations and handle errors gracefully.
- **Linting and Formatting:** Use ESLint and Prettier for consistent code style. Configure rules to enforce best practices.
- **Documentation:** Use JSDoc comments to document complex functions and components.
- **Testing:** Write unit tests using Vitest and Svelte Testing Library. Ensure all components and functions are covered by tests.
- **Code Organization:** Structure the codebase into modules (components, stores, services, types) for better maintainability.

**4.2. Svelte 5:**

- **Component-Based Architecture:** Break down the UI into small, reusable components.
- **Reactivity:** Use Svelte's built-in reactivity with the `$state`, `$derived`, and `$effect` features.
- **Immutability:** While Svelte handles reactivity automatically, follow immutability principles for state management.
- **Keyed Each Blocks:** Always use the `key` directive in `{#each}` blocks for optimized rendering.
- **Lifecycle Hooks:** Properly use `onMount`, `onDestroy`, and other lifecycle functions.
- **Code Splitting:** Utilize dynamic imports for code splitting to improve initial load time.

**4.3. shadcn-svelte:**

- **Component Customization:** Customize components using Tailwind CSS classes. Avoid overriding default styles unless necessary.
- **Consistency:** Maintain consistency in component usage and styling across the application.
- **Accessibility:** Ensure all components are accessible. Follow WCAG guidelines.

**4.4. General Coding Practices:**

- **Clean Code:** Write clean, readable, and maintainable code. Follow coding conventions.
- **Comments:** Add clear and concise comments to explain complex logic.
- **Error Handling:** Implement proper error handling for API calls and user interactions.
- **Performance Optimization:** Optimize for performance. Use techniques like memoization, debouncing, and virtualization.
- **Responsive Design:** Ensure the application is responsive and works well on different screen sizes.
- **Testing:** Write unit tests and integration tests. Use testing libraries like Vitest and Svelte Testing Library.
- **Version Control:** Use Git for version control. Follow a branching strategy (e.g., Gitflow).

**4.5. AI Integration (GenAI):**

- **API Calls:** Create well-defined API endpoints for communicating with the GenAI model (refer to "analiza-tech-fiszki.pdf" for requirements).
- **Data Handling:** Handle input and output data formats correctly. Validate responses from the AI model.
- **Error Management:** Implement error handling for AI API calls (e.g., network errors, model errors).
- **Loading States:** Show loading states when waiting for responses from the AI model.

**4.6. Backend Integration:**

- **Dual Backend Architecture:**
  - **PocketBase:** Handles core application data (users, templates, decks, cards, classes, etc.)
  - **FastAPI:** Manages AI features (card generation, spaced repetition system)
- **API Communication:** Implement consistent patterns for communicating with both backends.
- **Authentication:** Handle authentication tokens appropriately for both backend systems.
- **Error Handling:** Implement robust error handling for both backend services.

### 5. Copilot Guidelines

- **Context is Key:** Provide the copilot with clear instructions and context. Specify the component, feature, or task you want it to help with.
- **Break Down Tasks:** Break down complex tasks into smaller, manageable chunks.
- **Review and Refine:** Always review and refine the code generated by the copilot. Don't blindly accept its suggestions.
- **Follow Best Practices:** Ensure the copilot-generated code adheres to the best practices outlined above.
- **Use Type Hints:** When using the copilot in TypeScript, use type hints and interfaces to guide its suggestions.
- **Validate AI Responses:** Ensure that data generated by the AI model is validated and matches the expected format.
- **Backend Distinction:** Clearly specify which backend service (PocketBase or FastAPI) the code should interact with.

### Example Copilot Instruction

**Task:** Create a Svelte component that displays a list of flashcards.

```svelte
<!-- Copilot: Create a Svelte component named FlashcardList that takes a prop
     named 'flashcards' (an array of objects with 'front' and 'back' properties)
     and renders each flashcard in a list. Use appropriate UI components for each
     flashcard. Use TypeScript for typing. -->

<!-- Component code -->
```

### 6. Additional Considerations

- **State Management Strategy:** Svelte stores for application-wide state
- **API Communication:**
  - REST API for PocketBase (core application data)
  - REST API for FastAPI (AI features)
- **Deployment:** Docker, possible to deploy in Vercel, Netlify
- **Backend Architecture:**
  - PocketBase and FastAPI will be maintained in a separate repository
  - Frontend should implement clear separation of concerns when interacting with each backend
- **Backend Communication Patterns:**
  - Create service modules for each backend
  - Implement appropriate error handling and retry mechanisms
  - Cache responses when appropriate to reduce backend load
