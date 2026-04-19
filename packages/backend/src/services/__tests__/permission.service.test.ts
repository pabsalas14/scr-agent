/**
 * Permission Service Tests (PHASE 3.5)
 */

import { Role } from '@prisma/client';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canPerform,
  getPermissionsForRole,
  Action,
} from '../permission.service';

describe('Permission Service', () => {
  describe('hasPermission', () => {
    it('should grant ADMIN all permissions', () => {
      expect(hasPermission('ADMIN', Action.DELETE_PROJECT)).toBe(true);
      expect(hasPermission('ADMIN', Action.MANAGE_USERS)).toBe(true);
    });

    it('should grant ANALYST specific permissions', () => {
      expect(hasPermission('ANALYST', Action.ASSIGN_FINDING)).toBe(true);
      expect(hasPermission('ANALYST', Action.VERIFY_REMEDIATION)).toBe(true);
      expect(hasPermission('ANALYST', Action.DELETE_PROJECT)).toBe(false);
    });

    it('should grant DEVELOPER limited permissions', () => {
      expect(hasPermission('DEVELOPER', Action.RUN_ANALYSIS)).toBe(true);
      expect(hasPermission('DEVELOPER', Action.READ_FINDING)).toBe(true);
      expect(hasPermission('DEVELOPER', Action.MANAGE_USERS)).toBe(false);
    });

    it('should grant VIEWER read-only permissions', () => {
      expect(hasPermission('VIEWER', Action.READ_PROJECT)).toBe(true);
      expect(hasPermission('VIEWER', Action.READ_FINDING)).toBe(true);
      expect(hasPermission('VIEWER', Action.RUN_ANALYSIS)).toBe(false);
    });

    it('should return false for undefined role', () => {
      expect(hasPermission(undefined, Action.READ_PROJECT)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if role has at least one permission', () => {
      const actions = [Action.READ_PROJECT, Action.DELETE_PROJECT];
      expect(hasAnyPermission('DEVELOPER', actions)).toBe(true);
    });

    it('should return false if role has none of the permissions', () => {
      const actions = [Action.DELETE_PROJECT, Action.MANAGE_USERS];
      expect(hasAnyPermission('VIEWER', actions)).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if role has all permissions', () => {
      const actions = [Action.READ_PROJECT, Action.RUN_ANALYSIS];
      expect(hasAllPermissions('DEVELOPER', actions)).toBe(true);
    });

    it('should return false if role lacks any permission', () => {
      const actions = [Action.READ_PROJECT, Action.MANAGE_USERS];
      expect(hasAllPermissions('VIEWER', actions)).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return all permissions for ADMIN', () => {
      const perms = getPermissionsForRole('ADMIN');
      expect(perms.length).toBeGreaterThan(20);
    });

    it('should return subset for VIEWER', () => {
      const perms = getPermissionsForRole('VIEWER');
      expect(perms.length).toBeLessThan(10);
    });
  });

  describe('canPerform', () => {
    it('should allow action if user has permission', () => {
      expect(canPerform('ANALYST', Action.VERIFY_REMEDIATION)).toBe(true);
    });

    it('should deny action if user lacks permission', () => {
      expect(canPerform('VIEWER', Action.DELETE_PROJECT)).toBe(false);
    });

    it('should allow ADMIN to perform any action', () => {
      expect(canPerform('ADMIN', Action.MANAGE_USERS)).toBe(true);
    });
  });
});
