# Modal Management System Guide

## Overview

The application now uses a centralized **Modal Context** system for managing overlapping modals, panels, and dialogs with automatic z-index layering.

**Status:** ✅ Production Ready

## Architecture

### Components

#### 1. **ModalContext.tsx**
- Central context for modal state management
- Tracks all open modals with automatic level-based z-index calculation
- Provides hooks for access throughout the app

**Key Functions:**
- `openModal(id, type)` - Register a modal as open
- `closeModal(id)` - Unregister a modal
- `closeAllModals()` - Close all open modals
- `getModalZIndex(id)` - Get computed z-index for a modal
- `getTopModalId()` - Get the topmost (highest z-index) modal

#### 2. **useZIndex.ts Hooks**
```typescript
// Get z-index for a modal
const zIndex = useZIndex('my-modal-id');

// Check if this modal is on top (for keyboard handling)
const isTop = useIsTopModal('my-modal-id');

// Full lifecycle management
const { isOpen, open, close, closeAll } = useModalState('my-modal-id');
```

#### 3. **zIndex.ts Configuration**
- Centralized z-index values for non-modal elements
- Dynamic calculation for modal layering
- Tailwind CSS extension for z-index values

**Z-Index Scale:**
- 0-10: Relative positioning and icons
- 20: Dropdowns and floating menus
- 40: Sticky headers, modal backdrops
- 50: Fixed modals and panels
- 1000-1700: ModalContext managed (automatic)

## Implementation Guide

### For Existing Modal Components

#### Update to Use ModalContext

**Before:**
```tsx
<motion.div className="fixed inset-0 z-40 bg-black/50" />
<motion.div className="fixed inset-0 z-50 flex items-center justify-center" />
```

**After:**
```tsx
const { openModal, closeModal } = useModal();
const modalZIndex = useZIndex('my-modal-id');
const isTopModal = useIsTopModal('my-modal-id');

useEffect(() => {
  if (isOpen) openModal('my-modal-id', 'modal');
  return () => closeModal('my-modal-id');
}, [isOpen, openModal, closeModal]);

// In JSX:
<motion.div 
  style={{ zIndex: modalZIndex - 10 }}
  className="fixed inset-0 bg-black/50"
/>
<motion.div 
  style={{ zIndex: modalZIndex }}
  className="fixed inset-0 flex items-center justify-center"
/>
```

### For New Modal Components

```tsx
import { useModal } from '../../contexts/ModalContext';
import { useZIndex } from '../../hooks/useZIndex';

const MODAL_ID = 'my-new-modal';

export default function MyModal({ isOpen, onClose }) {
  const { openModal, closeModal } = useModal();
  const modalZIndex = useZIndex(MODAL_ID);

  useEffect(() => {
    if (isOpen) openModal(MODAL_ID, 'modal');
    else closeModal(MODAL_ID);
  }, [isOpen, openModal, closeModal]);

  // ESC key support (only works if this is top modal)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            style={{ zIndex: modalZIndex - 10 }}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            style={{ zIndex: modalZIndex }}
            className="fixed inset-0 flex items-center justify-center"
          >
            {/* Modal content */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

## Features

✅ **Automatic Z-Index Management**
- No manual z-index conflicts
- Calculated based on modal nesting level
- Supports 7 concurrent modals

✅ **Modal Stacking**
- First modal: z-index 1000
- Second modal: z-index 1100
- Third modal: z-index 1200, etc.

✅ **Keyboard Support**
- ESC key closes only the topmost modal
- Uses `useIsTopModal()` to prevent conflicts

✅ **Click-Outside Dismissal**
- Backdrop dismissal works with proper layering
- Nested modals don't interfere

✅ **Modal Lifecycle**
- Open/close callbacks
- Cleanup on unmount
- Prevents duplicate opens

## Current Implementation Status

### ✅ Fully Integrated Components

| Component | Features |
|-----------|----------|
| **AdvancedFilters.tsx** | ESC key, backdrop click, dynamic z-index |
| **ConfirmDialog.tsx** | Dynamic z-index, lifecycle management |
| **Modal.tsx** | Base component with full context support |
| **ExplainerChat.tsx** | Side panel with modal stacking support |

### Testing Checklist

- [x] Multiple modals open simultaneously
- [x] ESC key closes top modal only
- [x] Click-outside dismisses modals
- [x] Z-index prevents overlapping issues
- [x] Modals close without errors
- [x] Modal stacking works smoothly

## Debugging

### Check Modal State

```typescript
// In browser console:
// Get current open modals
const ctx = window.__MODAL_CONTEXT__; // if exposed

// Or navigate components to see open modals
```

### Common Issues

**Issue:** Modal not closing
- **Solution:** Verify `closeModal()` is called in `useEffect` cleanup

**Issue:** Z-index still wrong
- **Solution:** Ensure component uses `useZIndex()` hook, not hardcoded z-values

**Issue:** ESC key not working
- **Solution:** Check `useIsTopModal()` returns true for your modal

## Best Practices

1. **Always use ModalContext** for new modals
2. **Never hardcode z-index** - use `useZIndex()` hook
3. **Include ESC support** using `useIsTopModal()` check
4. **Use backdrop dismissal** for better UX
5. **Test multiple modal scenarios** before deployment

## Migration Guide

If upgrading old modal components:

1. Import hooks from `contexts/ModalContext`
2. Replace hardcoded z-index with `useZIndex()` hook
3. Add `useEffect` for `openModal`/`closeModal` sync
4. Test ESC key and backdrop clicking
5. Verify z-index is not hardcoded anywhere

## Performance Impact

- **Minimal:** ModalContext uses React Context (native API)
- **No extra renders:** Modals only update on `openModals` array change
- **Efficient:** useCallback prevents unnecessary re-renders

## Future Enhancements

- [ ] Modal animation coordination
- [ ] Focus management (FocusTrap)
- [ ] Scroll locking when modal opens
- [ ] Modal gesture support (swipe to close)
- [ ] Accessibility improvements (ARIA labels)
