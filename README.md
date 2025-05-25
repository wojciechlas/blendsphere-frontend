# BlendSphere Frontend

AI-powered language learning application built with SvelteKit, TypeScript, and shadcn-svelte components.

## Features

- 🔐 **Secure Authentication** - Login/signup with PocketBase integration
- 🛡️ **Enhanced Security** - Rate limiting, input validation, session management
- 🎨 **Modern UI** - Beautiful interface with shadcn-svelte components
- 📱 **Responsive Design** - Works seamlessly across all devices
- 🚀 **High Performance** - Built with SvelteKit 5 and Vite
- 🔒 **Privacy Focused** - GDPR compliant with minimal data collection

## Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- PocketBase server running (see backend setup)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd blendsphere-frontend
npm install
```

2. **Environment setup:**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# VITE_POCKETBASE_URL=http://localhost:8090
```

3. **Start development server:**
```bash
npm run dev

# Or open in browser automatically
npm run dev -- --open
```

## Authentication System

### Security Features

- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, numbers, and special characters
- **Rate Limiting**: Protection against brute force attacks (5 login attempts per minute)
- **Session Management**: 30-minute inactivity timeout with automatic renewal
- **Input Validation**: Comprehensive client-side and server-side validation with Zod schemas
- **Secure Storage**: Encrypted local storage for sensitive data
- **CSRF Protection**: Built-in protection against cross-site request forgery

### Available Routes

- `/` - Landing page with feature overview
- `/login` - User login with email/password
- `/signup` - User registration with validation
- `/forgot-password` - Password reset functionality
- `/dashboard` - Protected dashboard (requires authentication)

### Authentication Flow

1. **Registration**: Users create accounts with email verification
2. **Login**: Secure authentication with PocketBase
3. **Session**: Automatic session management with timeout
4. **Logout**: Clean session termination

## Development

### Project Structure

```
src/
├── lib/
│   ├── components/ui/     # shadcn-svelte components
│   ├── services/          # API service layers
│   ├── stores/           # Svelte stores for state management
│   ├── utils/            # Utility functions
│   └── pocketbase.ts     # PocketBase client configuration
├── routes/               # SvelteKit routes
│   ├── login/           # Authentication pages
│   ├── signup/
│   ├── dashboard/       # Protected pages
│   └── +layout.svelte   # Global layout
└── app.html             # HTML template
```

### Key Files

- `src/lib/stores/auth.store.ts` - Authentication state management
- `src/lib/utils/validation.ts` - Zod schema definitions and validation utilities
- `src/lib/utils/security.ts` - Security utilities and rate limiting
- `src/lib/utils/auth-guards.ts` - Route protection helpers

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Type checking
npm run check

# Linting
npm run lint
```

## PocketBase Integration

### Setup Requirements

1. **PocketBase Server**: Ensure PocketBase is running on port 8090
2. **Collections**: The following collections should be configured:
   - `users` - User accounts with email/password authentication
   - Additional collections as per the data structure documentation

3. **Authentication Rules**: Configure PocketBase with appropriate authentication rules

### Environment Variables

```bash
# Required
VITE_POCKETBASE_URL=http://localhost:8090

# Optional Security Configuration
VITE_SESSION_TIMEOUT=30
VITE_LOGIN_RATE_LIMIT=5
VITE_SIGNUP_RATE_LIMIT=3
VITE_MIN_PASSWORD_LENGTH=8

# Feature Flags
VITE_ENABLE_REGISTRATION=true
VITE_ENABLE_PASSWORD_RESET=true
```

## Security Best Practices

### Implemented Security Measures

1. **Input Sanitization**: All user inputs are sanitized to prevent XSS
2. **Rate Limiting**: Client-side rate limiting for authentication attempts
3. **Password Security**: Strong password requirements and secure storage
4. **Session Security**: Automatic timeout and activity tracking
5. **HTTPS Enforcement**: Production builds enforce HTTPS
6. **Content Security Policy**: Configured for production deployment

### Password Security

- Minimum 8 characters
- Must contain uppercase and lowercase letters
- Must contain at least one number
- Must contain at least one special character
- Passwords are handled securely by PocketBase (bcrypt hashing)

## Deployment

### Production Build

```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

### Environment Configuration

For production deployment:

```bash
# Production environment variables
VITE_POCKETBASE_URL=https://your-pocketbase-domain.com
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
```

### Deployment Platforms

- **Vercel**: Zero-config deployment with automatic HTTPS
- **Netlify**: Static site hosting with form handling
- **Docker**: Container deployment with custom configuration

## Documentation

- [Frontend Architecture](./docs/frontend-architecture.md)
- [Data Structure](./docs/data-structure.md)
- [PocketBase Integration](./docs/pocketbase-integration.md)
- [User Journeys](./docs/user-journeys.md)
- [Contributing Guidelines](./docs/CONTRIBUTING.md)

## Technology Stack

- **Framework**: SvelteKit 5
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn-svelte
- **Styling**: Tailwind CSS
- **Backend**: PocketBase
- **State Management**: Svelte stores
- **Validation**: Zod (type-safe schema validation)
- **Testing**: Vitest + Svelte Testing Library

## Contributing

Please read our [Contributing Guidelines](./docs/CONTRIBUTING.md) before submitting pull requests.

## License

This project is part of the BlendSphere language learning platform.
