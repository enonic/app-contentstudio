import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { type ApplicationConfig } from '@enonic/lib-admin-ui/application/ApplicationConfig';
import { type Project } from '../../../../app/settings/data/project/Project';
import { type ProjectPermissions } from '../../../../app/settings/data/project/ProjectPermissions';
import { type ProjectReadAccess } from '../../../../app/settings/data/project/ProjectReadAccess';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import {
    createProject,
    deleteProject,
    listProjects,
    updateProject,
    updateProjectPermissions,
    updateProjectReadAccess,
} from './projects.api';

vi.mock('../../../../app/settings/data/project/Project', () => ({
    Project: { fromJson: (json: unknown) => ({ projectFrom: json }) },
}));

vi.mock('../../../../app/settings/data/project/ProjectHelper', () => ({
    ProjectHelper: { sortProjects: () => 0 },
}));

const appConfigStub = { toJson: () => ({ key: 'com.app', config: {} }) } as unknown as ApplicationConfig;
const readAccessStub = { toJson: () => ({ type: 'public' }) } as unknown as ProjectReadAccess;
const permissionsStub = {
    toJson: () => ({ owner: ['user:system:su'], editor: [], contributor: [], author: [] }),
} as unknown as ProjectPermissions;
const parentStub = { getName: () => 'parent-project' } as unknown as Readonly<Project>;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
});

afterEach(() => {
    restoreFetch();
});

describe('listProjects', () => {
    it('should GET the project list resolving unavailable projects and parse each project', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ projects: [{ name: 'p-1' }] }));

        const result = await listProjects();

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/project/list?resolveUnavailable=true');
        expect(url).not.toContain('/cms/');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([{ projectFrom: { name: 'p-1' } }]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await listProjects();

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('createProject', () => {
    it('should POST the full create payload with parents and read access', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ name: 'p-new' }));

        const result = await createProject({
            name: 'p-new',
            displayName: 'New project',
            description: 'd',
            language: 'no',
            applicationConfigs: [appConfigStub],
            parents: [parentStub],
            readAccess: readAccessStub,
        });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/project/create');
        expect(init.method).toBe('POST');

        const body = JSON.parse(init.body);
        expect(Object.keys(body)).toEqual([
            'name',
            'displayName',
            'description',
            'language',
            'applicationConfigs',
            'parents',
            'readAccess',
        ]);
        expect(body.applicationConfigs).toEqual([{ key: 'com.app', config: {} }]);
        expect(body.parents).toEqual(['parent-project']);
        expect(body.readAccess).toEqual({ type: 'public' });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ projectFrom: { name: 'p-new' } });
    });

    it('should omit parents and read access when not provided', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ name: 'p-new' }));

        await createProject({ name: 'p-new', displayName: 'New project', applicationConfigs: [] });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.parents).toBeUndefined();
        expect(body.readAccess).toBeUndefined();
    });
});

describe('updateProject', () => {
    it('should POST the base payload to the modify endpoint', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ name: 'p-1' }));

        const result = await updateProject({
            name: 'p-1',
            displayName: 'Renamed',
            description: 'd',
            language: 'en',
            applicationConfigs: [],
        });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/project/modify');
        const body = JSON.parse(init.body);
        expect(Object.keys(body)).toEqual(['name', 'displayName', 'description', 'language', 'applicationConfigs']);
        expect(result.isOk()).toBe(true);
    });
});

describe('updateProjectPermissions', () => {
    it('should POST the permissions with the viewer list merged in', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ owner: [] }));

        const result = await updateProjectPermissions('p-1', permissionsStub, [
            PrincipalKey.fromString('user:system:su'),
        ]);

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/project/modifyPermissions');
        expect(JSON.parse(init.body)).toEqual({
            name: 'p-1',
            permissions: {
                owner: ['user:system:su'],
                editor: [],
                contributor: [],
                author: [],
                viewer: ['user:system:su'],
            },
        });
        expect(result.isOk()).toBe(true);
    });
});

describe('updateProjectReadAccess', () => {
    it('should POST the read access and parse the task id', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-ra' }));

        const result = await updateProjectReadAccess('p-1', readAccessStub);

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/project/modifyReadAccess');
        expect(JSON.parse(init.body)).toEqual({ name: 'p-1', readAccess: { type: 'public' } });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().toString()).toBe('t-ra');
    });
});

describe('deleteProject', () => {
    it('should POST the project name to the delete endpoint and resolve void', async () => {
        mockFetch.mockResolvedValue(jsonResponse(true));

        const result = await deleteProject('p-1');

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/project/delete');
        expect(JSON.parse(init.body)).toEqual({ name: 'p-1' });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await deleteProject('p-1');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
