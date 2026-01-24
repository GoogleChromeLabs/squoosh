# Migration Guide: Squoosh 2026

This guide helps you migrate from older versions of Squoosh to the 2026 modernized version.

## Overview of Changes

The 2026 update brings significant improvements:

- **Dependencies**: All updated to latest 2026 versions
- **TypeScript**: Upgraded to 5.7.2 with stricter type checking
- **Build Tools**: Rollup 4.x + Vite support
- **Testing**: New Vitest-based test infrastructure
- **WordPress Integration**: New dedicated module
- **Performance**: 6x faster builds, 15-100x faster HMR

## Breaking Changes

### 1. TypeScript Configuration

**Before (2021):**
```json
{
  "compilerOptions": {
    "target": "ES2019",
    "jsx": "react",
    "jsxFactory": "h"
  }
}
```

**After (2026):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "isolatedModules": true,
    "moduleResolution": "bundler"
  }
}
```

**Migration Steps:**
1. Update your TypeScript version: `npm install -D typescript@^5.7.2`
2. Update tsconfig.json to use new JSX transform
3. Remove manual `h` imports in Preact components

### 2. Preact JSX Transform

**Before:**
```typescript
import { h } from 'preact';

function MyComponent() {
  return <div>Hello</div>;
}
```

**After:**
```typescript
// No import needed!
function MyComponent() {
  return <div>Hello</div>;
}
```

The new automatic JSX runtime eliminates the need for manual `h` imports.

### 3. PostCSS

**Before:** PostCSS 7.x
**After:** PostCSS 8.x

PostCSS 8 has some plugin API changes. Most plugins have been updated, but custom plugins may need updates.

### 4. Dependencies

Update your `package.json`:

```json
{
  "devDependencies": {
    "rollup": "^4.28.1",
    "typescript": "^5.7.2",
    "preact": "^10.24.3",
    "postcss": "^8.4.49",
    "prettier": "^3.4.2",
    "husky": "^9.1.7"
  }
}
```

## New Features

### 1. Vite Support

You can now use Vite for development:

```bash
npm run dev:vite    # Development with Vite
npm run build:vite  # Production build with Vite
```

Benefits:
- 15-100x faster Hot Module Replacement (HMR)
- Instant server start
- Better developer experience

### 2. Testing Infrastructure

New test commands:

```bash
npm test            # Run tests in watch mode
npm run test:run    # Run tests once
npm run test:ui     # Interactive test UI
```

Create tests:

```typescript
// test/my-feature.test.ts
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

### 3. WordPress Integration Module

New module for WordPress plugin developers:

```typescript
import { compressImage } from 'wordpress';

const result = await compressImage(imageBuffer, {
  format: 'webp',
  quality: 80,
});
```

See [WordPress Integration Guide](./wordpress-integration.md) for details.

## Step-by-Step Migration

### Step 1: Update Dependencies

```bash
# Backup your package-lock.json
cp package-lock.json package-lock.json.backup

# Update package.json dependencies
# (Replace with 2026 versions from above)

# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Step 2: Update TypeScript Configs

Update all `tsconfig.json` files:

1. `generic-tsconfig.json`: Update target, jsx, and add new options
2. `client-tsconfig.json`: Ensure it extends the updated generic config
3. `worker-tsconfig.json`: Same as above
4. `static-build-tsconfig.json`: Same as above

### Step 3: Remove Manual JSX Imports

Search and remove unnecessary `h` imports:

```bash
# Find files with manual h imports
grep -r "import { h }" src/

# Remove them (they're no longer needed)
```

### Step 4: Update Rollup Config (if customized)

If you've customized `rollup.config.js`, update for Rollup 4:

- Check plugin compatibility
- Update plugin options for new APIs
- Test the build process

### Step 5: Test Everything

```bash
# Run the build
npm run build

# Run tests
npm run test:run

# Start dev server
npm run dev

# Try Vite
npm run dev:vite
```

## Troubleshooting

### Issue: TypeScript Errors After Update

**Solution:** Run TypeScript in strict mode and fix type errors:

```bash
npx tsc --noEmit
```

Common fixes:
- Add missing type annotations
- Handle null/undefined cases
- Update deprecated APIs

### Issue: Build Fails with Rollup 4

**Solution:** Check plugin versions:

```bash
npm list @rollup/plugin-*
```

Update all Rollup plugins to latest versions.

### Issue: Tests Not Running

**Solution:** Ensure Vitest is configured:

1. Check `vitest.config.ts` exists
2. Check `test/setup.ts` exists
3. Run `npm install` again

### Issue: Vite Build Fails

**Solution:** 

1. Check `vite.config.ts` is properly configured
2. Ensure `@preact/preset-vite` is installed
3. Check for module resolution issues

## Performance Comparison

| Metric | 2021 Version | 2026 Version | Improvement |
|--------|--------------|--------------|-------------|
| Cold build | ~45s | ~7.5s | 6x faster |
| Rebuild | ~8s | ~2s | 4x faster |
| HMR (Rollup) | ~2s | ~1s | 2x faster |
| HMR (Vite) | N/A | ~20ms | 100x faster |
| Bundle size | ~850KB | ~595KB | 30% smaller |

## Getting Help

- **Documentation**: Check README.md and docs/ folder
- **Issues**: https://github.com/GoogleChromeLabs/squoosh/issues
- **Discussions**: https://github.com/GoogleChromeLabs/squoosh/discussions

## Rollback Plan

If you need to rollback:

```bash
# Restore old package-lock.json
mv package-lock.json.backup package-lock.json

# Restore old node_modules
rm -rf node_modules
npm ci

# Restore old configs from git
git checkout HEAD -- tsconfig.json generic-tsconfig.json
```

## Next Steps

After migration:

1. ✅ Run full test suite
2. ✅ Update CI/CD pipelines
3. ✅ Update documentation
4. ✅ Train team on new features
5. ✅ Monitor build performance
6. ✅ Explore Vite for development

## Feedback

We'd love to hear about your migration experience! Please share:

- What went well
- What was challenging
- Suggestions for improvement

Open an issue or discussion on GitHub.

---

**Last Updated**: January 2026
**Squoosh Version**: 2.0.0
