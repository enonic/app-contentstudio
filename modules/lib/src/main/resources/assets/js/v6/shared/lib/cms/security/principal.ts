import { type Principal, type PrincipalKey, type PrincipalRecord } from '@enonic/ui-types';
import { ANONYMOUS_USER_KEY, parsePrincipalKey, SUPER_USER_KEY, toPrincipal } from '@enonic/ui-utils';

export type PrincipalJson = {
    key: string;
    displayName: string;
    description?: string | null;
    modifiedTime?: string | null;
};

export function parsePrincipal(json: PrincipalJson): Principal {
    const { key, description, modifiedTime, ...rest } = json;

    return toPrincipal({
        ...rest,
        key: parsePrincipalKey(key),
        ...(description != null && { description }),
        ...(modifiedTime != null && { modifiedTime }),
    } as PrincipalRecord);
}

// XP keeps a description on users too; the toolkit's User, copied from lib-auth, does not declare it.
export const principalDescription = (principal: Principal): string | undefined =>
    (principal as { description?: string }).description;

export const isAnonymousPrincipal = (key: PrincipalKey): boolean => key === ANONYMOUS_USER_KEY;

export const isSystemUser = (key: PrincipalKey): boolean => key === ANONYMOUS_USER_KEY || key === SUPER_USER_KEY;
