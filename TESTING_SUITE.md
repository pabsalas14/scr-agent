# Testing Suite - SCR Agent

Comprehensive testing implementation covering unit tests, component tests, and E2E tests.

## Overview

The testing suite includes:
- **Vitest** - Fast unit and component testing
- **React Testing Library** - React component testing
- **Playwright** - End-to-end testing

## Installation

All dependencies are already installed. To verify:

```bash
# Check installation
pnpm list @testing-library/react vitest playwright
```

## Running Tests

### Unit & Component Tests (Vitest)

```bash
# Run all tests once
pnpm -C packages/frontend test

# Run tests in watch mode (auto-rerun on file changes)
pnpm -C packages/frontend test:watch

# Run tests with coverage
pnpm -C packages/frontend test:coverage

# Run specific test file
pnpm -C packages/frontend test -- comments.service.test.ts

# Run tests matching a pattern
pnpm -C packages/frontend test -- --grep "CommentThread"
```

### End-to-End Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode (visual interface)
pnpm test:e2e:ui

# Run E2E tests in debug mode
pnpm test:e2e:debug

# Run specific test file
pnpm test:e2e tests/e2e/comments.spec.ts

# Run tests for specific browser
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox

# Run tests with headed browser (see the browser)
pnpm test:e2e --headed

# Generate HTML report
pnpm test:e2e
# Then open: playwright-report/index.html
```

## Test Structure

### File Organization

```
packages/frontend/
├── src/
│   ├── services/
│   │   ├── comments.service.ts
│   │   └── comments.service.test.ts
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── CommentThread.tsx
│   │   │   └── CommentThread.test.tsx
│   └── test/
│       └── setup.ts          # Test configuration
├── vitest.config.ts
└── package.json

tests/
├── e2e/
│   ├── comments.spec.ts      # E2E tests for comments
│   └── fixtures/             # Test data and utilities
└── fixtures.ts               # Global test utilities

playwright.config.ts           # Playwright configuration
```

## Test Types

### 1. Unit Tests (Services)

Location: `src/services/*.service.test.ts`

Tests service layer logic:
- API calls (mocked)
- Data transformation
- Error handling
- Business logic

Example: `comments.service.test.ts`
```typescript
describe('CommentsService', () => {
  describe('createComment', () => {
    it('should create a comment with mentions', async () => {
      // Test implementation
    });
  });
});
```

**Run:**
```bash
pnpm -C packages/frontend test -- comments.service.test.ts
```

### 2. Component Tests (React Testing Library)

Location: `src/components/**/*.test.tsx`

Tests React components:
- Rendering
- User interactions
- Event handlers
- State management
- Props passing

Example: `CommentThread.test.tsx`
```typescript
describe('CommentThread', () => {
  it('should display existing comments', async () => {
    render(<CommentThread findingId="finding-123" />);
    await waitFor(() => {
      expect(screen.getByText('First comment')).toBeInTheDocument();
    });
  });
});
```

**Run:**
```bash
pnpm -C packages/frontend test -- CommentThread.test.tsx
```

### 3. E2E Tests (Playwright)

Location: `tests/e2e/*.spec.ts`

Tests full user workflows:
- Navigation
- User interactions across pages
- Real API calls
- WebSocket events
- Cross-browser compatibility

Example: `comments.spec.ts`
```typescript
test('should allow adding a comment', async ({ page }) => {
  const commentInput = page.locator('input[placeholder*="comentario"]');
  await commentInput.fill('Test comment');
  // ... more interactions
});
```

**Run:**
```bash
pnpm test:e2e
```

## Configuration Files

### vitest.config.ts
```typescript
- globals: true           // Use global test APIs (describe, it, expect)
- environment: jsdom      // Browser-like environment
- setupFiles: setup.ts    // Test initialization
- coverage provider: v8   // Code coverage tracking
```

### playwright.config.ts
```typescript
- baseURL: localhost:5173        // Frontend URL
- projects: chromium, firefox    // Browsers to test
- reporter: html                 // HTML report generation
- retries: 2 (CI), 0 (local)    // Retry failed tests
```

### test/setup.ts
```typescript
- Import testing libraries
- Mock localStorage
- Mock window.matchMedia
- Global test utilities
```

## Writing Tests

### Service Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { myService } from './my.service';

describe('MyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    const result = await myService.doSomething('input');
    expect(result).toBeDefined();
  });
});
```

### Component Test Template

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render and interact', async () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');

    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Expected text')).toBeInTheDocument();
    });
  });
});
```

### E2E Test Template

```typescript
import { test, expect, Page } from '@playwright/test';

test.describe('Feature', () => {
  test('should perform user workflow', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="field"]', 'value');
    await page.click('button:has-text("Submit")');

    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

## Coverage Reports

Generate coverage reports:

```bash
pnpm -C packages/frontend test:coverage
```

Coverage HTML report location:
```
packages/frontend/coverage/index.html
```

### Coverage Thresholds

The test suite aims for:
- **Statements**: 70%+
- **Branches**: 65%+
- **Functions**: 70%+
- **Lines**: 70%+

## Debugging Tests

### Vitest Debug

```bash
# Run tests in watch mode with UI
pnpm -C packages/frontend test -- --ui

# Debug specific file
node --inspect-brk ./node_modules/.bin/vitest packages/frontend/src/services/comments.service.test.ts
```

### Playwright Debug

```bash
# Run with headed browser (see what's happening)
pnpm test:e2e --headed

# Debug mode (interactive)
pnpm test:e2e:debug

# Generate trace for failed test
pnpm test:e2e
# Inspect: tests/test-results/*/trace.zip
```

### Browser DevTools

In Playwright tests, open DevTools:
```typescript
await page.pause();  // Pause execution, open DevTools
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test              # Unit/component tests
      - run: pnpm test:coverage     # Coverage reports
      - run: pnpm test:e2e          # E2E tests
