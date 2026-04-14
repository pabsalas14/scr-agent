# UI/UX Issues - Critical Fixes Needed

**Date:** 2026-04-14
**Priority:** CRITICAL
**Status:** Identified

## Issues Found

### 1. **Modals & Panels Not Closing Properly** 🔴
- Filtros Avanzados panel stays open
- No clear close button or click-outside handling
- Overlays persist after action completion
- **Impact:** User cannot dismiss UI elements

### 2. **Z-Index Conflicts & Overlapping Elements** 🔴
- Elements transpose (overlap incorrectly)
- Sidebar overlaps with main content
- Modals behind other elements
- Filters panel doesn't overlay properly
- **Impact:** Cannot interact with hidden elements

### 3. **Layout & Spacing Issues** 🟡
- Inconsistent padding/margins
- Elements not properly aligned
- Sidebar and top nav redundant sections
- Search bar position conflicts
- **Impact:** Visually disorganized, hard to scan

### 4. **Modal/Panel Management** 🔴
- Multiple modals can open simultaneously
- No modal stacking/queuing system
- Close buttons missing or unreachable
- Click-outside dismissal not implemented
- **Impact:** UI becomes unusable with multiple open elements

### 5. **Sidebar vs Top Navigation** 🟡
- Both show overlapping sections
- Duplicate navigation items
- Unclear primary navigation structure
- **Impact:** Confusing navigation, user doesn't know where to click

## Files to Fix

### Frontend Components
- `/packages/frontend/src/components/Search/AdvancedFilters.tsx` - Add proper close handling
- `/packages/frontend/src/components/Analysis/ExplainerChat.tsx` - Fix z-index and overlay
- `/packages/frontend/src/components/Dashboard/Dashboard.tsx` - Fix modal stacking
- `/packages/frontend/src/layouts/MainLayout.tsx` - Fix sidebar/nav overlap
- Global CSS - Review z-index layers

### Global Styling
- `/packages/frontend/src/index.css` - Add modal backdrop styles
- `/packages/frontend/tailwind.config.js` - Review z-index scale
- Add click-outside handling for modals

## Fix Plan

**Phase 1: Modal Management (1-2 hours)**
- [ ] Implement modal context/provider for stacking
- [ ] Add proper close handlers (X button, ESC key, click-outside)
- [ ] Fix z-index layering (backdrop 40, modal 50, etc.)
- [ ] Test modal open/close workflow

**Phase 2: Layout Fixes (1-2 hours)**
- [ ] Fix sidebar width/positioning
- [ ] Remove redundant navigation items
- [ ] Standardize spacing/padding
- [ ] Fix search bar positioning
- [ ] Ensure proper scrolling areas

**Phase 3: Navigation Cleanup (30 min - 1 hour)**
- [ ] Consolidate sidebar and top nav
- [ ] Remove duplicate items
- [ ] Create clear primary navigation
- [ ] Add visual hierarchy

**Phase 4: Testing & Polish (1 hour)**
- [ ] Test all modal open/close scenarios
- [ ] Test responsive design
- [ ] Verify no overlapping elements
- [ ] Cross-browser testing

## Estimated Total Time: 4-6 hours

---

## Quick Wins (Do First)
1. Add close button to Filtros Avanzados
2. Add ESC key handler to close modals
3. Add click-outside dismissal
4. Fix obvious z-index issues
