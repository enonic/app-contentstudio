import { PrincipalKey as LegacyPrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { RoleKeys } from '@enonic/lib-admin-ui/security/RoleKeys';
import { type PrincipalKey } from '@enonic/ui-types';
import { parsePrincipalKey } from '@enonic/ui-utils';
import { describe, expect, it } from 'vitest';
import { hasAdminRole, hasContentAdminRole, hasContentExpertRole, hasUserAdminRole } from './roles';

const KEYS: PrincipalKey[] = [
    'role:system.admin',
    'role:cms.admin',
    'role:cms.expert',
    'role:system.user.admin',
    'role:system.everyone',
    'role:system.authenticated',
    'role:cms.project.default.owner',
    'user:system:su',
    'group:myidp:editors',
].map(parsePrincipalKey);

const legacyAnswer = (check: (key: LegacyPrincipalKey) => boolean) => (keys: PrincipalKey[]) =>
    keys.some((key) => check(LegacyPrincipalKey.fromString(key)));

describe('roles', () => {
    it.each([
        ['hasAdminRole', hasAdminRole, legacyAnswer(RoleKeys.isAdmin)],
        ['hasContentAdminRole', hasContentAdminRole, legacyAnswer(RoleKeys.isContentAdmin)],
        ['hasUserAdminRole', hasUserAdminRole, legacyAnswer(RoleKeys.isUserAdmin)],
        ['hasContentExpertRole', hasContentExpertRole, legacyAnswer(RoleKeys.isContentExpert)],
    ])('%s should answer the way RoleKeys does for every single key', (_, check, legacy) => {
        for (const key of KEYS) {
            expect(check([key]), key).toBe(legacy([key]));
        }
        expect(check([])).toBe(false);
    });

    it('should look through the whole list', () => {
        expect(hasContentAdminRole(['group:myidp:editors', 'role:cms.admin'])).toBe(true);
        expect(hasContentAdminRole(['group:myidp:editors', 'role:cms.expert'])).toBe(false);
    });
});
