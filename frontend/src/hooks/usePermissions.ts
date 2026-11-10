import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

export interface Permissions {
  isAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  /** Can delete patients, records, manage users */
  canDelete: boolean;
  /** Can manage staff accounts */
  canManageUsers: boolean;
  /** Can create clinical records (partograph, postnatal) */
  canCreateClinical: boolean;
  /** Can view audit logs */
  canViewAudit: boolean;
  /** Can send SMS reminders */
  canSendReminders: boolean;
  /** Check if the current user owns a record (by recorded_by id) */
  isOwnRecord: (recordedById: number | null | undefined) => boolean;
}

/**
 * usePermissions
 * ──────────────
 * Returns a permission object derived from the current user's role.
 * Use this to gate UI elements, buttons, and menu items.
 */
export function usePermissions(): Permissions {
  const { user, isAdmin, isDoctor, isNurse } = useAuth();

  return useMemo(() => ({
    isAdmin,
    isDoctor,
    isNurse,
    canDelete:         isAdmin,
    canManageUsers:    isAdmin,
    canCreateClinical: isAdmin || isNurse || isDoctor,
    canViewAudit:      isAdmin,
    canSendReminders:  isAdmin || isNurse,
    isOwnRecord:       (recordedById: number | null | undefined) =>
      recordedById != null && user?.id === recordedById,
  }), [user, isAdmin, isDoctor, isNurse]);
}
