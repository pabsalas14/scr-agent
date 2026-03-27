/**
 * ============================================================================
 * KPI CARD - ESTADÍSTICAS MODERNO
 * ============================================================================
 * Card de estadística moderna y dinámica con:
 * - Fondo oscuro con gradiente sutil
 * - Borde de color vibrante
 * - Icon grande y llamativo
 * - Número destacado
 * - Efecto hover con elevación
 * - Diseño profesional y dinámico
 */

import { ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accentColor: string; // Color vibrante del icono (ej: '#0284c7')
  onMenu?: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  onMenu,
  trend,
}: KPICardProps) {
  return (
    <div
      className="relative rounded-xl p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 group overflow-hidden"
      style={{
        borderColor: accentColor,
        background: `linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)`,
      }}
    >
      {/* Gradiente de fondo animado en hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
        style={{ backgroundColor: accentColor }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header con icon y menu */}
        <div className="flex justify-between items-start mb-6">
          {/* Icon grande y vibrante */}
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-gradient-to-br transition-all duration-300 group-hover:scale-110 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
            }}
          >
            {icon}
          </div>

          {/* Menu button (ellipsis) */}
          {onMenu && (
            <button
              onClick={onMenu}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              aria-label="Opciones"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Título */}
        <p
          className="text-sm font-semibold mb-3 transition-colors duration-300"
          style={{ color: accentColor }}
        >
          {title}
        </p>

        {/* Número grande y destacado */}
        <div className="mb-4">
          <p className="text-4xl font-bold text-white">
            {value}
          </p>
        </div>

        {/* Información adicional */}
        <div className="flex justify-between items-end pt-3 border-t border-white/10">
          {subtitle && (
            <p className="text-xs text-gray-400">
              {subtitle}
            </p>
          )}

          {/* Trend si existe */}
          {trend && (
            <div
              className={`text-xs font-semibold px-2 py-1 rounded-md ${
                trend.isPositive
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
