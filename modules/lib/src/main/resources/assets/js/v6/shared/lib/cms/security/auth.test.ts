import { beforeEach, describe, expect, it } from 'vitest';
import { $config } from '../../../config/config.store';
import { getCurrentUser, getUserPrincipalKeys, isAdmin, isContentAdmin, isContentExpert, isUserAdmin } from './auth';
import { parsePrincipal } from './principal';

const user = parsePrincipal({ key: 'user:myidp:john', displayName: 'John' });
const editors = parsePrincipal({ key: 'group:myidp:editors', displayName: 'Editors' });
const cmsAdmin = parsePrincipal({ key: 'role:cms.admin', displayName: 'CMS admin' });

describe('auth', () => {
    beforeEach(() => {
        $config.setKey('user', user);
        $config.setKey('principals', [editors, cmsAdmin]);
    });

    it('should read the current user and the membership keys off the config', () => {
        expect(getCurrentUser()).toBe(user);
        expect(getUserPrincipalKeys()).toEqual(['group:myidp:editors', 'role:cms.admin']);
    });

    it('should answer the role checks from the memberships', () => {
        expect(isContentAdmin()).toBe(true);
        expect(isContentExpert()).toBe(true);
        expect(isAdmin()).toBe(false);
        expect(isUserAdmin()).toBe(false);
    });

    it('should deny everything without memberships', () => {
        $config.setKey('principals', []);

        expect(isContentAdmin()).toBe(false);
        expect(isAdmin()).toBe(false);
    });
});
