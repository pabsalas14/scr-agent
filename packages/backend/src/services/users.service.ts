import { prisma } from './prisma.service';
import { logger } from './logger.service';
import { Role } from '@prisma/client';

export class UsersService {
  async getAllUsers() {
    try {
      return await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          roles: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserDetail(userId: string) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: true,
          assignments: {
            include: {
              finding: { include: { analysis: true } },
            },
          },
          statusChanges: true,
          settings: true,
        },
      });
    } catch (error) {
      logger.error('Error fetching user detail:', error);
      throw error;
    }
  }

  async getUsersByRole(role: Role) {
    try {
      return await prisma.user.findMany({
        where: {
          roles: {
            some: { role },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
        },
      });
    } catch (error) {
      logger.error('Error fetching users by role:', error);
      throw error;
    }
  }

  async assignRole(userId: string, role: Role) {
    try {
      const userRole = await prisma.userRole.upsert({
        where: {
          userId_role: {
            userId,
            role,
          },
        },
        update: {},
        create: { userId, role },
      });

      logger.info(`Role ${role} assigned to user ${userId}`);
      return userRole;
    } catch (error) {
      logger.error('Error assigning role:', error);
      throw error;
    }
  }

  async removeRole(userId: string, role: Role) {
    try {
      await prisma.userRole.delete({
        where: {
          userId_role: {
            userId,
            role,
          },
        },
      });

      logger.info(`Role ${role} removed from user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error removing role:', error);
      throw error;
    }
  }

  async getUserAssignments(userId: string) {
    try {
      return await prisma.findingAssignment.findMany({
        where: { assignedTo: userId },
        include: {
          finding: {
            include: {
              analysis: true,
              statusHistory: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
              remediation: true,
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error fetching user assignments:', error);
      throw error;
    }
  }

  async getAnalystAssignments(analysisId: string) {
    try {
      return await prisma.findingAssignment.findMany({
        where: {
          finding: { analysisId },
        },
        include: {
          assignedUser: true,
          finding: true,
        },
        orderBy: { assignedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error fetching analyst assignments:', error);
      throw error;
    }
  }

  async canUserAccessFinding(userId: string, findingId: string): Promise<boolean> {
    try {
      // Get user roles
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
      });

      const roles = userRoles.map((ur) => ur.role);

      // ADMIN can access everything
      if (roles.includes('ADMIN')) return true;

      // ANALYST can access findings assigned to them
      if (roles.includes('ANALYST')) {
        const assignment = await prisma.findingAssignment.findUnique({
          where: { findingId },
        });
        return assignment?.assignedTo === userId;
      }

      // DEVELOPER can access their own findings
      if (roles.includes('DEVELOPER')) {
        const assignment = await prisma.findingAssignment.findUnique({
          where: { findingId },
        });
        return assignment?.assignedTo === userId;
      }

      // VIEWER cannot modify
      return false;
    } catch (error) {
      logger.error('Error checking user access:', error);
      throw error;
    }
  }

  async getUserRole(userId: string): Promise<Role | null> {
    try {
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      // Return highest privilege role
      const roleHierarchy: Record<Role, number> = {
        ADMIN: 4,
        ANALYST: 3,
        DEVELOPER: 2,
        VIEWER: 1,
      };

      let highestRole: Role | null = null;
      let highestPriority = 0;

      userRoles.forEach((ur) => {
        if (roleHierarchy[ur.role] > highestPriority) {
          highestRole = ur.role;
          highestPriority = roleHierarchy[ur.role];
        }
      });

      return highestRole;
    } catch (error) {
      logger.error('Error getting user role:', error);
      throw error;
    }
  }
}

export const usersService = new UsersService();
