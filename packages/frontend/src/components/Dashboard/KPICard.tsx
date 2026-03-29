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
import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accentColor: string; 
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
  trend,
}: KPICardProps) {
  return (
    <div className="group relative rounded-2xl bg-[#0A0B10] border border-[#1F2937] p-6 hover:border-[#374151] transition-all duration-300 overflow-hidden shadow-2xl">
      {/* Dynamic Glow Effect */}
      <div 
        className="absolute -right-8 -top-8 w-24 h-24 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full"
        style={{ backgroundColor: accentColor }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-[#111218] border border-[#1F2937] group-hover:scale-110 transition-transform duration-500 shadow-inner"
            style={{ color: accentColor }}
          >
            {icon}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">
            {title}
          </p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black text-white tracking-tighter"
            >
              {value}
            </motion.p>
            {subtitle && (
              <p className="text-[10px] font-bold text-[#475569] mt-1 uppercase tracking-wider">
                {subtitle}
              </p>
            )}
          </div>

          {trend && (
            <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${
              trend.isPositive ? 'text-[#00FF94] bg-[#00FF94]/10' : 'text-[#FF3B3B] bg-[#FF3B3B]/10'
            }`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </div>

      {/* Subtle indicator bar */}
      <div 
        className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700"
        style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }}
      />
    </div>
  );
}
