import type { UserRole } from '../types';

/**
 * Auth abstraction. Travellers use the app in guest mode today; the admin
 * dashboard uses Supabase Auth when configured. Vendor self-service logins
 * plug in here later without touching screens.
 */
export interface SessionUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  operatorId: string | null;
}

export type Permission =
  | 'packages:write'
  | 'trips:write'
  | 'vehicles:write'
  | 'vehicles:approve'
  | 'operators:write'
  | 'operators:verify'
  | 'destinations:write'
  | 'bookings:read'
  | 'bookings:write'
  | 'reviews:moderate'
  | 'settings:write';

/** Future-ready permission matrix. Agency / vehicle owner rights are scoped to their own operatorId. */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: ['packages:write', 'trips:write', 'vehicles:write', 'vehicles:approve', 'operators:write', 'operators:verify', 'destinations:write', 'bookings:read', 'bookings:write', 'reviews:moderate', 'settings:write'],
  admin: ['packages:write', 'trips:write', 'vehicles:write', 'vehicles:approve', 'operators:write', 'operators:verify', 'destinations:write', 'bookings:read', 'bookings:write', 'reviews:moderate'],
  staff: ['bookings:read', 'bookings:write', 'reviews:moderate'],
  agency: ['packages:write', 'trips:write', 'vehicles:write', 'bookings:read', 'bookings:write'],
  vehicle_owner: ['vehicles:write', 'bookings:read'],
  traveller: [],
};

export function can(user: Pick<SessionUser, 'role'> | null, permission: Permission): boolean {
  return !!user && ROLE_PERMISSIONS[user.role].includes(permission);
}
