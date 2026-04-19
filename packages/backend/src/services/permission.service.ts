/**
 * Permission Service (PHASE 3.5)
 * Handles role-based access control (RBAC) and granular permissions
 */

import { Role } from '@prisma/client';

/**
 * Available actions in the system
 */
export enum Action {
  // Projects
  CREATE_PROJECT = 'create_project',
  READ_PROJECT = 'read_project',
  UPDATE_PROJECT = 'update_project',
  DELETE_PROJECT = 'delete_project',
  RUN_ANALYSIS = 'run_analysis',
  CANCEL_ANALYSIS = 'cancel_analysis',

  // Findings
  READ_FINDING = 'read_finding',
  UPDATE_FINDING = 'update_finding',
  DELETE_FINDING = 'delete_finding',
  ASSIGN_FINDING = 'assign_finding',
  CHANGE_FINDING_STATUS = 'change_finding_status',
  VERIFY_REMEDIATION = 'verify_remediation',

  // Alerts & Rules
  CREATE_ALERT_RULE = 'create_alert_rule',
  UPDATE_ALERT_RULE = 'update_alert_rule',
  DELETE_ALERT_RULE = 'delete_alert_rule',
  READ_ALERT_RULE = 'read_alert_rule',

  // Users & Admin
  MANAGE_USERS = 'manage_users',
  VIEW_METRICS = 'view_metrics',
  VIEW_ANALYTICS = 'view_analytics',
  MODIFY_SETTINGS = 'modify_settings',
  MANAGE_AGENTS = 'manage_agents',

  // Reports
  CREATE_REPORT = 'create_report',
  EXPORT_REPORT = 'export_report',
  DELETE_REPORT = 'delete_report',
}

/**
 * Resources in the system
 */
export enum Resource {
  PROJECT = 'project',
  FINDING = 'finding',
  ANALYSIS = 'analysis',
  ALERT_RULE = 'alert_rule',
  USER = 'user',
  REPORT = 'report',
  SETTINGS = 'settings',
}

/**
 * Permission mapping: Role → Actions
 */
const ROLE_PERMISSIONS: Record<Role, Set<Action>> = {
  ADMIN: new Set([
    // All actions
    Action.CREATE_PROJECT,
    Action.READ_PROJECT,
    Action.UPDATE_PROJECT,
    Action.DELETE_PROJECT,
    Action.RUN_ANALYSIS,
    Action.CANCEL_ANALYSIS,

    Action.READ_FINDING,
    Action.UPDATE_FINDING,
    Action.DELETE_FINDING,
    Action.ASSIGN_FINDING,
    Action.CHANGE_FINDING_STATUS,
    Action.VERIFY_REMEDIATION,

    Action.CREATE_ALERT_RULE,
    Action.UPDATE_ALERT_RULE,
    Action.DELETE_ALERT_RULE,
    Action.READ_ALERT_RULE,

    Action.MANAGE_USERS,
    Action.VIEW_METRICS,
    Action.VIEW_ANALYTICS,
    Action.MODIFY_SETTINGS,
    Action.MANAGE_AGENTS,

    Action.CREATE_REPORT,
    Action.EXPORT_REPORT,
    Action.DELETE_REPORT,
  ]),

  ANALYST: new Set([
    // Read and modify findings
    Action.READ_PROJECT,
    Action.READ_FINDING,
    Action.UPDATE_FINDING,
    Action.ASSIGN_FINDING,
    Action.CHANGE_FINDING_STATUS,
    Action.VERIFY_REMEDIATION,

    Action.READ_ALERT_RULE,
    Action.VIEW_ANALYTICS,
    Action.CREATE_REPORT,
    Action.EXPORT_REPORT,
  ]),

  DEVELOPER: new Set([
    // Run analyses and view findings
    Action.READ_PROJECT,
    Action.RUN_ANALYSIS,
    Action.READ_FINDING,
    Action.UPDATE_FINDING,
    Action.READ_ALERT_RULE,
  ]),

  VIEWER: new Set([
    // Read-only access
    Action.READ_PROJECT,
    Action.READ_FINDING,
    Action.READ_ALERT_RULE,
    Action.VIEW_ANALYTICS,
  ]),
};

/**
 * Check if a role has permission for an action
 */
export function hasPermission(role: Role | undefined, action: Action): boolean {
  if (!role) {
    return false;
  }

  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.has(action) : false;
}

/**
 * Check multiple permissions (OR logic - at least one must be true)
 */
export function hasAnyPermission(role: Role | undefined, actions: Action[]): boolean {
  return actions.some((action) => hasPermission(role, action));
}

/**
 * Check multiple permissions (AND logic - all must be true)
 */
export function hasAllPermissions(role: Role | undefined, actions: Action[]): boolean {
  return actions.every((action) => hasPermission(role, action));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Action[] {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? Array.from(permissions) : [];
}

/**
 * Check if user can perform action on resource
 */
export function canPerform(
  userRole: Role | undefined,
  action: Action,
  resourceOwnerId?: string,
  userId?: string
): boolean {
  // Check role-based permission
  if (!hasPermission(userRole, action)) {
    return false;
  }

  // For owner-specific actions, check ownership
  if (resourceOwnerId && userId && resourceOwnerId !== userId) {
    // Only ADMIN can perform actions on resources they don't own
    if (userRole !== 'ADMIN') {
      return false;
    }
  }

  return true;
}

/**
 * Get role description
 */
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    ADMIN: 'Full access to all features and settings',
    ANALYST: 'Can view and manage findings, verify remediations',
    DEVELOPER: 'Can run analyses and view findings',
    VIEWER: 'Read-only access to findings and analytics',
  };
  return descriptions[role] || 'Unknown role';
}

/**
 * Get human-readable action name
 */
export function getActionName(action: Action): string {
  const actionNames: Record<Action, string> = {
    [Action.CREATE_PROJECT]: 'Create Project',
    [Action.READ_PROJECT]: 'View Project',
    [Action.UPDATE_PROJECT]: 'Edit Project',
    [Action.DELETE_PROJECT]: 'Delete Project',
    [Action.RUN_ANALYSIS]: 'Run Analysis',
    [Action.CANCEL_ANALYSIS]: 'Cancel Analysis',

    [Action.READ_FINDING]: 'View Finding',
    [Action.UPDATE_FINDING]: 'Edit Finding',
    [Action.DELETE_FINDING]: 'Delete Finding',
    [Action.ASSIGN_FINDING]: 'Assign Finding',
    [Action.CHANGE_FINDING_STATUS]: 'Change Status',
    [Action.VERIFY_REMEDIATION]: 'Verify Remediation',

    [Action.CREATE_ALERT_RULE]: 'Create Alert Rule',
    [Action.UPDATE_ALERT_RULE]: 'Edit Alert Rule',
    [Action.DELETE_ALERT_RULE]: 'Delete Alert Rule',
    [Action.READ_ALERT_RULE]: 'View Alert Rule',

    [Action.MANAGE_USERS]: 'Manage Users',
    [Action.VIEW_METRICS]: 'View Metrics',
    [Action.VIEW_ANALYTICS]: 'View Analytics',
    [Action.MODIFY_SETTINGS]: 'Modify Settings',
    [Action.MANAGE_AGENTS]: 'Manage Agents',

    [Action.CREATE_REPORT]: 'Create Report',
    [Action.EXPORT_REPORT]: 'Export Report',
    [Action.DELETE_REPORT]: 'Delete Report',
  };
  return actionNames[action] || action;
}
