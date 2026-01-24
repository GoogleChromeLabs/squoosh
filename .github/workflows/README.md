# GitHub Actions Workflows

This directory contains the CI/CD workflows for the Squoosh project.

## Workflows

### 1. Node.js CI (`node.js.yml`)

**Trigger:** Push and Pull Request events

**Purpose:** Main CI workflow that builds, tests, and validates the codebase.

**Steps:**

- Checkout code
- Setup Node.js (multiple versions: 20.x, 22.x)
- Install dependencies
- Run TypeScript type checking
- Build the project
- Run tests
- Generate test coverage reports
- Archive build artifacts

**Artifacts:**

- `build-output`: Compiled build files
- `coverage-report`: Test coverage reports

**Matrix:**

- OS: Ubuntu, Windows
- Node versions: 20.x, 22.x

---

### 2. Image Compression Tests (`image-compression-test.yml`)

**Trigger:**

- Push to main/develop branches
- Pull requests to main
- Manual workflow dispatch

**Purpose:** Test image compression functionality with real images and generate quality metrics.

**Steps:**

- Setup environment
- Build project
- Create or download test images
- Run compression tests
- Generate metrics report
- Upload results as artifacts
- Post results as PR comment

**Test Images:**

- `test-photo.jpg`: Sample photograph (~2MB)
- `test-graphic.png`: Sample graphic (~500KB)
- `test-small.jpg`: Small image (~100KB)
- `test-large.jpg`: Large image (~5MB)

**Artifacts:**

- `compression-results`: Compression test results and metrics

**Quality Gates:**

- Compression ratio validation
- Processing time limits
- Visual quality checks (when implemented)

---

### 3. Performance Benchmark (`benchmark.yml`)

**Trigger:**

- Weekly schedule (Monday at 00:00 UTC)
- Push to main branch
- Manual workflow dispatch

**Purpose:** Track performance metrics over time and detect regressions.

**Steps:**

- Build project
- Run performance benchmarks
- Compare with baseline
- Store new baseline (on main branch)
- Generate trend reports
- Alert on regressions

**Metrics Tracked:**

- Build time
- Bundle size
- Compression speed by format
- Memory usage (future)
- CPU utilization (future)

**Artifacts:**

- `benchmark-results`: Performance benchmark data

---

## Interpreting Results

### Build Status

The Node.js CI workflow provides the main build status:

- ✅ Green: All builds and tests passed
- ❌ Red: Build or tests failed
- 🟡 Yellow: Workflow still running

### Test Coverage

Coverage reports are generated for the Ubuntu + Node 20.x combination:

- View in the `coverage-report` artifact
- Look for files in `coverage/index.html`

### Compression Metrics

When compression tests run, check the PR comment or workflow summary for:

- Compression ratios by format
- Processing times
- Quality metrics (SSIM, PSNR when available)

### Performance Benchmarks

Benchmark results show:

- Current performance metrics
- Comparison with baseline
- Trend analysis (after multiple runs)
- Regression alerts

---

## Adding New Test Images

To add new test images for compression testing:

1. **Add the image file:**

   ```bash
   cp your-image.jpg test/fixtures/images/
   ```

2. **Update the image README:**
   Edit `test/fixtures/images/README.md` to document the new image

3. **Update .gitattributes:**
   If it's a binary format not already listed:

   ```
   test/fixtures/images/*.your-format binary
   ```

4. **Update the workflow:**
   Edit `.github/workflows/image-compression-test.yml` to include the new image in tests

---

## Running Workflows Locally

### Node.js CI

```bash
# Install dependencies
npm ci

# Type check
npx tsc --noEmit

# Build
npm run build

# Run tests
npm run test:run

# Generate coverage
npm run test:run -- --coverage
```

### Image Compression Tests

```bash
# Create test images (requires ImageMagick)
mkdir -p test/fixtures/images
convert -size 800x600 plasma: test/fixtures/images/test-photo.jpg

# Run integration tests
npm run test:run test/integration/compression.test.ts
```

### Performance Benchmarks

```bash
# Build project
npm run build

# Run benchmarks (when implemented)
# npm run benchmark
```

---

## Troubleshooting

### Tests Failing in CI but Passing Locally

- Check Node.js version compatibility
- Verify environment variables are set correctly
- Check for timing issues in tests
- Review logs in the Actions tab

### Compression Tests Not Running

- Verify test images exist in `test/fixtures/images/`
- Check ImageMagick is available in CI (for image generation)
- Review the workflow logs for error messages

### Benchmark Baseline Missing

- First run on main branch will establish baseline
- Baseline is stored in `benchmark/baseline/`
- Re-run workflow to establish new baseline if needed

---

## Best Practices

1. **Always run tests locally before pushing**
2. **Keep test images small** (under 5MB each)
3. **Document any new metrics** added to benchmarks
4. **Review coverage reports** for new code
5. **Monitor benchmark trends** for performance regressions

---

## CI/CD Pipeline Diagram

```
Push/PR
   │
   ├─→ Node.js CI
   │   ├─→ Type Check
   │   ├─→ Build
   │   ├─→ Test
   │   └─→ Coverage
   │
   ├─→ Image Compression Tests
   │   ├─→ Generate Test Images
   │   ├─→ Run Compression
   │   ├─→ Measure Metrics
   │   └─→ Report Results
   │
   └─→ Performance Benchmark (weekly/main)
       ├─→ Run Benchmarks
       ├─→ Compare Baseline
       ├─→ Detect Regressions
       └─→ Update Baseline
```

---

## Future Enhancements

- [ ] Add E2E tests with Playwright
- [ ] Implement visual regression testing
- [ ] Add Docker container builds
- [ ] Set up automatic deployment
- [ ] Add security scanning (CodeQL, Snyk)
- [ ] Implement performance budgets
- [ ] Add accessibility testing
