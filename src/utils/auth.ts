import type { User } from '@/types';

export type UserRole = 'inspector' | 'leader' | 'control' | 'admin';

const roleHierarchy: Record<UserRole, number> = {
  inspector: 1,
  leader: 2,
  control: 3,
  admin: 4,
};

export const hasPermission = (
  userRole: UserRole | undefined,
  requiredRole: UserRole
): boolean => {
  if (!userRole) return false;
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const canAccessZone = (user: User | null, zoneId: string): boolean => {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'control') return true;
  return user.zoneIds.includes(zoneId);
};

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    inspector: '巡线员',
    leader: '分区组长',
    control: '总控中心',
    admin: '管理员',
  };
  return labels[role] || role;
};
