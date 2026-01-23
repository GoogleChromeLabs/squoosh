# How to Contribute

We'd love to accept your patches and contributions to this project. There are
just a few small guidelines you need to follow.

## Contributor License Agreement

Contributions to this project must be accompanied by a Contributor License
Agreement. You (or your employer) retain the copyright to your contribution,
this simply gives us permission to use and redistribute your contributions as
part of the project. Head over to <https://cla.developers.google.com/> to see
your current agreements on file or to sign a new one.

You generally only need to submit a CLA once, so if you've already submitted one
(even if it was for a different project), you probably don't need to do it
again.

## Code reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.

## Development Setup

### Prerequisites

- Node.js 20.16+ (see `.nvmrc`)
- npm 10+

### Getting Started

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   Or for faster HMR:
   ```bash
   npm run dev:vite
   ```

## Development Workflow

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make your changes

3. Run tests:
   ```bash
   npm test
   ```

4. Format your code:
   ```bash
   npx prettier --write .
   ```

5. Build to ensure no errors:
   ```bash
   npm run build
   ```

### Code Style

- We use Prettier for code formatting
- TypeScript strict mode is enabled
- Follow existing code patterns
- Add comments for complex logic
- Use meaningful variable names

### Writing Tests

We use Vitest for testing. Create tests in the `test/` directory:

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

Run tests:
```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:ui       # Interactive UI
```

### Testing Guidelines

- Write tests for new features
- Update tests when changing behavior
- Aim for high code coverage
- Test edge cases
- Use descriptive test names

## Project Structure

```
squoosh/
├── src/
│   ├── client/            # Client-side code
│   ├── worker-shared/     # Shared worker code
│   ├── static-build/      # Static build scripts
│   ├── features/          # Feature modules
│   ├── wordpress-integration/  # WordPress APIs
│   └── ...
├── test/                  # Test files
├── docs/                  # Documentation
├── lib/                   # Build utilities
└── codecs/               # Image codec implementations
```

## Commit Messages

Follow conventional commits:

```
feat: add new compression format
fix: resolve memory leak in worker
docs: update README with new examples
test: add tests for batch processor
chore: update dependencies
```

## Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Run the test suite** to ensure nothing breaks
4. **Format your code** with Prettier
5. **Update CHANGELOG** if applicable
6. **Fill out the PR template** with details
7. **Request review** from maintainers

### PR Checklist

- [ ] Tests pass (`npm run test:run`)
- [ ] Build succeeds (`npm run build`)
- [ ] Code is formatted (`npx prettier --write .`)
- [ ] Documentation is updated
- [ ] Commits follow conventional format
- [ ] No breaking changes (or documented)

## Reporting Bugs

Use GitHub Issues to report bugs. Include:

- **Description**: Clear description of the bug
- **Steps to reproduce**: Numbered steps to reproduce
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Browser, OS, Node version
- **Screenshots**: If applicable

## Suggesting Features

We welcome feature suggestions! Open an issue with:

- **Use case**: Why is this feature needed?
- **Proposed solution**: How should it work?
- **Alternatives**: Other solutions you considered
- **Additional context**: Any other relevant information

## Code of Conduct

Be respectful and inclusive. We want everyone to feel welcome.

## Questions?

- **Documentation**: Check README.md and docs/ folder
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions for questions

## Thank You!

Your contributions help make Squoosh better for everyone. We appreciate your time and effort! 🎉

