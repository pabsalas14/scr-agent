import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: ToastAction;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // If action exists, don't auto-dismiss (or extend duration)
    const duration = toast.action ? (toast.duration || 6000) : (toast.duration || 3000);

    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  clearToasts: () => {
    set({ toasts: [] });
  },
}));

export function useToast() {
  const { addToast, removeToast } = useToastStore();

  return {
    success: (message: string, duration?: number) => {
      addToast({ type: 'success', message, duration });
    },
    error: (message: string, duration?: number) => {
      addToast({ type: 'error', message, duration });
    },
    warning: (message: string, duration?: number) => {
      addToast({ type: 'warning', message, duration });
    },
    info: (message: string, duration?: number) => {
      addToast({ type: 'info', message, duration });
    },
    successWithAction: (message: string, action: ToastAction, duration?: number) => {
      addToast({ type: 'success', message, action, duration });
    },
    errorWithAction: (message: string, action: ToastAction, duration?: number) => {
      addToast({ type: 'error', message, action, duration });
    },
  };
}

export { useToastStore };
