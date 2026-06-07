import { useUserStore } from '@/store/useUserStore';
import { hasPermission, canAccessZone } from '@/utils/auth';
import type { UserRole } from '@/utils/auth';

export const usePermission = () => {
  const currentUser = useUserStore((state) => state.currentUser);

  const checkPermission = (requiredRole: UserRole): boolean => {
    return hasPermission(currentUser?.role, requiredRole);
  };

  const checkZoneAccess = (zoneId: string): boolean => {
    return canAccessZone(currentUser, zoneId);
  };

  const isInspector = currentUser?.role === 'inspector';
  const isLeader = currentUser?.role === 'leader';
  const isControl = currentUser?.role === 'control';
  const isAdmin = currentUser?.role === 'admin';

  return {
    currentUser,
    checkPermission,
    checkZoneAccess,
    isInspector,
    isLeader,
    isControl,
    isAdmin,
  };
};