```

## Common Issues

### Tests Fail with "Cannot find module"

**Solution:** Make sure modules are properly mocked in `test/setup.ts`

### Playwright Tests Timeout

**Solution:** Increase timeout in `playwright.config.ts`:
```typescript
use: {
  navigationTimeout: 30000,
  actionTimeout: 10000,
}
```

### Socket.io Mock Issues

**Solution:** Mock socket events in setup:
```typescript
vi.mock('../../hooks/useSocketEvents', () => ({
  useSocketEvents: vi.fn(),
}));
```

## Best Practices

1. **Test Naming**: Use descriptive names
   ```typescript
   ✅ it('should display comments when loading succeeds')
   ❌ it('loads data')
   ```

2. **Assertions**: Be specific
   ```typescript
   ✅ expect(result.id).toBe('comment-123')
   ❌ expect(result).toBeTruthy()
   ```

3. **Async Operations**: Always wait
   ```typescript
   ✅ await waitFor(() => expect(element).toBeVisible())
   ❌ expect(element).toBeVisible()  // May fail
   ```

4. **User Events**: Use userEvent, not fireEvent
   ```typescript
   ✅ await userEvent.click(button)
   ❌ fireEvent.click(button)
   ```

5. **Test Isolation**: Each test should be independent
   ```typescript
   ✅ beforeEach(() => vi.clearAllMocks())
   ❌ Sharing state between tests
   ```

## Test Coverage for Comments Feature

### Services
- ✅ `comments.service.test.ts` - Service methods
  - createComment
  - getComments
  - deleteComment
  - getUnreadMentions
  - markMentionsAsRead

### Components
- ✅ `CommentThread.test.tsx` - UI component
  - Rendering
  - Adding comments
  - Displaying mentions
  - Deleting comments (own comments only)
  - Socket event handling

### E2E
- ✅ `comments.spec.ts` - Full workflow
  - Comment creation
  - Mention detection
  - Real-time updates
  - Performance testing
  - Accessibility testing

## Next Steps

1. **Expand Coverage**: Add tests for other features
   - Findings management
   - Analysis lifecycle
   - User authentication
   - Dashboard components

2. **Performance Testing**: Add performance E2E tests
   - Load time benchmarks
   - Memory usage
   - Network optimization

3. **Visual Testing**: Add visual regression tests
   - Snapshot testing
   - Cross-browser visual comparison

4. **Accessibility Testing**: Expand a11y tests
   - ARIA labels
   - Keyboard navigation
   - Screen reader compatibility

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## Questions?

For test-related questions:
1. Check test examples in the codebase
2. Refer to documentation links above
3. Run tests with `--ui` flag for visual debugging
4. Use `--debug` mode for interactive testing
