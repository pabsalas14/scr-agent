import { useToastStore } from '../../hooks/useToast';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-[#22C55E]" />;
      case 'error':   return <AlertCircle className="w-4 h-4 text-[#EF4444]" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-[#EAB308]" />;
      case 'info':    return <Info className="w-4 h-4 text-[#6366F1]" />;
      default: return null;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'success': return 'bg-[#1E1E20] border-[#22C55E]/30 text-white';
      case 'error':   return 'bg-[#1E1E20] border-[#EF4444]/30 text-white';
      case 'warning': return 'bg-[#1E1E20] border-[#EAB308]/30 text-white';
      case 'info':    return 'bg-[#1E1E20] border-[#6366F1]/30 text-white';
      default:        return 'bg-[#1E1E20] border-[#2D2D2D] text-white';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, x: 8 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -8, x: 8 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${getColors(toast.type)}`}
          >
            {getIcon(toast.type)}
            <span className="text-sm flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-1 p-0.5 hover:bg-white/10 rounded transition-colors text-[#6B7280] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
