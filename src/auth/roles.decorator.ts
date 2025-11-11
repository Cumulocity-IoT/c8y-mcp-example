import { SetMetadata } from '@nestjs/common';

export enum Role {
  ADMIN = 'ROLE_AI_AGENT_ADMIN',
  READ = 'ROLE_AI_AGENT_READ',
}

export const ALL_ROLES_KEY = 'allRoles';
export const ANY_ROLES_KEY = 'anyRoles';
/**
 * Verifies if the user has all of the specified roles.
 * This decorator can be used to protect routes or methods that require
 * all of the specified roles to access.
 * @param roles - The roles to check against.
 * @returns A metadata decorator that sets the roles to check.
 */
export const AllRoles = (...roles: Role[]) => SetMetadata(ALL_ROLES_KEY, roles);
/**
 * Verifies if the user has any of the specified roles.
 * This decorator can be used to protect routes or methods that require
 * at least one of the specified roles to access.
 * @param roles - The roles to check against.
 * @returns A metadata decorator that sets the roles to check.
 */
export const AnyRoles = (...roles: Role[]) => SetMetadata(ANY_ROLES_KEY, roles);
