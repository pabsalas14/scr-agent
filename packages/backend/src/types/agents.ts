/**
 * ============================================================================
 * TIPOS COMPARTIDOS - AGENTES
 * ============================================================================
 *
 * Interfaces y tipos para la comunicación entre agentes
 * Define el contrato de entrada/salida para cada agente
 */

/**
 * Resultado del Agente Malicia
 * Hallazgo de código malicioso
 */
export interface MaliciaFinding {
  // Ubicación
  archivo: string;
  funcion?: string;
  rango_lineas: [number, number];
  fragmento_codigo?: string;

  // Análisis
  severidad: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRÍTICO';
  tipo_riesgo:
    | 'PUERTA_TRASERA'
    | 'INYECCION'
    | 'BOMBA_LOGICA'
    | 'OFUSCACION'
    | 'SOSPECHOSO'
    | 'MANEJO_ERROR_ANORMAL'
    | 'VALORES_HARDCODEADOS';

  // Resultados
  por_que_sospechoso: string;
  confianza: number; // 0-1
  pasos_remediacion: string[];

  // Metadata
  id?: string;
  timestamp?: string;
}

/**
 * Entrada para el Agente Malicia
 */
export interface MaliciaInput {
  codigo: string;
  lenguaje?: string;
  contexto?: string;
  patrones_a_buscar?: string[];
}

/**
 * Salida del Agente Malicia
 */
export interface MaliciaOutput {
  hallazgos: MaliciaFinding[];
  resumen: string;
  cantidad_hallazgos: number;
  tiempo_ejecucion_ms: number;
}

// ============================================

/**
 * Evento Forense - Punto en la línea de tiempo
 */
export interface EventoForense {
  // Temporal
  timestamp: string; // ISO 8601
  commit: string;
  autor: string;

  // Cambios
  archivo: string;
  funcion?: string;
  accion: 'AGREGADO' | 'MODIFICADO' | 'ELIMINADO';
  mensaje_commit: string;
  resumen_cambios?: string;

  // Riesgo
  nivel_riesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRÍTICO';
  indicadores_sospecha?: string[];

  // Relaciones
  hallazgo_id?: string; // Vinculado a hallazgo de Malicia

  // Metadata
  id?: string;
}

/**
 * Entrada para el Agente Forenses
 */
export interface ForensesInput {
  hallazgos_malicia: MaliciaFinding[];
  historial_commits: any[]; // Array de commits de Git
  rango_fechas?: {
    desde: string;
    hasta: string;
  };
}

/**
 * Salida del Agente Forenses
 */
export interface ForensesOutput {
  linea_tiempo: EventoForense[];
  resumen_forense: string;
  patrones_detectados: string[];
  autores_sospechosos?: string[];
  tiempo_ejecucion_ms: number;
}

// ============================================

/**
 * Paso de remediación prioritizado
 */
export interface PasoRemediacion {
  orden: number;
  accion: string;
  justificacion: string;
  urgencia: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
}

/**
 * Entrada para el Agente Síntesis
 */
export interface SintesisInput {
  hallazgos_malicia: MaliciaFinding[];
  linea_tiempo_forenses: EventoForense[];
  contexto_repo?: string;
}

/**
 * Salida del Agente Síntesis
 */
export interface SintesisOutput {
  resumen_ejecutivo: string;
  cantidad_hallazgos: number;
  desglose_severidad: Record<string, number>;
  funciones_comprometidas: string[];
  linea_de_ataque: string;
  prioridad_remediacion: PasoRemediacion[];
  autores_afectados: string[];
  puntuacion_riesgo: number; // 0-100
  recomendacion_general: string;
  tiempo_ejecucion_ms: number;
}

// ============================================

/**
 * Solicitud de análisis completo
 * Flujo: Malicia → Forenses → Síntesis
 */
export interface AnalisisCompleto {
  id: string;
  proyecto_id: string;
  url_repositorio: string;
  alcance: 'REPOSITORIO' | 'ORGANIZACION' | 'PULL_REQUEST';
  timestamp_inicio: string;
  status: 'PENDIENTE' | 'MALICIA_EJECUTANDO' | 'FORENSES_EJECUTANDO' | 'SINTESIS_EJECUTANDO' | 'COMPLETADO' | 'ERROR';
}

/**
 * Resultado del análisis completo
 */
export interface ResultadoAnalisisCompleto extends AnalisisCompleto {
  timestamp_fin?: string;
  malicia_output?: MaliciaOutput;
  forenses_output?: ForensesOutput;
  sintesis_output?: SintesisOutput;
  error?: string;
}
