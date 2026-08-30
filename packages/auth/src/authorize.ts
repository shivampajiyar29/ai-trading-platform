import { forbidden } from './errors.js';
import type { Principal } from './principal.js';
import { roleHasPermission, type Permission } from './roles.js';
import type { SecurityAudit } from './security-audit.js';

export function can(principal: Principal, permission: Permission): boolean {
  return roleHasPermission(principal.role, permission);
}

export function authorize(principal: Principal, permission: Permission, audit?: SecurityAudit): void {
  if (!can(principal, permission)) {
    audit?.record('AUTHORIZATION_DENIED', principal.id, 'denied', { permission });
    throw forbidden(`Missing permission: ${permission}`);
  }
}
