import { forbidden } from './errors.js';
import type { Principal } from './principal.js';
import { roleHasPermission, type Permission } from './roles.js';

export function can(principal: Principal, permission: Permission): boolean {
  return roleHasPermission(principal.role, permission);
}

export function authorize(principal: Principal, permission: Permission): void {
  if (!can(principal, permission)) {
    throw forbidden(`Missing permission: ${permission}`);
  }
}
