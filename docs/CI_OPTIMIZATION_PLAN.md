# CI Optimization Plan - Priority 4

## Current State

**Total CI Time** (worst case):
```
quality:              ~5-8 min
├─ ios-fast-regression: ~3-5 min (waits for quality)
│  └─ ios-xctest-suite: ~20-30 min (waits for ios-fast-regression)
├─ android-build:       ~10-15 min (waits for quality)
└─ web-e2e:            ~3-5 min (parallel, no deps)

Total: ~41-58 minutes (sequential path: quality → ios-fast → ios-xctest)
```

## Optimization Opportunities

### 1. Add Missing Caches (Quick Win)

**CocoaPods Cache**:
- Currently: `pod install` runs every time (~3-5 min)
- With cache: ~30 seconds on cache hit
- **Savings**: ~2-4 min per iOS job

**Playwright Browser Cache**:
- Currently: `npx playwright install chromium --with-deps` (~30-60s)
- With cache: ~5 seconds
- **Savings**: ~25-55 seconds

**Implementation**: 5 minutes
**Impact**: Medium (2-5 min savings)

### 2. Parallel Test Execution (High Impact)

**Current**: iOS XCTest suite runs 3 configurations sequentially
```
FastRegression  → LocalAuthE2E → Accessibility
   (~8 min)         (~12 min)      (~5 min)
Total: ~25 min
```

**Optimized**: Run in parallel using matrix strategy
```
FastRegression ┐
LocalAuthE2E   ├─ All run simultaneously
Accessibility  ┘
Total: ~12 min (longest job)
```

**Savings**: ~13 minutes
**Trade-off**: Uses 3 self-hosted runner slots instead of 1

**Implementation**: 15 minutes
**Impact**: High (13 min savings)

### 3. Dependency Installation Optimization (Medium Impact)

**Current**: `pnpm install` runs 4 times
- quality: 2-3 min
- android-build: 2-3 min
- web-e2e: 2-3 min
- ios-xctest-suite: 2-3 min

**Option A**: Shared workspace artifact
- Upload `node_modules/` after quality job
- Download in dependent jobs
- **Trade-off**: Large artifact (~500MB+), slow upload/download

**Option B**: Keep as-is with pnpm cache
- Current approach is already good
- pnpm's cache is very effective
- **Recommendation**: No change needed

**Implementation**: N/A
**Impact**: Low (current approach is optimal)

### 4. API Test Isolation (New Addition)

**Current**: API E2E tests (`packages/api/e2e/`) not in CI

**Proposed**: Add API E2E job
```yaml
api-e2e:
  runs-on: ubuntu-latest
  timeout-minutes: 10
  services:
    postgres:
      image: postgres:15
    redis:
      image: redis:7
```

**Implementation**: 20 minutes
**Impact**: High (adds test coverage)

## Recommended Optimizations (Prioritized)

### Phase 1: Quick Wins (30 min implementation)
1. ✅ Add CocoaPods cache
2. ✅ Add Playwright browser cache
3. ✅ Add API E2E job to CI

**Expected Savings**: ~3-5 min per run
**Risk**: Low

### Phase 2: Parallel iOS Tests (15 min implementation)
1. ✅ Split ios-xctest-suite into 3 parallel jobs using matrix

**Expected Savings**: ~13 min
**Risk**: Medium (requires self-hosted runner capacity)
**Consideration**: Check if self-hosted runner can handle 3 simultaneous jobs

### Phase 3: Advanced (Future)
1. ⏭️ Test result caching (skip unchanged tests)
2. ⏭️ Distributed test execution
3. ⏭️ Build caching for Android/iOS

## Estimated Impact

**Before Optimization**:
- Total CI time: 41-58 minutes
- iOS XCTest suite: ~25 minutes
- Cache misses: 2-5 minutes wasted

**After Phase 1 + Phase 2**:
- Total CI time: 25-35 minutes (-16-23 min / ~40% faster)
- iOS XCTest suite: ~12 minutes (parallel)
- Cache hits: ~2-4 min savings

## Implementation Order

1. **Add caches** (safest, immediate benefit)
2. **Add API E2E** (increases coverage)
3. **Parallelize iOS tests** (biggest time savings)

---

**Status**: Ready to implement
**Next Step**: Start with Phase 1 optimizations
