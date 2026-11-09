import { Principal as LegacyPrincipal } from '@enonic/lib-admin-ui/security/Principal';
import { PrincipalKey as LegacyPrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { RoleKeys } from '@enonic/lib-admin-ui/security/RoleKeys';
import {
    ADMIN_ROLE_KEY,
    ANONYMOUS_USER_KEY,
    AUTHENTICATED_ROLE_KEY,
    CMS_ADMIN_ROLE_KEY,
    CMS_EXPERT_ROLE_KEY,
    EVERYONE_ROLE_KEY,
    principalPath,
    SUPER_USER_KEY,
    USER_ADMIN_ROLE_KEY,
} from '@enonic/ui-utils';
import { describe, expect, it } from 'vitest';
import { fromLegacyPrincipal, fromLegacyPrincipalKey, toLegacyPrincipal, toLegacyPrincipalKey } from './legacy';
import {
    isAnonymousPrincipal,
    isSystemUser,
    parsePrincipal,
    principalDescription,
    type PrincipalJson,
} from './principal';

const KEYS = ['user:system:su', 'user:myidp:john', 'group:myidp:editors', 'role:cms.admin', 'role:system.everyone'];

describe('parsePrincipal', () => {
    it('should read the same values the legacy class returns', () => {
        for (const key of KEYS) {
            const json = { key, displayName: 'Name', description: 'About', modifiedTime: '2026-01-01T00:00:00Z' };
            const principal = parsePrincipal(json);
            const legacy = LegacyPrincipal.fromJson(json);

            expect(principal.key, key).toBe(legacy.getKey().toString());
            expect(principal.displayName, key).toBe(legacy.getDisplayName());
            expect(principal.type === 'user', key).toBe(legacy.isUser());
            expect(principal.type === 'group', key).toBe(legacy.isGroup());
            expect(principal.type === 'role', key).toBe(legacy.isRole());
            expect(principalDescription(principal) ?? '', key).toBe(legacy.getDescription());
        }
    });

    it('should keep the fields lib-auth sends for a user', () => {
        expect(
            parsePrincipal({
                key: 'user:system:john',
                displayName: 'John',
                email: 'john@example.com',
                login: 'john',
            } as PrincipalJson),
        ).toEqual({
            type: 'user',
            key: 'user:system:john',
            displayName: 'John',
            email: 'john@example.com',
            login: 'john',
        });
    });

    it('should leave description and modifiedTime out when the wire omits them or sends null', () => {
        expect(parsePrincipal({ key: 'role:cms.admin', displayName: 'Admin', description: null })).toEqual({
            type: 'role',
            key: 'role:cms.admin',
            displayName: 'Admin',
        });
    });
});

describe('principalPath', () => {
    it('should spell the path the way the legacy key does', () => {
        for (const key of KEYS) {
            expect(principalPath(parsePrincipal({ key, displayName: '' }).key), key).toBe(
                LegacyPrincipalKey.fromString(key).toPath(),
            );
        }
    });
});

describe('system principals', () => {
    it('should name the keys the way the legacy constants do', () => {
        expect(ANONYMOUS_USER_KEY).toBe(LegacyPrincipalKey.ofAnonymous().toString());
        expect(SUPER_USER_KEY).toBe(LegacyPrincipalKey.ofSU().toString());
        expect(ADMIN_ROLE_KEY).toBe(RoleKeys.ADMIN.toString());
        expect(CMS_ADMIN_ROLE_KEY).toBe(RoleKeys.CMS_ADMIN.toString());
        expect(CMS_EXPERT_ROLE_KEY).toBe(RoleKeys.CMS_EXPERT.toString());
        expect(USER_ADMIN_ROLE_KEY).toBe(RoleKeys.USER_ADMIN.toString());
        expect(EVERYONE_ROLE_KEY).toBe(RoleKeys.EVERYONE.toString());
        expect(AUTHENTICATED_ROLE_KEY).toBe(RoleKeys.AUTHENTICATED.toString());
    });

    it('should tell the anonymous user and the system users apart the way the legacy key does', () => {
        for (const key of [...KEYS, 'user:system:anonymous']) {
            const legacy = LegacyPrincipalKey.fromString(key);
            const parsed = fromLegacyPrincipalKey(legacy);

            expect(isAnonymousPrincipal(parsed), key).toBe(legacy.isAnonymous());
            expect(isSystemUser(parsed), key).toBe(
                legacy.equals(LegacyPrincipalKey.ofAnonymous()) || legacy.equals(LegacyPrincipalKey.ofSU()),
            );
        }
    });
});

describe('legacy converters', () => {
    it('should round-trip a key', () => {
        for (const key of KEYS) {
            expect(fromLegacyPrincipalKey(toLegacyPrincipalKey(parsePrincipal({ key, displayName: '' }).key))).toBe(
                key,
            );
        }
    });

    it('should round-trip a principal', () => {
        const principal = parsePrincipal({ key: 'group:myidp:editors', displayName: 'Editors', description: 'All' });
        const legacy = toLegacyPrincipal(principal);

        expect(legacy.getKey().toString()).toBe('group:myidp:editors');
        expect(legacy.getDisplayName()).toBe('Editors');
        expect(legacy.getDescription()).toBe('All');
        expect(fromLegacyPrincipal(legacy)).toEqual(principal);
    });
});
