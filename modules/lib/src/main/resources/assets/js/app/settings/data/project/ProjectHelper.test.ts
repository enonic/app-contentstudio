import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {setActiveProject} from '../../../../v6/features/store/activeProject.store';
import {Project} from './Project';
import {ProjectHelper} from './ProjectHelper';

const PROJECT_NAME = 'my-project';

const USER = Principal.fromJson({
    key: 'user:system:tester',
    displayName: 'Tester',
    modifiedTime: new Date().toISOString(),
});

function rolePrincipal(roleId: string): Principal {
    return Principal.fromJson({
        key: PrincipalKey.ofRole(roleId).toString(),
        displayName: roleId,
        modifiedTime: new Date().toISOString(),
    });
}

function initPrincipals(principals: Principal[]): void {
    AuthContext.init(USER, principals);
}

function projectRole(role: string): Principal {
    return rolePrincipal(`cms.project.${PROJECT_NAME}.${role}`);
}

describe('ProjectHelper.canRequestPublish', () => {
    beforeEach(() => {
        setActiveProject(Project.create().setName(PROJECT_NAME).setDisplayName('My Project').build());
    });

    afterEach(() => {
        setActiveProject(undefined);
        vi.restoreAllMocks();
    });

    it('should allow a system admin', () => {
        initPrincipals([rolePrincipal('system.admin')]);

        expect(ProjectHelper.canRequestPublish()).toBe(true);
    });

    it('should allow a content admin', () => {
        initPrincipals([rolePrincipal('cms.admin')]);

        expect(ProjectHelper.canRequestPublish()).toBe(true);
    });

    it.each(['owner', 'editor', 'author', 'contributor'])(
        'should allow a project %s',
        (role) => {
            initPrincipals([projectRole(role)]);

            expect(ProjectHelper.canRequestPublish()).toBe(true);
        });

    it('should allow a role granted transitively via a group membership', () => {
        // Group membership is resolved server-side into the user's principals.
        initPrincipals([rolePrincipal('group:system:editors'), projectRole('contributor')]);

        expect(ProjectHelper.canRequestPublish()).toBe(true);
    });

    it('should deny a viewer-only user', () => {
        initPrincipals([projectRole('viewer')]);

        expect(ProjectHelper.canRequestPublish()).toBe(false);
    });

    it('should deny a user with no project role', () => {
        initPrincipals([rolePrincipal('system.authenticated')]);

        expect(ProjectHelper.canRequestPublish()).toBe(false);
    });

    it('should deny a role that belongs to a different project', () => {
        initPrincipals([rolePrincipal('cms.project.other-project.contributor')]);

        expect(ProjectHelper.canRequestPublish()).toBe(false);
    });

    it('should deny a non-admin when no project is active', () => {
        setActiveProject(undefined);
        initPrincipals([projectRole('contributor')]);

        expect(ProjectHelper.canRequestPublish()).toBe(false);
    });
});
