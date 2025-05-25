# PocketBase Integration Examples

This document provides examples of how to use the PocketBase services in Svelte components.

## Authentication Example

```svelte
<script lang="ts">
  import { authService } from '$lib/services/auth.service';
  import { onMount } from 'svelte';
  import { currentUser } from '$lib/pocketbase';
  
  let email = '';
  let password = '';
  let error = '';
  let isLoading = false;
  
  const handleLogin = async () => {
    error = '';
    isLoading = true;
    
    try {
      await authService.login({
        email,
        password
      });
      // Redirect or show success message
    } catch (err) {
      error = 'Invalid email or password';
      console.error(err);
    } finally {
      isLoading = false;
    }
  };
  
  onMount(() => {
    // Check if already logged in
    if (authService.isAuthenticated()) {
      // Redirect to dashboard or home page
    }
  });
</script>

<form on:submit|preventDefault={handleLogin}>
  <div>
    <label for="email">Email</label>
    <input type="email" id="email" bind:value={email} required />
  </div>
  
  <div>
    <label for="password">Password</label>
    <input type="password" id="password" bind:value={password} required />
  </div>
  
  {#if error}
    <div class="error">{error}</div>
  {/if}
  
  <button type="submit" disabled={isLoading}>
    {isLoading ? 'Logging in...' : 'Log in'}
  </button>
</form>

<div>
  {#if $currentUser}
    <p>Logged in as {$currentUser.email}</p>
    <button on:click={() => authService.logout()}>Log out</button>
  {:else}
    <p>Not logged in</p>
  {/if}
</div>
```

## Templates Example

```svelte
<script lang="ts">
  import { templateService, type Template } from '$lib/services/template.service';
  import { onMount } from 'svelte';
  import { currentUser } from '$lib/pocketbase';
  
  let templates: Template[] = [];
  let isLoading = true;
  let error = '';
  
  onMount(async () => {
    await loadTemplates();
  });
  
  async function loadTemplates() {
    isLoading = true;
    error = '';
    
    try {
      // Get templates created by the current user and public templates
      const userId = $currentUser?.id;
      let filter = {};
      
      if (userId) {
        filter = { createdBy: userId };
      } else {
        filter = { isPublic: true };
      }
      
      const result = await templateService.list(1, 50, filter);
      templates = result.items;
    } catch (err) {
      error = 'Failed to load templates';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
  
  async function createTemplate(templateData) {
    try {
      await templateService.create(templateData);
      await loadTemplates(); // Reload the list
    } catch (err) {
      error = 'Failed to create template';
      console.error(err);
    }
  }
</script>

{#if isLoading}
  <div>Loading templates...</div>
{:else if error}
  <div class="error">{error}</div>
{:else}
  <div class="templates-grid">
    {#each templates as template (template.id)}
      <div class="template-card">
        <h3>{template.name}</h3>
        <p>{template.description || 'No description'}</p>
        <div class="template-actions">
          <button on:click={() => useTemplate(template.id)}>Use</button>
          {#if $currentUser?.id === template.createdBy}
            <button on:click={() => editTemplate(template.id)}>Edit</button>
            <button on:click={() => deleteTemplate(template.id)}>Delete</button>
          {:else}
            <button on:click={() => cloneTemplate(template.id)}>Clone</button>
          {/if}
        </div>
      </div>
    {/each}
    
    {#if templates.length === 0}
      <div>No templates found. Create one!</div>
    {/if}
  </div>
{/if}
```

## Flashcards Example

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { flashcardService, type Flashcard } from '$lib/services/flashcard.service';
  import { currentUser } from '$lib/pocketbase';
  import { studySessionService } from '$lib/services/study-session.service';
  
  let currentSession = null;
  let currentCard: Flashcard | null = null;
  let dueCards: Flashcard[] = [];
  let isLoading = true;
  let showAnswer = false;
  let stats = {
    cardsReviewed: 0,
    correctAnswers: 0
  };
  
  onMount(async () => {
    if ($currentUser) {
      await startStudySession();
    }
  });
  
  async function startStudySession() {
    try {
      isLoading = true;
      
      // Start a new study session
      currentSession = await studySessionService.startSession($currentUser.id);
      
      // Load due cards
      dueCards = await flashcardService.getDueFlashcards($currentUser.id, 20);
      
      // Set the first card
      if (dueCards.length > 0) {
        currentCard = dueCards[0];
        dueCards = dueCards.slice(1);
      } else {
        currentCard = null;
      }
      
      isLoading = false;
    } catch (error) {
      console.error('Error starting study session:', error);
      isLoading = false;
    }
  }
  
  async function answerCard(rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') {
    if (!currentCard || !currentSession) return;
    
    try {
      // Record the review
      await flashcardService.recordReview(
        currentCard.id,
        $currentUser.id,
        currentSession.id,
        rating,
        1000 // Replace with actual time taken
      );
      
      // Update stats
      stats.cardsReviewed++;
      if (rating === 'GOOD' || rating === 'EASY') {
        stats.correctAnswers++;
      }
      
      // Move to next card
      if (dueCards.length > 0) {
        currentCard = dueCards[0];
        dueCards = dueCards.slice(1);
        showAnswer = false;
      } else {
        // End session if no more cards
        await endStudySession();
        currentCard = null;
      }
    } catch (error) {
      console.error('Error answering card:', error);
    }
  }
  
  async function endStudySession() {
    if (!currentSession) return;
    
    try {
      await studySessionService.endSession(currentSession.id, stats);
      currentSession = null;
    } catch (error) {
      console.error('Error ending study session:', error);
    }
  }
