import { type Principal, type PrincipalKey } from '@enonic/ui-types';
import { $config } from '../../../config/config.store';
import { hasAdminRole, hasContentAdminRole, hasContentExpertRole, hasUserAdminRole } from './roles';

export const getCurrentUser = (): Principal | undefined => $config.get().user;

export function requireCurrentUser(): Principal {
    const user = getCurrentUser();
    if (!user) {
        throw new Error('No current user in the config');
    }
    return user;
}

export const getUserPrincipalKeys = (): PrincipalKey[] => $config.get().principals.map((principal) => principal.key);

export const isAdmin = (): boolean => hasAdminRole(getUserPrincipalKeys());

export const isContentAdmin = (): boolean => hasContentAdminRole(getUserPrincipalKeys());

export const isUserAdmin = (): boolean => hasUserAdminRole(getUserPrincipalKeys());

export const isContentExpert = (): boolean => hasContentExpertRole(getUserPrincipalKeys());
