/**
 * ============================================================================
 * NAVIGATION TYPES - Type-safe navigation structure
 * ============================================================================
 * Defines the complete navigation hierarchy for the application.
 * Ensures type safety and prevents missing tabs or misnamed routes.
 */

import type { LucideIcon } from 'lucide-react';

/**
 * All possible tab IDs in the application
 * Ensures type safety when referencing tabs
 */
export type TabId =
  // INICIO (Home)
  | 'monitor-central'

  // ANÁLISIS (Analysis & Reporting)
  | 'proyectos'
  | 'reportes'
  | 'comparacion'
  | 'historico'

  // SEGURIDAD (Security & Incidents)
  | 'incidentes'
  | 'hallazgos'
  | 'alertas'
  | 'investigaciones'
  | 'anomalias'

  // OPERACIONES (Operations & Automation)
  | 'agentes'
  | 'sistema'
  | 'costos'
  | 'analytics'

  // CONFIGURACIÓN (Settings & Admin)
  | 'integraciones'
  | 'usuarios'
  | 'preferencias'
  | 'biblioteca';

/**
 * Navigation group IDs
 * Used for organizing tabs into logical sections
 */
export type GroupId = 'inicio' | 'analisis' | 'seguridad' | 'operaciones' | 'configuracion';

/**
 * Single tab definition
 */
export interface TabDefinition {
  /** Unique identifier for the tab */
  id: TabId;

  /** Display label in navigation */
  label: string;

  /** Icon for the tab */
  icon: LucideIcon;

  /** Description/tooltip text */
  description: string;

  /** Component to render for this tab */
  component: React.ComponentType<any>;

  /** Whether tab requires authentication */
  requiresAuth: boolean;

  /** Roles that can access this tab */
  roles?: string[];

  /** Badge number (e.g., for notifications) */
  badge?: number | string;
}

/**
 * Navigation group containing multiple tabs
 */
export interface TabGroup {
  /** Unique identifier for the group */
  groupId: GroupId;

  /** Display label for the group */
  groupLabel: string;

  /** Icon for the group header */
  groupIcon: LucideIcon;

  /** Tabs in this group */
  tabs: TabDefinition[];

  /** Whether group is collapsible */
  collapsible: boolean;

  /** Whether group starts expanded */
  defaultExpanded: boolean;
}

/**
 * Navigation configuration
 */
export interface NavigationConfig {
  groups: TabGroup[];
  defaultTab: TabId;
  showBreadcrumb: boolean;
  showSearchbar: boolean;
}
