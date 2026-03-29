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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Estilo War Room */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-[#FF3B3B]/10 pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#FF3B3B]">
            <Radio className="w-3 h-3 animate-ping" />
            <span>Transmisión Crítica de Seguridad</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none">INCIDENTES</h1>
          <p className="text-[#64748B] text-sm font-medium max-w-xl">
            Protocolo de respuesta activa. Monitoreo de desvíos críticos y fallos de infraestructura.
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <Card 
                className={`relative overflow-hidden border-l-4 transition-all duration-300 group-hover:scale-[1.005] group-hover:shadow-[0_0_40px_rgba(255,59,59,0.1)] ${
                  inc.status === 'ERROR' ? 'border-[#FF3B3B]' : 'border-[#FF8A00]'
                }`}
                style={{ background: 'rgba(7,8,13,0.8)', borderColor: '#1F2937' }}
              >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  {inc.status === 'ERROR' ? <AlertOctagon className="w-32 h-32" /> : <ShieldAlert className="w-32 h-32" />}
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center gap-6 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    inc.status === 'ERROR' ? 'bg-[#FF3B3B]/10 text-[#FF3B3B]' : 'bg-[#FF8A00]/10 text-[#FF8A00]'
                  } border border-white/5`}>
                    {inc.status === 'ERROR' ? <ShieldX className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-white tracking-tight">{inc.projectName}</h3>
                      <Badge type={inc.status === 'ERROR' ? 'critical' : 'warning'} size="sm" showIcon={false}>
                        {inc.status === 'ERROR' ? 'SISTEMA CAÍDO' : 'RIESGO CRÍTICO'}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-mono text-[#64748B] uppercase tracking-widest flex items-center gap-2">
                      <Terminal className="w-3 h-3" />
                      ID: <span className="text-[#94A3B8]">{inc.id.slice(0, 12)}...</span>
                      <span className="mx-2 opacity-20">|</span>
                      <Clock className="w-3 h-3" />
                      {new Date(inc.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="lg:text-right space-y-2">
                    {inc.status === 'ERROR' && (
                      <p className="text-xs font-semibold text-[#FF3B3B] bg-[#FF3B3B]/5 px-4 py-2 rounded-xl border border-[#FF3B3B]/10 max-w-sm lg:max-w-md break-words">
                         ERROR: {inc.error || 'Fallo inesperado del motor de análisis'}
                      </p>
                    )}
                    {inc.riskScore > 80 && (
                      <div className="flex items-center lg:justify-end gap-2 text-[#FF8A00]">
                         <span className="text-[10px] font-black uppercase tracking-widest">Score de Intrusión</span>
                         <span className="text-2xl font-black">{inc.riskScore}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
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
