# Pre-commit Hooks & Code Quality Setup

This project uses pre-commit hooks to maintain code quality and prevent errors before commits. The setup follows best practices for SvelteKit projects with TypeScript.

## 🛠️ What's Included

### Pre-commit Hook

Runs automatically before each commit and performs:

- **Code formatting** with Prettier on staged files
- **Linting** with ESLint (with auto-fix) allowing up to 10 warnings
- **Quick syntax check** on staged TypeScript/Svelte files
- **No blocking** - warnings won't prevent commits but errors will

### Commit Message Hook

Enforces conventional commit format:

```
type(scope): description

Examples:
feat(auth): add user login functionality
fix: resolve navigation bug
docs: update README with setup instructions
chore: setup pre-commit hooks
```

**Valid types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`

## 📋 Manual Commands

### Formatting

```bash
npm run format              # Format all files
npm run format:check        # Check formatting without fixing
```

### Linting

```bash
npm run lint               # Lint all files
npm run lint:fix           # Lint and auto-fix issues
npm run lint:all           # Format check + lint + type check
```

### Type Checking

```bash
npm run check              # Full TypeScript type checking
```

### Testing & Validation

```bash
npm run test               # Run all tests
npm run validate           # Run complete validation pipeline
```

## 🔧 Configuration Files

- **`eslint.config.js`** - ESLint configuration with Svelte + TypeScript support
- **`.prettierignore`** - Files to exclude from formatting
- **`package.json`** - lint-staged configuration
- **`.husky/pre-commit`** - Pre-commit hook script
- **`.husky/commit-msg`** - Commit message validation

## 🚀 Features

### Intelligent Linting

- Warnings don't block commits (max 10 allowed)
- Errors are auto-fixed when possible
- Unused variables starting with `_` are ignored
- Svelte-specific rules for better DX

### Performance Optimized

- Only processes staged files
- Quick syntax checks instead of full type checking
- Excludes build outputs and dependencies

### Developer Friendly

- Clear feedback with emojis and descriptions
- Non-blocking for development workflow
- Consistent code style across team

## 🔄 Bypassing Hooks (Emergency Only)

If you absolutely need to bypass hooks:

```bash
git commit --no-verify -m "emergency fix"
```

**Note:** Only use this for hotfixes or emergency situations.

## 🐛 Troubleshooting

### Hook Permission Errors

```bash
chmod +x .husky/pre-commit .husky/commit-msg
```

### ESLint Errors

1. Run `npm run lint:fix` to auto-fix issues
2. For remaining errors, fix manually
3. Use `_` prefix for intentionally unused variables

### Type Checking Issues

```bash
npm run check  # See specific TypeScript errors
```

### Formatting Issues

```bash
npm run format  # Auto-fix all formatting
```

## 📈 Best Practices

1. **Commit often** - Small, focused commits
2. **Use conventional commits** - Helps with changelog generation
3. **Fix warnings** - Even though they don't block, keep them minimal
4. **Run checks locally** - Before pushing to avoid CI failures

## 🎯 Development Workflow

1. Make changes to your code
2. Stage files: `git add .`
3. Commit: `git commit -m "feat: add new feature"`
4. Pre-commit hooks run automatically
5. If hooks pass, commit succeeds
6. Push to remote: `git push`

The setup ensures high code quality while maintaining developer productivity!
