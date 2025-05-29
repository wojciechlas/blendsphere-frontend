# GitHub Copilot Pull Request Instructions for BlendSphere Frontend

Follow these instructions when creating or reviewing pull requests for the BlendSphere language learning application.

## PR Creation Requirements

### Title Format

Use this exact format for PR titles:

```
[type]: brief description of changes

Examples:
feat: add flashcard generation with AI integration
fix: resolve memory leak in spaced repetition system
refactor: migrate auth components to Svelte 5 runes
docs: update API integration guidelines
```

### Required PR Labels

Apply these labels based on change type:

- `feature` - New functionality
- `bugfix` - Bug fixes
- `performance` - Performance improvements
- `security` - Security-related changes
- `accessibility` - Accessibility improvements
- `breaking-change` - Breaking changes
- `ai-integration` - AI/FastAPI related changes
- `ui-components` - shadcn-svelte component changes

### Description Template Requirements

Always include these sections:

#### Problem Statement

```markdown
## Problem

- What issue does this PR solve?
- What user pain point is addressed?
- Link to related GitHub issue or discussion
```

#### Solution Overview

```markdown
## Solution

- High-level approach taken
- Key technical decisions made
- Alternative approaches considered
```

#### Implementation Details

```markdown
## Technical Changes

- **Frontend**: List component/page changes
- **Backend Integration**: PocketBase/FastAPI changes
- **State Management**: Store updates
- **Types**: New/modified TypeScript interfaces
- **Testing**: Test coverage additions
```

## BlendSphere-Specific Checklist

### Security Requirements

- [ ] User input is properly validated and sanitized
- [ ] Authentication checks are in place for protected routes
- [ ] No sensitive data exposed in client-side code
- [ ] CORS policies properly configured for API calls
- [ ] Form submissions include CSRF protection

### Performance Requirements

- [ ] Bundle size impact analyzed (include metrics)
- [ ] Svelte 5 runes used correctly ($state, $derived, $effect)
- [ ] No unnecessary re-renders or memory leaks
- [ ] Large datasets use virtual scrolling or pagination
- [ ] Images optimized and lazy-loaded where appropriate

### AI Integration Requirements

- [ ] FastAPI calls properly separated from PocketBase calls
- [ ] AI service errors handled gracefully with user feedback
- [ ] Loading states shown during AI operations
- [ ] AI responses validated before processing
- [ ] Fallback behavior defined for AI service failures

### Accessibility Requirements

- [ ] All interactive elements have proper ARIA labels
- [ ] Keyboard navigation works correctly
- [ ] Screen reader announcements implemented
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus management handles modal/dialog interactions

### TypeScript Requirements

- [ ] No `any` types used (strict typing enforced)
- [ ] All props interfaces properly defined
- [ ] API response types match backend contracts
- [ ] Error types properly typed and handled
- [ ] Generic types used where appropriate for reusability

### Testing Requirements

- [ ] Unit tests written for new components/functions
- [ ] Integration tests cover API interactions
- [ ] Accessibility tests included for UI changes
- [ ] Error scenarios tested (network failures, invalid data)
- [ ] Performance tests for optimization claims

### UI/UX Requirements

- [ ] shadcn-svelte components used consistently
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Dark mode compatibility maintained
- [ ] Loading states and error messages user-friendly
- [ ] Form validation provides clear feedback

## Code Quality Validation

### Automated Checks Required

Before submitting PR, ensure these pass:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format:check

# Unit tests
npm run test:unit

# Build verification
npm run build

