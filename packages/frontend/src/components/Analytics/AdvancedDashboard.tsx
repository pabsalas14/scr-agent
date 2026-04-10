import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid2X2,
  BarChart3,
  PieChart,
  TrendingUp,
  Settings,
  Save,
  RotateCcw,
} from 'lucide-react';

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'heatmap' | 'timeline' | 'table';
  title: string;
  position: number;
  size: 'small' | 'medium' | 'large';
  config?: Record<string, any>;
}

interface AdvancedDashboardProps {
  widgets: DashboardWidget[];
  onWidgetReorder?: (widgets: DashboardWidget[]) => void;
  onWidgetRemove?: (widgetId: string) => void;
  onAddWidget?: () => void;
  onEditWidget?: (widgetId: string) => void;
  isLoading?: boolean;
  className?: string;
  renderWidget?: (widget: DashboardWidget) => React.ReactNode;
  children?: React.ReactNode;
}

export function AdvancedDashboard({
  widgets,
  onWidgetReorder,
  onWidgetRemove,
  onAddWidget,
  onEditWidget,
  isLoading = false,
  className = '',
  renderWidget,
  children,
}: AdvancedDashboardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [orderedWidgets, setOrderedWidgets] = useState(widgets);

  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedWidget || draggedWidget === targetId) return;

    const draggedIndex = orderedWidgets.findIndex((w) => w.id === draggedWidget);
    const targetIndex = orderedWidgets.findIndex((w) => w.id === targetId);

    if (draggedIndex < 0 || targetIndex < 0) return;

    const newWidgets = [...orderedWidgets];
    const [draggedWidget_Item] = newWidgets.splice(draggedIndex, 1);
    if (draggedWidget_Item) {
      newWidgets.splice(targetIndex, 0, draggedWidget_Item);
    }

    setOrderedWidgets(newWidgets);
    setDraggedWidget(null);
  };

  const handleSaveLayout = useCallback(() => {
    onWidgetReorder?.(orderedWidgets);
    setIsEditMode(false);
  }, [orderedWidgets, onWidgetReorder]);

  const handleReset = useCallback(() => {
    setOrderedWidgets(widgets);
  }, [widgets]);

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'large':
        return 'col-span-2';
      default:
        return 'col-span-1 md:col-span-1';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard Avanzado</h2>
          <p className="text-sm text-[#6B7280] mt-1">Monitoreo en tiempo real de métricas de seguridad</p>
        </div>

        <div className="flex items-center gap-2">
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex gap-2"
            >
              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-[#242424] border border-[#2D2D2D] hover:bg-[#2D2D2D] text-[#A0A0A0] hover:text-white transition-colors"
                title="Restablecer layout"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={handleSaveLayout}
                className="p-2 rounded-lg bg-[#F97316] hover:bg-[#EA6B1B] text-white transition-colors flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Guardar
              </button>
            </motion.div>
          )}

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`p-2 rounded-lg border transition-colors ${
              isEditMode
                ? 'bg-[#F97316] border-[#F97316] text-white'
                : 'bg-[#242424] border-[#2D2D2D] hover:bg-[#2D2D2D] text-[#A0A0A0] hover:text-white'
            }`}
            title="Editar layout"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={onAddWidget}
            className="p-2 rounded-lg bg-[#242424] border border-[#2D2D2D] hover:bg-[#2D2D2D] text-[#A0A0A0] hover:text-[#F97316] transition-colors"
            title="Agregar widget"
          >
            <Grid2X2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Edit Mode Info */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20"
          >
            <p className="text-sm text-[#F97316]">
              💡 Modo edición activado. Arrastra widgets para reordenarlos, o haz clic en el ícono de configuración para
              editar.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
        {isLoading ? (
          // Loading State
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-[#242424] rounded-lg animate-pulse border border-[#2D2D2D]"
            />
          ))
        ) : orderedWidgets.length === 0 ? (
          // Empty State
          <div className="col-span-full p-12 text-center rounded-lg border border-dashed border-[#2D2D2D]">
            <TrendingUp className="w-12 h-12 text-[#6B7280] mx-auto mb-3 opacity-50" />
            <p className="text-sm text-[#6B7280]">No hay widgets configurados</p>
            <button
              onClick={onAddWidget}
              className="mt-4 px-4 py-2 rounded-lg bg-[#F97316] text-white hover:bg-[#EA6B1B] transition-colors font-medium text-sm"
            >
              Agregar primer widget
            </button>
          </div>
        ) : (
          orderedWidgets.map((widget, index) => (
            <motion.div
              key={widget.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              draggable={isEditMode}
              onDragStart={() => handleDragStart(widget.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(widget.id)}
              className={`relative rounded-lg border border-[#2D2D2D] bg-[#242424] overflow-hidden hover:border-[#F97316] transition-colors ${
                getSizeClass(widget.size)
              } ${isEditMode ? 'cursor-move opacity-90 hover:opacity-100' : ''} ${
                draggedWidget === widget.id ? 'opacity-50' : ''
              }`}
            >
              {/* Widget Header */}
              <div className="p-4 border-b border-[#2D2D2D] flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{widget.title}</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {widget.type === 'kpi' && 'Métrica Clave'}
                    {widget.type === 'chart' && 'Gráfico'}
                    {widget.type === 'heatmap' && 'Mapa de Calor'}
                    {widget.type === 'timeline' && 'Línea de Tiempo'}
                    {widget.type === 'table' && 'Tabla'}
                  </p>
                </div>

                {isEditMode && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditWidget?.(widget.id)}
                      className="p-1 rounded hover:bg-[#2D2D2D] text-[#A0A0A0] hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onWidgetRemove?.(widget.id)}
                      className="p-1 rounded hover:bg-[#EF4444]/20 text-[#A0A0A0] hover:text-[#EF4444] transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Widget Content */}
              <div className="p-4">
                {renderWidget ? (
                  renderWidget(widget)
                ) : (
                  <div className="h-40 flex items-center justify-center text-[#6B7280]">
                    {widget.type === 'kpi' && <BarChart3 className="w-8 h-8" />}
                    {widget.type === 'chart' && <TrendingUp className="w-8 h-8" />}
                    {widget.type === 'heatmap' && <PieChart className="w-8 h-8" />}
                    {children}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Widget Configuration Footer */}
      {isEditMode && orderedWidgets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 p-4 rounded-lg bg-[#242424] border border-[#2D2D2D] flex items-center justify-between"
        >
          <p className="text-sm text-[#6B7280]">{orderedWidgets.length} widgets en el dashboard</p>
          <button
            onClick={handleSaveLayout}
            className="px-4 py-2 rounded-lg bg-[#F97316] text-white hover:bg-[#EA6B1B] transition-colors font-medium text-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar cambios
          </button>
        </motion.div>
      )}
    </div>
  );
}
