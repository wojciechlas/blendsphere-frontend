# Contributing to BlendSphere Frontend

Thank you for your interest in contributing to BlendSphere! This document provides guidelines and instructions for contributing to the frontend repository.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

Please be respectful and inclusive in all interactions related to this project. We value diverse perspectives and aim to foster a welcoming community.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/blendsphere-frontend.git
   cd blendsphere-frontend
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/wojciechlas/blendsphere-frontend.git
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

1. Make your changes in your branch
2. Run tests and linting:
   ```bash
   npm run check      # Type checking
   npm run lint       # ESLint check
   npm run test       # Run tests if available
   ```
3. Preview your changes:
   ```bash
   npm run dev
   ```
4. Commit your changes following the commit message guidelines

## Pull Request Process

1. Ensure your branch is up to date with the upstream main branch:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
3. Create a Pull Request through the GitHub interface
4. Fill out the PR template completely
5. Request a review from maintainers
6. Address any feedback from reviewers
7. Once approved, your PR will be merged

## Coding Standards

We use several tools to maintain code quality:

- **TypeScript**: Use proper typing for all code
- **ESLint**: For code style and quality checks
- **Prettier**: For consistent formatting
- **Husky & lint-staged**: For pre-commit hooks

Your code should:

- Follow the existing style of the codebase
- Include proper TypeScript types
- Use Svelte's best practices
- Be well-commented for complex logic
- Include proper error handling

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types include:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Example:

```
feat(flashcards): add spaced repetition algorithm

Implements the SM-2 algorithm for flashcard scheduling
Based on research from https://example.com/sm2-algorithm

Closes #123
```

## Testing Guidelines

- Write tests for all new features and bug fixes
- Ensure existing tests pass with your changes
- Follow the existing testing patterns in the codebase
- Aim for good coverage of critical functionality

## Documentation

- Update documentation for any changed functionality
- Document new components, utilities, or features
- Include JSDoc comments for functions and methods
- Update the README.md if necessary
- Consider creating diagrams for complex workflows (see docs/generate-diagrams.sh)

Thank you for contributing to BlendSphere!