# Security audit
npm audit --audit-level moderate
```

### Manual Review Points

- [ ] Code follows established patterns in the codebase
- [ ] Component architecture is logical and maintainable
- [ ] Error handling is comprehensive and user-friendly
- [ ] Performance optimizations don't compromise readability
- [ ] Documentation updated for API changes

## Backend Integration Validation

### PocketBase Integration

- [ ] Service layer properly abstracts PocketBase calls
- [ ] Proper error handling for network/auth failures
- [ ] Query optimization for performance
- [ ] Data transformations maintain type safety
- [ ] Real-time subscriptions cleaned up properly

### FastAPI Integration

- [ ] AI service calls isolated from core application logic
- [ ] Proper retry mechanisms for AI service timeouts
- [ ] Request/response validation implemented
- [ ] Loading states during AI processing
- [ ] Graceful degradation when AI service unavailable

## UI Component Guidelines

### shadcn-svelte Component Usage

- [ ] Components imported from established index files
- [ ] Props passed correctly with TypeScript validation
- [ ] Custom variants follow existing patterns
- [ ] Accessibility props included (aria-label, role, etc.)
- [ ] Component composition over customization

### Form Handling Standards

- [ ] Superforms integration with proper validation schemas
- [ ] Error messages displayed clearly to users
- [ ] Form submission states handled (loading, success, error)
- [ ] Keyboard navigation and screen reader support
- [ ] CSRF protection implemented

## Review Process Requirements

### Required Reviewers

- **Security Changes**: Require security team review
- **Performance Changes**: Include performance metrics
- **AI Integration**: AI team review for FastAPI changes
- **Accessibility**: Include accessibility audit
- **Breaking Changes**: Architecture team approval

### Review Checklist for Reviewers

- [ ] Code follows BlendSphere coding standards
- [ ] Security implications assessed and addressed
- [ ] Performance impact measured and acceptable
- [ ] Accessibility requirements met
- [ ] Test coverage adequate for changes
- [ ] Documentation updated appropriately

## Deployment Considerations

### Environment Testing

- [ ] Changes tested in development environment
- [ ] Staging deployment verified (if applicable)
- [ ] Database migrations included (if needed)
- [ ] Environment variables documented
- [ ] Feature flags configured (if applicable)

### Rollback Plan

- [ ] Rollback procedure documented
- [ ] Database migration rollback tested
- [ ] Feature flag fallback available
- [ ] Monitoring alerts configured
- [ ] Incident response plan updated

## Documentation Requirements

### Code Documentation

- [ ] JSDoc comments for complex functions
- [ ] README updates for new features
- [ ] API documentation updated
- [ ] Component prop documentation
- [ ] Type definitions documented

### User Documentation

- [ ] User-facing changes documented
- [ ] Teacher/student workflow updates
- [ ] Configuration changes documented
- [ ] Troubleshooting guides updated
- [ ] Release notes prepared

## Merge Criteria

### Automated Requirements

All these must pass before merge:

- ✅ CI/CD pipeline successful
- ✅ All tests passing
- ✅ Code coverage threshold met
- ✅ Security scan passed
- ✅ Bundle size within limits
- ✅ Type checking successful
- ✅ Linting passed

### Manual Requirements

- ✅ At least 2 approved reviews
- ✅ Security review (if applicable)
- ✅ UX review (for UI changes)
- ✅ Product review (for feature changes)
- ✅ All conversations resolved
- ✅ Documentation complete

## Post-Merge Actions

### Immediate Actions

- [ ] Verify deployment successful
- [ ] Monitor error rates and performance
- [ ] Validate feature functionality in production
- [ ] Update project documentation
- [ ] Close related issues

### Follow-up Actions

- [ ] Gather user feedback (if user-facing)
- [ ] Performance monitoring for 48 hours
- [ ] Security monitoring for unusual activity
- [ ] Update team knowledge base
- [ ] Plan future iterations based on learnings

## Emergency Procedures

### Hotfix Process

For critical issues requiring immediate deployment:

1. Create hotfix branch from main
2. Implement minimal fix with tests
3. Fast-track review process (1 reviewer minimum)
4. Deploy with immediate monitoring
5. Follow up with comprehensive fix in regular PR

### Rollback Triggers

Automatic rollback if:

- Error rate increases >5%
- Performance degrades >20%
- Security vulnerability detected
- Critical accessibility regression
- AI service failures >50%

## Templates for Common PR Types

### Feature Addition Template

```markdown
## Feature: [Feature Name]

**User Story**: As a [user type], I want [goal] so that [benefit]

**Implementation**:

- Component: [component changes]
- Service: [API integration]
- State: [state management]
- Tests: [test coverage]

**Verification**:

- [ ] Feature works as designed
- [ ] Error cases handled
- [ ] Performance acceptable
- [ ] Accessibility compliant
```

### Bug Fix Template

```markdown
## Bug Fix: [Issue Description]

**Problem**: [Detailed problem description]
**Root Cause**: [What caused the issue]
**Solution**: [How it's fixed]
**Prevention**: [How to prevent similar issues]

**Testing**:

- [ ] Bug reproduction verified
- [ ] Fix resolves issue
- [ ] Regression tests added
- [ ] Related scenarios tested
```

### Performance Optimization Template

```markdown
## Performance: [Optimization Description]

**Before**: [Performance metrics before]
**After**: [Performance metrics after]
**Improvement**: [Percentage/time improvement]

**Changes Made**:

- [List of optimizations]

**Verification**:

- [ ] Performance tests show improvement
- [ ] No functionality regressions
- [ ] Memory usage optimized
- [ ] Bundle size impact acceptable
```
