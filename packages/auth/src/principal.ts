import { permissionsFor, type Permission, type Role } from './roles.js';

export type Principal = {
  id: string;
  role: Role;
  permissions: readonly Permission[];
};

export const ANONYMOUS_PRINCIPAL: Principal = {
  id: 'anonymous',
  role: 'anonymous',
  permissions: permissionsFor('anonymous'),
};

export function principalFor(id: string, role: Role): Principal {
  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error('Principal id cannot be empty');
  }
  return {
    id: trimmed,
    role,
    permissions: permissionsFor(role),
  };
}
