/**
 * Monitor de Incidentes - Dashboard de Guerra
 * Muestra análisis fallidos y hallazgos críticos de forma prioritaria
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertOctagon, Terminal, Radio, Clock, ShieldX } from 'lucide-react';
import { apiService } from '../../services/api.service';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function IncidentMonitor() {
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.obtenerProyectos(),
    refetchInterval: 10000,
  });

  const proyectos = projectsData?.data || [];
  
  // Extraer incidentes: análisis con errores o hallazgos críticos
  const allAnalyses = proyectos.flatMap((p: any) => 
    (p.analyses || []).map((a: any) => ({ ...a, projectName: p.name, projectId: p.id }))
  );

  const incidentes = allAnalyses.filter((a: any) => a.status === 'ERROR' || a.riskScore > 80);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Radio className="w-12 h-12 text-[#FF3B3B] animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#64748B]">Sincronizando Frecuencia de Emergencia...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Refined Header - War Room Style */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-white/[0.03] pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
             <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B3B] shadow-[0_0_8px_#FF3B3B] animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF3B3B]">Transmisión Crítica de Seguridad</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none uppercase">INCIDENTES</h1>
          <p className="text-[#64748B] text-xs font-medium max-w-lg leading-relaxed">
            Protocolo de respuesta activa CODA. Monitoreo constante de desvíos críticos, fallos de infraestructura y vectores de riesgo.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-[#0A0B10] border border-[#FF3B3B]/20 rounded-2xl px-6 py-4 flex flex-col items-center shadow-[0_0_20px_rgba(255,59,59,0.05)]">
            <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest mb-1">Alertas Activas</span>
            <span className="text-3xl font-black text-[#FF3B3B]">{incidentes.length}</span>
          </div>
        </div>
      </div>

      {/* Grid de Incidentes */}
      {incidentes.length > 0 ? (
        <div className="grid gap-4">
          {incidentes.map((inc: any, idx: number) => (
            <motion.div
              key={inc.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <div 
                className={`relative overflow-hidden rounded-[2rem] bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.03] transition-all duration-500 hover:border-white/10 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-6 lg:p-8 ${
                  inc.status === 'ERROR' ? 'border-l-4 border-l-[#FF3B3B]' : 'border-l-4 border-l-[#FF8A00]'
                }`}
              >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                  {inc.status === 'ERROR' ? <AlertOctagon className="w-24 h-24" /> : <ShieldAlert className="w-24 h-24" />}
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center gap-8 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    inc.status === 'ERROR' ? 'bg-[#FF3B3B]/10 text-[#FF3B3B]' : 'bg-[#FF8A00]/10 text-[#FF8A00]'
                  } border border-white/5`}>
                    {inc.status === 'ERROR' ? <ShieldX className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-white tracking-tight">{inc.projectName}</h3>
                      <div className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest ${
                         inc.status === 'ERROR' ? 'bg-[#FF3B3B]/10 border-[#FF3B3B]/20 text-[#FF3B3B]' : 'bg-[#FF8A00]/10 border-[#FF8A00]/20 text-[#FF8A00]'
                      }`}>
                        {inc.status === 'ERROR' ? 'SISTEMA CAÍDO' : 'RIESGO CRÍTICO'}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[9px] font-bold text-[#475569] uppercase tracking-[0.2em]">
                      <div className="flex items-center gap-1.5"><Terminal className="w-3 h-3 text-[#FF3B3B]/50" /> ID: {inc.id.slice(0, 8)}</div>
                      <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-[#475569]/50" /> {new Date(inc.createdAt).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="lg:text-right">
                    {inc.status === 'ERROR' ? (
                      <p className="text-[10px] font-mono text-[#FF3B3B]/80 bg-[#FF3B3B]/5 px-4 py-2.5 rounded-xl border border-[#FF3B3B]/10 max-w-sm lg:max-w-md break-words uppercase leading-relaxed">
                         {inc.error || 'Fallo inesperado del motor de análisis'}
                      </p>
                    ) : (
                      <div className="flex flex-col lg:items-end gap-1">
                         <span className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em]">Puntuación de Amenaza</span>
                         <span className="text-3xl font-black text-[#FF8A00] tracking-tighter">{inc.riskScore}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-[#1F2937] bg-transparent h-64 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#00FF94]/5 flex items-center justify-center text-[#00FF94] opacity-50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="text-center space-y-1">
             <p className="text-white font-black uppercase tracking-widest">Sin Incidentes Críticos</p>
             <p className="text-[#64748B] text-[10px] font-medium tracking-widest">Perímetro de seguridad estable.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
