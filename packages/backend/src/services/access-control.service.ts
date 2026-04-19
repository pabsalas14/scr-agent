import { usersService } from './users.service';

export type AccessControlMode = 'global' | 'owner_admin';

export function getAccessControlMode(): AccessControlMode {
  const raw = (process.env['ACCESS_CONTROL_MODE'] || 'global').toLowerCase();
  return raw === 'owner_admin' ? 'owner_admin' : 'global';
}

export async function canAccessOwnedResource(params: {
  currentUserId?: string | null;
  resourceOwnerId?: string | null;
}): Promise<boolean> {
  const { currentUserId, resourceOwnerId } = params;
  const mode = getAccessControlMode();
  if (mode === 'global') return true;
  if (!currentUserId) return false;

  const role = await usersService.getUserRole(currentUserId);
  if (role === 'ADMIN') return true;
  return !!resourceOwnerId && resourceOwnerId === currentUserId;
}

