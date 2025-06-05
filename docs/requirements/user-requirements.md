# User and Authentication Requirements

## User Entity Requirements:

1.  **Name (Optional):**
    - Users can optionally provide their full name.
    - If the name is not provided, the `username` will be used for display purposes where a name is expected.
2.  **Username (Required, Unique):**
    - Users must have a unique username.
    - Used for login and identification if the name is not set.
3.  **Email (Required, Unique):**
    - Users must provide a unique email address.
    - Used for account verification, communication, and one of the primary authentication methods.
4.  **Avatar (Optional):**
    - Users can upload an avatar image.
    - A default avatar will be used if none is uploaded.
5.  **Role (Required):**
    - Each user must be assigned a role (e.g., ADMIN, TEACHER, STUDENT, INDIVIDUAL_LEARNER).
    - The role determines permissions and access to features.
6.  **Native Language (Required):**
    - Users must select their native language from a predefined list of supported languages.
    - This helps in personalizing the learning experience.
7.  **About Me (Optional):**
    - A text field where users can write a short bio, describe their interests, or hobbies.
    - This information can be used by AI agents to tailor generated content (e.g., flashcards, explanations) to the user's preferences and context.
    - Maximum length of 500 characters.
8.  **Verified (Boolean):**
    - Indicates if the user's email address has been verified.
    - Defaults to `false` on creation.
9.  **Timestamps:**
    - `created`: Automatically set when the user account is created.
    - `updated`: Automatically updated when user information is modified.

## Authentication Method Requirements:

PocketBase provides built-in authentication mechanisms that handle all authentication needs without requiring a separate `AuthMethods` collection.

1.  **Supported Authentication Types:**
    - **Email & Password:**
      - Primary authentication method handled by PocketBase.
      - Requires a valid email and a strong password.
      - Password policies (minimum length, complexity) are enforced.
    - **Email OTP (One-Time Password):**
      - Supported by PocketBase's built-in OTP functionality.
      - OTP is time-limited and single-use.
    - **Google OAuth:**
      - Supported by PocketBase's OAuth2 providers.
      - Retrieves basic profile information (email, name, avatar) from Google upon consent.
    - **Facebook OAuth:**
      - Supported by PocketBase's OAuth2 providers.
      - Retrieves basic profile information (email, name, avatar) from Facebook upon consent.
2.  **Security:**
    - All authentication processes use secure connections (HTTPS).
    - Passwords are securely hashed and salted by PocketBase.
    - OAuth tokens are handled securely by PocketBase.
    - Implements measures against common authentication vulnerabilities (e.g., brute-force attacks via rate limiting).

## Data Model (PocketBase Collections):

### `Users` Collection:

- `id` (string, PK)
- `username` (string, required, unique)
- `email` (string, required, unique, an email type for validation)
- `name` (string, optional)
- `avatar` (file, optional) - Stores the path to the avatar image.
- `role` (select, required, values: ADMIN, TEACHER, STUDENT, INDIVIDUAL_LEARNER)
- `nativeLanguage` (select, required, values: EN, ES, FR, DE, IT, PL etc. - from Language enum)
- `aboutMe` (text, optional, max 500 chars)
- `verified` (boolean, default: false)
- `created` (datetime)
- `updated` (datetime)

**Note:** PocketBase handles authentication internally with built-in support for email/password and OAuth2 providers (Google, Facebook). No separate `AuthMethods` collection is needed as PocketBase manages authentication methods, tokens, and security automatically.
