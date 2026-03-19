---
phase: 10
slug: frontend-meal-planner
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react |
| **Config file** | `apps/web/vitest.config.ts` |
| **Quick run command** | `cd /home/solanoe/code/recipe-manager && yarn workspace @recipe-manager/web test` |
| **Full suite command** | `cd /home/solanoe/code/recipe-manager && yarn workspace @recipe-manager/web test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @recipe-manager/web test`
- **After every plan wave:** Run `yarn workspace @recipe-manager/web test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | PLAN-01 | unit | `yarn workspace @recipe-manager/web test` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 1 | PLAN-02 | unit | `yarn workspace @recipe-manager/web test` | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 2 | PLAN-03 | unit | `yarn workspace @recipe-manager/web test` | ❌ W0 | ⬜ pending |
| 10-04-01 | 04 | 2 | PLAN-04 | unit | `yarn workspace @recipe-manager/web test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/src/components/__tests__/PlannerPage.test.tsx` — stubs for PLAN-01, PLAN-02, PLAN-03, PLAN-04

*Use established dnd-kit mock pattern from `StepEditor.test.tsx`/`IngredientEditor.test.tsx`:*
```typescript
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDraggable: vi.fn(() => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null, isDragging: false })),
  useDroppable: vi.fn(() => ({ setNodeRef: vi.fn(), isOver: false })),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  closestCenter: vi.fn(),
}));
```

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| HH-02 household scoping | HH-02 | Enforced server-side; existing auth tests cover boundary | Verify entries only appear for correct household via existing auth integration tests |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
