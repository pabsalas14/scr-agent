/**
 * ============================================================================
 * COMPONENTE: TimelineViewer
 * ============================================================================
 *
 * Visualización dinámica e interactiva de la línea de tiempo forense.
 * Usa D3.js para renderizar los eventos en un canvas SVG.
 *
 * Características:
 * - Eventos agrupados por función (vista híbrida)
 * - Colores por nivel de riesgo
 * - Hover para detalles del commit
 * - Click para expandir/contraer eventos
 * - Zoom y pan
 * - Filtros por severidad, autor, archivo
 * - Animaciones con Framer Motion
 * - Exportar como PNG/PDF
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import type { EventoTimeline, GrupoFuncion, FiltrosTimeline, NivelRiesgo } from '../../types/timeline';
import { COLORES_RIESGO, COLORES_RIESGO_CLARO } from '../../types/timeline';
import TimelineEvent from './TimelineEvent';
import TimelineControls from './TimelineControls';
import TimelineFilters from './TimelineFilters';

interface TimelineViewerProps {
  eventos: EventoTimeline[];
  onExportarPDF?: () => void;
}

/**
 * Agrupar eventos por función/archivo
 */
function agruparPorFuncion(eventos: EventoTimeline[]): GrupoFuncion[] {
  const grupos = new Map<string, EventoTimeline[]>();

  eventos.forEach((evento) => {
    const clave = `${evento.archivo}::${evento.funcion || 'root'}`;
    const grupo = grupos.get(clave) || [];
    grupo.push(evento);
    grupos.set(clave, grupo);
  });

  return Array.from(grupos.entries()).map(([clave, evs]) => {
    const [archivo, funcion] = clave.split('::');
    const ordenados = evs.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const severidades: NivelRiesgo[] = ['CRÍTICO', 'ALTO', 'MEDIO', 'BAJO'];
    const maxRiesgo =
      severidades.find((s) => evs.some((e) => e.nivel_riesgo === s)) || 'BAJO';

    return {
      funcion,
      archivo,
      eventos: ordenados,
      nivel_riesgo_maximo: maxRiesgo,
      primera_fecha: ordenados[0]?.timestamp || '',
      ultima_fecha: ordenados[ordenados.length - 1]?.timestamp || '',
    };
  });
}

/**
 * Componente principal de Timeline
 */
