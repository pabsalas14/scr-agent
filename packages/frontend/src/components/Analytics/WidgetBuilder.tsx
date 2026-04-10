import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { DashboardWidget } from './AdvancedDashboard';

interface WidgetBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (widget: DashboardWidget) => void;
  editingWidget?: DashboardWidget;
}

const widgetTypes = [
  { id: 'kpi', label: 'Métrica Clave', description: 'Indicador de rendimiento importante' },
  { id: 'chart', label: 'Gráfico', description: 'Gráfico de línea o barras' },
  { id: 'heatmap', label: 'Mapa de Calor', description: 'Visualización de densidad de riesgo' },
  { id: 'timeline', label: 'Línea de Tiempo', description: 'Eventos históricos' },
  { id: 'table', label: 'Tabla', description: 'Datos tabulares' },
];

const sizes = [
  { id: 'small', label: 'Pequeño', cols: '1 columna' },
  { id: 'medium', label: 'Mediano', cols: '1 columna (más alto)' },
  { id: 'large', label: 'Grande', cols: '2 columnas' },
];

export function WidgetBuilder({ isOpen, onClose, onSave, editingWidget }: WidgetBuilderProps) {
  const [step, setStep] = useState<'type' | 'config'>(editingWidget ? 'config' : 'type');
  const [widgetType, setWidgetType] = useState<string>(editingWidget?.type || '');
  const [widgetTitle, setWidgetTitle] = useState(editingWidget?.title || '');
  const [widgetSize, setWidgetSize] = useState<'small' | 'medium' | 'large'>(
    editingWidget?.size || 'medium'
  );
  const [metricName, setMetricName] = useState((editingWidget?.config?.['metric'] as string | undefined) || '');
  const [chartType, setChartType] = useState((editingWidget?.config?.['chartType'] as string | undefined) || 'line');

  const handleNext = () => {
    if (widgetType) {
      setStep('config');
    }
  };

  const handleSave = () => {
    if (!widgetTitle || !widgetType) return;

    const newWidget: DashboardWidget = {
      id: editingWidget?.id || `widget-${Date.now()}`,
      type: widgetType as any,
      title: widgetTitle,
      size: widgetSize,
      position: editingWidget?.position || 0,
      config: {
        metric: metricName,
        chartType: chartType,
      },
    };

    onSave(newWidget);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setWidgetType('');
    setWidgetTitle('');
    setWidgetSize('medium');
    setMetricName('');
    setChartType('line');
    setStep('type');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#242424] border border-[#2D2D2D] rounded-lg shadow-lg w-full max-w-md"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#2D2D2D] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {editingWidget ? 'Editar Widget' : 'Nuevo Widget'}
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="p-2 hover:bg-[#2D2D2D] rounded transition-colors text-[#A0A0A0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-4">
              <AnimatePresence mode="wait">
                {step === 'type' ? (
                  <motion.div
                    key="type"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <p className="text-sm font-semibold text-white">Selecciona un tipo de widget</p>
                    {widgetTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setWidgetType(type.id)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          widgetType === type.id
                            ? 'border-[#F97316] bg-[#F97316]/10'
                            : 'border-[#2D2D2D] bg-[#1E1E20] hover:border-[#F97316]'
                        }`}
                      >
                        <p className="text-sm font-semibold text-white">{type.label}</p>
                        <p className="text-xs text-[#6B7280] mt-1">{type.description}</p>
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="config"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Title */}
                    <div>
                      <label className="text-sm font-semibold text-white mb-2 block">Título</label>
                      <input
                        type="text"
                        value={widgetTitle}
                        onChange={(e) => setWidgetTitle(e.target.value)}
                        placeholder="Ej: Críticos por severidad"
                        className="w-full px-4 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none text-sm"
                      />
                    </div>

                    {/* Size */}
                    <div>
                      <label className="text-sm font-semibold text-white mb-2 block">Tamaño</label>
                      <div className="space-y-2">
                        {sizes.map((size) => (
                          <button
                            key={size.id}
                            onClick={() => setWidgetSize(size.id as any)}
                            className={`w-full p-3 rounded-lg border text-left text-sm transition-all ${
                              widgetSize === size.id
                                ? 'border-[#F97316] bg-[#F97316]/10'
                                : 'border-[#2D2D2D] bg-[#1E1E20] hover:border-[#F97316]'
                            }`}
                          >
                            <p className="font-medium text-white">{size.label}</p>
                            <p className="text-xs text-[#6B7280]">{size.cols}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Metric (for KPI/Chart) */}
                    {(widgetType === 'kpi' || widgetType === 'chart') && (
                      <div>
                        <label className="text-sm font-semibold text-white mb-2 block">Métrica</label>
                        <select
                          value={metricName}
                          onChange={(e) => setMetricName(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-white focus:border-[#F97316] focus:outline-none text-sm"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="findings">Total de Hallazgos</option>
                          <option value="critical">Hallazgos Críticos</option>
                          <option value="risk-score">Score de Riesgo</option>
                          <option value="remediation-rate">Tasa de Remediación</option>
                        </select>
                      </div>
                    )}

                    {/* Chart Type (for Chart) */}
                    {widgetType === 'chart' && (
                      <div>
                        <label className="text-sm font-semibold text-white mb-2 block">Tipo de Gráfico</label>
                        <select
                          value={chartType}
                          onChange={(e) => setChartType(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-white focus:border-[#F97316] focus:outline-none text-sm"
                        >
                          <option value="line">Línea</option>
                          <option value="bar">Barras</option>
                          <option value="area">Área</option>
                          <option value="pie">Pastel</option>
                        </select>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#2D2D2D] flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  if (step === 'config') {
                    setStep('type');
                  } else {
                    resetForm();
                    onClose();
                  }
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-[#A0A0A0] hover:text-white hover:bg-[#2D2D2D] transition-colors font-medium text-sm"
              >
                {step === 'config' ? 'Atrás' : 'Cancelar'}
              </button>
              <button
                onClick={step === 'type' ? handleNext : handleSave}
                disabled={step === 'type' ? !widgetType : !widgetTitle}
                className="flex-1 px-4 py-2 rounded-lg bg-[#F97316] text-white hover:bg-[#EA6B1B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {step === 'type' ? 'Siguiente' : 'Guardar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