</script>

{#if isLoading}
  <div>Loading study session...</div>
{:else if !currentCard}
  <div>
    <h2>No cards due for review!</h2>
    <p>Stats: {stats.cardsReviewed} cards reviewed, {stats.correctAnswers} correct answers</p>
    <button on:click={startStudySession}>Start New Session</button>
  </div>
{:else}
  <div class="flashcard">
    <div class="front" class:hidden={showAnswer}>
      <!-- Render front of card using the template and data -->
      <h3>{currentCard.data.question || 'Question'}</h3>
    </div>
    
    {#if showAnswer}
      <div class="back">
        <!-- Render back of card using the template and data -->
        <h3>{currentCard.data.answer || 'Answer'}</h3>
        
        <div class="rating-buttons">
          <button on:click={() => answerCard('AGAIN')}>Again</button>
          <button on:click={() => answerCard('HARD')}>Hard</button>
          <button on:click={() => answerCard('GOOD')}>Good</button>
          <button on:click={() => answerCard('EASY')}>Easy</button>
        </div>
      </div>
    {:else}
      <button on:click={() => showAnswer = true}>Show Answer</button>
    {/if}
  </div>
{/if}
```

## User Profile Example

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { userService } from '$lib/services/user.service';
  import { currentUser } from '$lib/pocketbase';
  import { studySessionService } from '$lib/services/study-session.service';
  
  let profile = null;
  let isLoading = true;
  let stats = null;
  let isEditMode = false;
  let name = '';
  
  onMount(async () => {
    if ($currentUser) {
      await loadProfile();
      await loadStats();
    }
  });
  
  async function loadProfile() {
    try {
      isLoading = true;
      profile = await userService.getById($currentUser.id);
      name = profile.name || '';
      isLoading = false;
    } catch (error) {
      console.error('Error loading profile:', error);
      isLoading = false;
    }
  }
  
  async function loadStats() {
    try {
      stats = await studySessionService.getUserStats($currentUser.id, 30);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
  
  async function updateProfile() {
    try {
      await userService.updateProfile($currentUser.id, { name });
      isEditMode = false;
      await loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  }
  
  function toggleEditMode() {
    isEditMode = !isEditMode;
  }
</script>

{#if isLoading}
  <div>Loading profile...</div>
{:else if profile}
  <div class="profile-container">
    <div class="profile-header">
      <h1>Your Profile</h1>
      <button on:click={toggleEditMode}>
        {isEditMode ? 'Cancel' : 'Edit Profile'}
      </button>
    </div>
    
    {#if isEditMode}
      <form on:submit|preventDefault={updateProfile}>
        <div>
          <label for="name">Name</label>
          <input type="text" id="name" bind:value={name} />
        </div>
        
        <button type="submit">Save Changes</button>
      </form>
    {:else}
      <div class="profile-info">
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Name:</strong> {profile.name || 'Not set'}</p>
        <p><strong>Account created:</strong> {new Date(profile.created).toLocaleDateString()}</p>
      </div>
    {/if}
    
    {#if stats}
      <div class="stats-container">
        <h2>Study Statistics (Last 30 days)</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Total Sessions</h3>
            <p>{stats.totalSessions}</p>
          </div>
          <div class="stat-card">
            <h3>Cards Reviewed</h3>
            <p>{stats.totalCards}</p>
          </div>
          <div class="stat-card">
            <h3>Correct Rate</h3>
            <p>{stats.correctRate.toFixed(1)}%</p>
          </div>
          <div class="stat-card">
            <h3>Avg. Cards/Day</h3>
            <p>{stats.averageCardsPerDay.toFixed(1)}</p>
          </div>
        </div>
        
        <!-- Add a chart here using chart-area-interactive.svelte -->
      </div>
    {/if}
  </div>
{:else}
  <div>User not found or not logged in</div>
{/if}
```

## Running PocketBase

To start the PocketBase server:

1. Navigate to the PocketBase directory:
   ```bash
   cd /home/wlas/BlendSphere/pocketbase
   ```

2. Run the start script:
   ```bash
   ./start.sh
   ```

3. Access the admin dashboard at http://localhost:8090/_/

4. When you first run PocketBase, you'll need to create an admin account.

5. The migrations will automatically set up all the required collections for BlendSphere.

## Testing the Connection

After setting up PocketBase, you can test the connection in your frontend by:

1. Starting your development server
2. Navigating to a page that uses PocketBase services
3. Checking the network tab in your browser's developer tools to see if requests to PocketBase are successful

Remember to always use the service modules when interacting with PocketBase, as they provide a consistent API and handle errors appropriately.