export default function TimelineViewer({ eventos, onExportarPDF }: TimelineViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoTimeline | null>(null);
  const [grupoExpandido, setGrupoExpandido] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosTimeline>({});
  const [vistaGrupo, setVistaGrupo] = useState(false); // false = por commit, true = por función

  /**
   * Filtrar eventos según filtros activos
   */
  const eventosFiltrados = eventos.filter((evento) => {
    if (filtros.severidad?.length && !filtros.severidad.includes(evento.nivel_riesgo)) {
      return false;
    }
    if (filtros.autor && !evento.autor.includes(filtros.autor)) {
      return false;
    }
    if (filtros.archivo && !evento.archivo.includes(filtros.archivo)) {
      return false;
    }
    return true;
  });

  const grupos = agruparPorFuncion(eventosFiltrados);

  /**
   * Renderizar timeline con D3.js
   */
  useEffect(() => {
    if (!svgRef.current || eventosFiltrados.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 900;
    const height = vistaGrupo ? grupos.length * 80 + 60 : eventosFiltrados.length * 70 + 60;

    svg.attr('height', height);

    /**
     * Escala de tiempo en eje X
     */
    const fechas = eventosFiltrados.map((e) => new Date(e.timestamp));
    const xScale = d3
      .scaleTime()
      .domain([
        d3.min(fechas) ?? new Date(),
        d3.max(fechas) ?? new Date(),
      ])
      .range([80, width - 40]);

    /**
     * Línea del eje tiempo
     */
    const gEje = svg.append('g').attr('transform', `translate(0, 30)`);
    gEje
      .append('line')
      .attr('x1', 80)
      .attr('x2', width - 40)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1);

    /**
     * Ticks del eje de tiempo
     */
    const eje = d3.axisTop(xScale).ticks(6).tickFormat(d3.timeFormat('%d-%b-%Y'));
    gEje.call(eje);

    /**
     * Renderizar eventos o grupos
     */
    const datos = vistaGrupo ? grupos : eventosFiltrados;
    const gEventos = svg.append('g').attr('transform', 'translate(0, 60)');

    datos.forEach((item, i) => {
      const esGrupo = vistaGrupo && 'eventos' in item;
      const evento = esGrupo ? null : (item as EventoTimeline);
      const grupo = esGrupo ? (item as GrupoFuncion) : null;

      const y = i * (vistaGrupo ? 80 : 70) + 20;
      const fecha = esGrupo
        ? new Date(grupo!.primera_fecha)
        : new Date(evento!.timestamp);
      const x = xScale(fecha);
      const riesgo: NivelRiesgo = esGrupo
        ? grupo!.nivel_riesgo_maximo
        : evento!.nivel_riesgo;
      const color = COLORES_RIESGO[riesgo];
      const colorClaro = COLORES_RIESGO_CLARO[riesgo];

      const g = gEventos.append('g').attr('cursor', 'pointer');

      /**
       * Línea horizontal por fila
       */
      g.append('line')
        .attr('x1', 80)
        .attr('x2', width - 40)
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4 2');

      /**
       * Nodo del evento
       */
      const circle = g
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', esGrupo ? 12 : 8)
        .attr('fill', colorClaro)
        .attr('stroke', color)
        .attr('stroke-width', 2);

      /**
       * Hover / interactividad
       */
      circle.on('mouseover', function () {
        d3.select(this).attr('r', esGrupo ? 15 : 11).attr('fill', color);
      });

      circle.on('mouseout', function () {
        d3.select(this).attr('r', esGrupo ? 12 : 8).attr('fill', colorClaro);
      });

      circle.on('click', () => {
        if (esGrupo) {
          const clave = `${grupo!.archivo}::${grupo!.funcion}`;
          setGrupoExpandido((prev) => (prev === clave ? null : clave));
        } else {
          setEventoSeleccionado((prev) =>
            prev?.id === evento!.id ? null : evento
          );
        }
      });

      /**
       * Icono del nivel de riesgo
       */
      g.append('text')
        .attr('x', x)
        .attr('y', y + 1)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', esGrupo ? '10px' : '8px')
        .attr('fill', color)
        .text(riesgo === 'CRÍTICO' ? '🚨' : riesgo === 'ALTO' ? '⚠' : riesgo === 'MEDIO' ? '?' : '✓');

      /**
       * Etiqueta de función/archivo a la izquierda
       */
      const label = esGrupo
        ? `${grupo!.funcion} (${grupo!.archivo.split('/').pop()})`
        : `${evento!.funcion || evento!.archivo.split('/').pop()}`;

      g.append('text')
        .attr('x', 75)
        .attr('y', y)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#475569')
        .attr('font-weight', esGrupo ? 'bold' : 'normal')
        .text(label.length > 25 ? label.slice(0, 23) + '…' : label);

      /**
       * Tooltip con fecha
       */
      const fechaFmt = d3.timeFormat('%d-%m-%Y %H:%M')(fecha);
      g.append('title').text(
        esGrupo
          ? `${grupo!.eventos.length} eventos | Primera: ${fechaFmt}`
          : `${fechaFmt} | ${evento!.autor}`
      );
    });

    /**
     * Zoom y pan
     */
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        gEventos.attr('transform', `translate(0, 60) scale(${event.transform.k})`);
        gEje.attr('transform', `translate(${event.transform.x}, 30) scale(${event.transform.k}, 1)`);
      });

    svg.call(zoom);
  }, [eventosFiltrados, grupos, vistaGrupo]);

  return (
    <div className="flex flex-col gap-4" ref={containerRef}>
      {/* Controles */}
      <TimelineControls
        totalEventos={eventos.length}
        eventosFiltrados={eventosFiltrados.length}
        vistaGrupo={vistaGrupo}
        onToggleVista={() => setVistaGrupo((v) => !v)}
        onExportarPNG={() => exportarPNG(svgRef)}
        onExportarPDF={onExportarPDF}
      />

      {/* Filtros */}
      <TimelineFilters
        eventos={eventos}
        filtros={filtros}
        onChange={setFiltros}
      />

      {/* SVG Principal */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-auto shadow-sm">
        <svg
          ref={svgRef}
          width="100%"
          style={{ minHeight: 200 }}
          className="block"
        />
      </div>

      {/* Panel de detalle del evento seleccionado */}
      <AnimatePresence>
        {eventoSeleccionado && (
          <motion.div
            key={eventoSeleccionado.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <TimelineEvent
              evento={eventoSeleccionado}
              onCerrar={() => setEventoSeleccionado(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Exportar timeline como PNG
 */
function exportarPNG(svgRef: React.RefObject<SVGSVGElement>) {
  if (!svgRef.current) return;

  const svgData = new XMLSerializer().serializeToString(svgRef.current);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `scr-timeline-${new Date().toISOString().split('T')[0]}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}
