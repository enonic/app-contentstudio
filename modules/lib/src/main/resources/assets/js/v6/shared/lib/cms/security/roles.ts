import { type PrincipalKey } from '@enonic/ui-types';
import { ADMIN_ROLE_KEY, CMS_ADMIN_ROLE_KEY, CMS_EXPERT_ROLE_KEY, USER_ADMIN_ROLE_KEY } from '@enonic/ui-utils';

const CONTENT_ADMIN_ROLES: readonly PrincipalKey[] = [ADMIN_ROLE_KEY, CMS_ADMIN_ROLE_KEY];
const USER_ADMIN_ROLES: readonly PrincipalKey[] = [ADMIN_ROLE_KEY, USER_ADMIN_ROLE_KEY];
const CONTENT_EXPERT_ROLES: readonly PrincipalKey[] = [ADMIN_ROLE_KEY, CMS_ADMIN_ROLE_KEY, CMS_EXPERT_ROLE_KEY];

const hasAnyOf = (keys: readonly PrincipalKey[], roles: readonly PrincipalKey[]): boolean =>
    keys.some((key) => roles.includes(key));

export const hasAdminRole = (keys: readonly PrincipalKey[]): boolean => keys.includes(ADMIN_ROLE_KEY);

export const hasContentAdminRole = (keys: readonly PrincipalKey[]): boolean => hasAnyOf(keys, CONTENT_ADMIN_ROLES);

export const hasUserAdminRole = (keys: readonly PrincipalKey[]): boolean => hasAnyOf(keys, USER_ADMIN_ROLES);

export const hasContentExpertRole = (keys: readonly PrincipalKey[]): boolean => hasAnyOf(keys, CONTENT_EXPERT_ROLES);
