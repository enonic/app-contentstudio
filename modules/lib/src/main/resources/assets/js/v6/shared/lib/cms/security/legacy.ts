import { Principal as LegacyPrincipal } from '@enonic/lib-admin-ui/security/Principal';
import { PrincipalKey as LegacyPrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { type Principal, type PrincipalKey } from '@enonic/ui-types';
import { parsePrincipalKey } from '@enonic/ui-utils';
import { parsePrincipal, principalDescription } from './principal';

export const toLegacyPrincipalKey = (key: PrincipalKey): LegacyPrincipalKey => LegacyPrincipalKey.fromString(key);

export const fromLegacyPrincipalKey = (key: LegacyPrincipalKey): PrincipalKey => parsePrincipalKey(key.toString());

export const toLegacyPrincipal = (principal: Principal): LegacyPrincipal =>
    LegacyPrincipal.create()
        .setKey(toLegacyPrincipalKey(principal.key))
        .setDisplayName(principal.displayName)
        .setDescription(principalDescription(principal) ?? '')
        .build();

export const fromLegacyPrincipal = (principal: LegacyPrincipal): Principal =>
    parsePrincipal({
        key: principal.getKey().toString(),
        displayName: principal.getDisplayName(),
        description: principal.getDescription() || undefined,
    });
