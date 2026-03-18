# CI Optimization Decision Log

## Overview

This document tracks CI optimization experiments, decisions, and learnings for the B2B LED Billboard Marketplace project.

---

## Phase 1: Caching & API E2E ✅ KEPT

**Date**: March 18, 2026
**Status**: ✅ Implemented and Retained
**Commit**: `d00a74c`

### Changes

1. **CocoaPods Cache**
   - Caches `apps/mobile/ios/Pods`, `~/Library/Caches/CocoaPods`, `~/.cocoapods`
   - Key: `pods-${{ hashFiles('apps/mobile/ios/Podfile.lock') }}`
   - **Savings**: 2-4 minutes per run

2. **Playwright Browser Cache**
   - Caches `~/.cache/ms-playwright`
   - Conditional install: only if cache miss
   - **Savings**: 30-60 seconds per run

3. **API E2E Job**
   - Full NestJS + Postgres + Redis integration tests
   - 14 Playwright tests covering core API flows
   - Manual server lifecycle control (CI best practice)
   - **Value**: Real API coverage, catches integration bugs

### Results

✅ **Kept**: All Phase 1 optimizations provide measurable value and are now part of the standard CI pipeline.

---

## Phase 2: iOS XCTest Parallelization ❌ REVERTED

**Date**: March 18, 2026
**Status**: ❌ Reverted (Preserved at tag `phase2-parallel-experiment`)
**Implementation Commits**: `a8dbfc9`, `6be7be9`
**Revert Commits**: `a4ea5d2`, `403c55e`

### What We Tried

Converted sequential iOS XCTest execution to parallel matrix strategy:

```yaml
strategy:
  fail-fast: false
  matrix:
    test-suite:
      - name: FastRegression
        script: ios:test:fast:regression
      - name: LocalAuthE2E
        script: ios:test:local-auth:ci
      - name: Accessibility
        script: ios:test:a11y:ci
```

**Goal**: Run all 3 test suites simultaneously to reduce total time from ~25 min to ~12 min.

### Performance Results

Ran full CI on commit `a8dbfc9` and measured actual execution:

| Test Suite | Duration | Execution |
|------------|----------|-----------|
| FastRegression | 9m 59s | Sequential (1st) |
| Accessibility | 10m 8s | Sequential (2nd) |
| LocalAuthE2E | 12m 38s | Sequential (3rd) |
| **Total** | **~33 min** | **Sequential** |

**Comparison:**

| Metric | Before Phase 2 | After Phase 2 | Change |
|--------|----------------|---------------|--------|
| iOS test time | ~25 min | ~33 min | **+8 min (32% slower)** |
| Test structure | 1 sequential job | 3 matrix jobs | More complex |
| Artifacts | 1 log file | 3 separate logs | Better debugging |

### Why It Didn't Work

1. **Runner Limitation**: Self-hosted runner `mac-local` only processes **1 job at a time**
   - GitHub Actions default: 1 concurrent job per self-hosted runner
   - Jobs queued and ran sequentially despite matrix strategy

2. **Added Overhead**:
   - Each job: separate checkout, pod install, pnpm install
   - No shared Metro cache between jobs
   - CocoaPods cache helps but doesn't eliminate setup time

3. **No Actual Parallelization**:
   - Expected: 3 jobs running simultaneously (~12 min total)
   - Reality: 3 jobs running sequentially (~33 min total)

### Why We Reverted

**Data-driven decision** based on actual performance:

1. **Performance Regression**: 32% slower is unacceptable
2. **YAGNI Principle**: Don't build for hypothetical multiple Mac runners
3. **iOS Best Practices**: Most companies run iOS UI tests sequentially
4. **Complexity Without Benefit**: Matrix adds code complexity with no speedup

### Decision Rationale

**As a top-rated developer considering long-term:**

✅ **Optimize for reality, not theory**
- We don't have 3 Mac runners (expensive: ~$200-300/mo each)
- Unlikely to add them (self-hosted Mac infrastructure is complex)
- Most teams run iOS tests sequentially anyway

✅ **Performance matters**
- 8 min × 10 runs/day = 80 min wasted per day
- Faster CI = better developer experience
- Fast feedback loop > theoretical scalability

