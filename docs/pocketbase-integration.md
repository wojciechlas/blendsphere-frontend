# PocketBase Integration

BlendSphere uses PocketBase as its backend server. This document describes how the frontend integrates with PocketBase.

## Setup

The PocketBase client is initialized in `/src/lib/pocketbase.ts`. This file exports:

- `pb`: The PocketBase client instance
- `currentUser`: A Svelte store containing the current authenticated user
- `isLoggedIn()`: A helper function to check if a user is logged in
- `collections`: Convenient access to all PocketBase collections

## Authentication

Authentication is handled by the `auth.service.ts` file, which provides:

- `register`: Register a new user
- `login`: Log in an existing user
- `logout`: Log out the current user
- `getCurrentUser`: Get the current authenticated user
- `isAuthenticated`: Check if a user is authenticated
- `requestPasswordReset`: Request a password reset email
- `confirmPasswordReset`: Confirm a password reset

Example usage:

```typescript
import { authService } from '$lib/services/auth.service';

// Register a new user
const userData = {
	email: 'user@example.com',
	password: 'password123',
	passwordConfirm: 'password123',
	name: 'John Doe'
};
await authService.register(userData);

// Login
await authService.login({
	email: 'user@example.com',
	password: 'password123'
});

// Get current user
const user = authService.getCurrentUser();

// Logout
authService.logout();
```

## User Management

User management is handled by the `user.service.ts` file, which provides:

- `getById`: Get a user by ID
- `updateProfile`: Update a user's profile
- `uploadAvatar`: Upload a user's avatar
- `changePassword`: Change a user's password
- `listUsers`: List all users (admin only)

## Templates

Template management is handled by the `template.service.ts` file, which provides:

- `create`: Create a new template
- `getById`: Get a template by ID
- `update`: Update a template
- `delete`: Delete a template
- `list`: List templates
- `clone`: Clone a template

## Decks

Deck management is handled by the `deck.service.ts` file, which provides:

- `create`: Create a new deck
- `getById`: Get a deck by ID
- `update`: Update a deck
- `delete`: Delete a deck
- `listByUser`: List decks by user
- `listPublic`: List public decks

## Flashcards

Flashcard management is handled by the `flashcard.service.ts` file, which provides:

- `create`: Create a new flashcard
- `getById`: Get a flashcard by ID
- `update`: Update a flashcard
- `delete`: Delete a flashcard
- `listByDeck`: List flashcards in a deck
- `getDueFlashcards`: Get flashcards due for review

## Setting Up PocketBase

We've created scripts to make setting up and running PocketBase easier:

1. Go to the PocketBase directory:

   ```bash
   cd pocketbase
   ```

2. Run the installation script:

   ```bash
   ./install_pocketbase.sh
   ```

3. Start the PocketBase server:

   ```bash
   ./run_pocketbase.sh
   ```

4. Open the URL shown in the console (usually http://127.0.0.1:8090/_/) to create your superuser account
   - When you first access the admin UI, you'll be prompted to create a superuser account
   - Enter your email, password, and confirm password
   - This account will have full administrative privileges in PocketBase
5. The migrations will automatically set up all necessary collections

### Additional Scripts

We've provided several helper scripts to manage PocketBase:

- `test_connection.sh`: Tests if PocketBase is running and accessible
- `run_migrations.sh`: Applies migrations to the PocketBase database
- `install_pocketbase.sh`: Downloads and installs PocketBase
- `run_pocketbase.sh`: Starts the PocketBase server

### Manual Setup

Alternatively, you can manually:

1. Download PocketBase v0.28.2 from [GitHub Releases](https://github.com/pocketbase/pocketbase/releases/download/v0.28.2/pocketbase_0.28.2_linux_amd64.zip)
2. Extract the archive to the `/home/wlas/BlendSphere/pocketbase` directory
3. Make the binary executable: `chmod +x pocketbase`
4. Run PocketBase: `./pocketbase serve`
5. Open http://127.0.0.1:8090/_/ in your browser to create a superuser account

The frontend will automatically connect to http://localhost:8090 (configurable in the .env file).

For more detailed instructions, see the [PocketBase Setup Guide](pocketbase-setup.md).

## Development Workflow

1. Start the PocketBase server
2. Start the frontend development server
3. Use the service modules to interact with PocketBase
