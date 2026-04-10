import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmStore {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isDangerous: boolean;
  isLoading: boolean;
  onConfirm: (() => void | Promise<void>) | null;
  onCancel: (() => void) | null;

  openConfirm: (options: ConfirmOptions) => void;
  closeConfirm: () => void;
  setLoading: (loading: boolean) => void;
}

const useConfirmStore = create<ConfirmStore>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  isDangerous: false,
  isLoading: false,
  onConfirm: null,
  onCancel: null,

  openConfirm: (options) => {
    set({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar',
      isDangerous: options.isDangerous || false,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel || null,
      isLoading: false,
    });
  },

  closeConfirm: () => {
    set({
      isOpen: false,
      isLoading: false,
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));

export function useConfirm() {
  const store = useConfirmStore();

  return {
    isOpen: store.isOpen,
    title: store.title,
    message: store.message,
    confirmText: store.confirmText,
    cancelText: store.cancelText,
    isDangerous: store.isDangerous,
    isLoading: store.isLoading,

    confirm: async (options: ConfirmOptions) => {
      return new Promise<boolean>((resolve) => {
        store.openConfirm({
          ...options,
          onConfirm: async () => {
            store.setLoading(true);
            try {
              await options.onConfirm();
              resolve(true);
            } finally {
              store.closeConfirm();
              resolve(true);
            }
          },
          onCancel: () => {
            store.closeConfirm();
            options.onCancel?.();
            resolve(false);
          },
        });
      });
    },

    openConfirm: store.openConfirm,
    closeConfirm: store.closeConfirm,
    handleConfirm: async () => {
      if (store.onConfirm) {
        store.setLoading(true);
        try {
          await store.onConfirm();
        } finally {
          store.closeConfirm();
        }
      }
    },
    handleCancel: () => {
      store.onCancel?.();
      store.closeConfirm();
    },
  };
}

export { useConfirmStore };
