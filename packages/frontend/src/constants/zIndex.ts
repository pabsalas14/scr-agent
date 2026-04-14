/**
 * Centralized z-index management
 * Ensures consistent layering across the application
 *
 * Scale:
 * 0-99: Background layers (z-0, z-10, z-20)
 * 100-399: Content layers (z-100, z-200, z-300)
 * 400-999: Modal/overlay layers (z-400, z-500, etc)
 * 1000+: ModalContext managed layers (1000-1700)
 */

export const zIndex = {
  // Background & relative positioning
  RELATIVE: {
    CONTENT: 'z-10',
    OVERLAY: 'z-20',
  },

  // Fixed/Sticky headers and navigation
  HEADER: {
    STICKY_HEADER: 'z-40', // SearchHeader, main header
    SEARCH_ICON: 'z-10', // Icons inside search
  },

  // Dropdowns and floating UI (non-modal)
  DROPDOWN: {
    DROPDOWN_MENU: 'z-50', // Notification bell, user menu, analysis menu
    DROPDOWN_BACKDROP: 'z-40', // Backdrop behind dropdown if any
  },

  // Panels and side sheets
  PANEL: {
    BACKDROP: 'z-40', // Backdrop/overlay
    PANEL: 'z-50', // IncidentDetailPanel, ExplainerChat, etc.
  },

  // Modals and dialogs
  MODAL: {
    BACKDROP: 'z-40', // Modal backdrop (black/60)
    MODAL: 'z-50', // Modal container itself
  },

  // Toast and notifications
  TOAST: {
    TOAST: 'z-50', // Toast notifications
  },

  // Tooltips and popovers
  TOOLTIP: {
    TOOLTIP: 'z-50', // Tooltip
  },

  // Legacy - being phased out
  // Use ModalContext.getModalZIndex() instead for new modals
  LEGACY: {
    RELATIVE: 'z-10',
    DROPDOWN: 'z-20',
    STICKY: 'z-40',
    OVERLAY: 'z-50',
  },
} as const;

/**
 * Helper function to get z-index class for dynamic values
 * Used by ModalContext for calculated z-index based on modal level
 */
export function getModalZIndexClass(level: number): string {
  // ModalContext calculates: 1000 + level * 100
  // Returns tailwind z-index class if available, otherwise use inline style
  const zValue = 1000 + level * 100;

  // For tailwind classes, we'd need custom z-index values in tailwind config
  // For now, this helps us track the calculation
  return `modal-z-${level}`;
}

/**
 * Dynamic z-index calculator for ModalContext
 * Ensures proper layering as modals are opened/closed
 */
export function calculateModalZIndex(level: number): number {
  return 1000 + level * 100;
}