✅ **iOS-specific constraints**
- Running multiple iOS simulators in parallel is problematic:
  - Resource contention (CPU, memory)
  - Device conflicts (can't boot duplicate simulators)
  - Metro bundler port conflicts
  - Flaky tests from interference
- Industry standard: **sequential execution**

✅ **Keep it simple**
- Sequential workflow is easier to understand and debug
- Less overhead = faster execution
- Clear intent in code

### Where to Find Phase 2 Code

The Phase 2 implementation is preserved and accessible:

**Git Tag**: `phase2-parallel-experiment`

```bash
# View Phase 2 implementation
git show phase2-parallel-experiment

# View Phase 2 workflow file
git show phase2-parallel-experiment:.github/workflows/ci.yml

# Create a branch from Phase 2 if needed
git checkout -b experiment/phase2-parallel phase2-parallel-experiment
```

**Use cases for reference:**
- If we ever acquire multiple Mac runners
- To understand matrix strategy implementation
- As example for other parallelization experiments
- To show what we tried and why it didn't work

---

## Current State (Post-Reversion)

### What We Kept

✅ **Phase 1 Optimizations** (working great):
- CocoaPods cache: 2-4 min savings
- Playwright cache: 30-60s savings
- API E2E: 14 integration tests

✅ **Clean Documentation**:
- Decision log (this file)
- Performance data for future reference
- Tagged experiment for easy access

### Current iOS Test Flow

```yaml
ios-xctest-suite:
  needs: ios-fast-regression
  runs-on: [self-hosted, macOS, mobile]
  timeout-minutes: 30
  # Sequential execution of all 3 test configs
  # Fast, simple, reliable
```

**Total iOS test time**: ~25 minutes (back to baseline, faster than Phase 2)

---

## Lessons Learned

1. **Measure, Don't Assume**
   - Matrix looked good on paper, performed poorly in reality
   - Always run full CI to validate optimizations

2. **Runner Capacity Matters**
   - GitHub Actions parallelization requires runner concurrency
   - Self-hosted runners default to 1 concurrent job

3. **iOS Has Unique Constraints**
   - Simulator tests shouldn't run in parallel on single machine
   - Industry best practice: sequential execution

4. **YAGNI Applies to Infrastructure**
   - Don't optimize for hypothetical future (multiple runners)
   - Optimize for current reality (single runner)

5. **Performance > Theoretical Scalability**
   - Real speed improvement beats "ready for scale" that may never come
   - Developer experience is paramount

---

## Future Optimization Ideas

### ✅ Worth Exploring

1. **Test-level parallelization** (within single suite)
   - XCTest can run tests in parallel: `-parallel-testing-enabled YES`
   - Safer than job-level parallelization
   - No multi-runner requirement

2. **Selective test execution**
   - Skip iOS tests if no iOS-relevant changes
   - Use `git diff` to detect changed files
   - Similar to current `ios-fast-regression` gate

3. **Incremental builds**
   - Cache Xcode build artifacts
   - Only rebuild changed modules

4. **Gradle build cache** (Android)
   - Remote cache for Gradle builds
   - Share cache across CI runs

### ❌ Not Worth It (Learned from Phase 2)

1. **Job-level iOS parallelization** on single runner
   - Requires multiple Mac runners (expensive)
   - Adds overhead without benefit
   - Creates flaky tests

2. **Complex matrix strategies** without runner capacity
   - Looks clean but doesn't improve performance
   - Adds complexity to workflow

---

## How to Use This Document

**For Developers:**
- Understand why CI is structured this way
- Learn from experiments (Phase 2)
- See what optimizations actually work (Phase 1)

**For Future CI Work:**
- Check this log before trying similar optimizations
- Reference Phase 2 tag if exploring parallelization
- Build on Phase 1 successes

**For Onboarding:**
- Shows data-driven decision making
- Demonstrates willingness to revert when data says so
- Documents institutional knowledge

---

## Summary

| Phase | Status | Result | Time Impact |
|-------|--------|--------|-------------|
| **Phase 1: Caching & API E2E** | ✅ Kept | CocoaPods cache, Playwright cache, API tests | -3 to -5 min |
| **Phase 2: iOS Parallelization** | ❌ Reverted | Matrix strategy on single runner | +8 min (reverted) |

**Net Result**: Phase 1 optimizations retained, providing 3-5 minute speedup. Phase 2 reverted after measuring 32% performance regression.

**Reference**: Phase 2 code preserved at git tag `phase2-parallel-experiment`

---

**Last Updated**: March 18, 2026
**Maintained By**: Development Team
