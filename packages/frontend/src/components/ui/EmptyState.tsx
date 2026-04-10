import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Search, FileX, BarChart3 } from 'lucide-react';

interface EmptyStateProps {
  type?: 'no-data' | 'no-results' | 'error' | 'no-permission';
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultConfigs = {
  'no-data': {
    icon: BarChart3,
    title: 'Sin datos',
    description: 'No hay datos disponibles en este momento',
  },
  'no-results': {
    icon: Search,
    title: 'Sin resultados',
    description: 'No se encontraron resultados que coincidan con tu búsqueda',
  },
  error: {
    icon: AlertCircle,
    title: 'Error',
    description: 'Ocurrió un error al cargar los datos',
  },
  'no-permission': {
    icon: FileX,
    title: 'Acceso denegado',
    description: 'No tienes permiso para ver este contenido',
  },
};

export default function EmptyState({
  type = 'no-data',
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  const config = defaultConfigs[type];
  const Icon = icon ? undefined : config.icon;
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-6 rounded-lg border border-dashed border-[#2D2D2D] bg-[#1E1E20]/50 ${className}`}
    >
      <div className="mb-4">
        {icon ? (
          <div className="text-4xl">{icon}</div>
        ) : (
          Icon && (
            <Icon className="w-12 h-12 text-[#6B7280] mb-2" />
          )
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{finalTitle}</h3>
      <p className="text-sm text-[#6B7280] text-center max-w-xs mb-6">
        {finalDescription}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA6B1B] transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
