export const ROLES = ['anonymous', 'user', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = ['public:read', 'account:read', 'account:write', 'admin:read'] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  anonymous: ['public:read'],
  user: ['public:read', 'account:read', 'account:write'],
  admin: ['public:read', 'account:read', 'account:write', 'admin:read'],
};

export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
