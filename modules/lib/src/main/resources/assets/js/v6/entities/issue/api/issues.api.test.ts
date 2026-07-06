import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { IssueStatus } from '../../../../app/issue/IssueStatus';
import { IssueType } from '../../../../app/issue/IssueType';
import { type PublishRequest } from '../../../../app/issue/PublishRequest';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import {
    createIssue,
    createIssueComment,
    deleteIssueComment,
    fetchIssue,
    listIssueComments,
    listIssues,
    updateIssue,
    updateIssueComment,
} from './issues.api';

vi.mock('../../../../app/issue/Issue', () => ({
    Issue: { fromJson: (json: unknown) => ({ issueFrom: json }) },
}));

vi.mock('../../../../app/issue/IssueWithAssignees', () => ({
    IssueWithAssignees: { fromJson: (json: unknown) => ({ issueWithAssigneesFrom: json }) },
}));

vi.mock('../../../../app/issue/IssueComment', () => ({
    IssueComment: {
        fromJson: (json: { id: string; createdTime: string }) => ({
            commentFrom: json,
            getCreatedTime: () => new Date(json.createdTime),
        }),
    },
}));

// The IssueComment module is mocked above; assertions read the mock-injected field.
type MockedComment = { commentFrom: { id: string } };

const publishRequestStub = {
    toJson: () => ({ excludeIds: ['x-1'], items: [{ id: 'i-1', includeChildren: true }] }),
} as unknown as PublishRequest;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

describe('listIssues', () => {
    it('should POST the list payload with a null type and parse the issues and total', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ issues: [{ id: 'iss-1' }], metadata: { totalHits: 7 } }));

        const result = await listIssues({ from: 0, size: 50 });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/issue/list');
        expect(init.method).toBe('POST');

        const body = JSON.parse(init.body);
        expect(Object.keys(body)).toEqual(['type', 'from', 'size', 'assignedToMe', 'createdByMe', 'resolveAssignees']);
        expect(body).toEqual({
            type: null,
            from: 0,
            size: 50,
            assignedToMe: false,
            createdByMe: false,
            resolveAssignees: true,
        });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({
            issues: [{ issueWithAssigneesFrom: { id: 'iss-1' } }],
            totalHits: 7,
        });
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await listIssues({ from: 0, size: 50 });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('createIssue', () => {
    it('should POST the create payload with a null schedule and parse the issue', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'iss-new' }));

        const result = await createIssue({
            title: 'My issue',
            description: 'Details',
            approvers: [PrincipalKey.fromString('user:system:su')],
            publishRequest: publishRequestStub,
        });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/issue/create');

        const body = JSON.parse(init.body);
        expect(Object.keys(body)).toEqual(['title', 'description', 'approvers', 'publishRequest', 'schedule']);
        expect(body).toEqual({
            title: 'My issue',
            description: 'Details',
            approvers: ['user:system:su'],
            publishRequest: { excludeIds: ['x-1'], items: [{ id: 'i-1', includeChildren: true }] },
            schedule: null,
        });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ issueFrom: { id: 'iss-new' } });
    });

    it('should omit approvers from the payload when none are given', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'iss-new' }));

        await createIssue({ title: 't', description: '', publishRequest: publishRequestStub });

        const [, init] = mockFetch.mock.calls[0];
        expect(Object.keys(JSON.parse(init.body))).toEqual(['title', 'description', 'publishRequest', 'schedule']);
    });

    it('should serialize the type name before the schedule for the publish-request variant', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'iss-new' }));

        await createIssue({
            title: 't',
            description: '',
            publishRequest: publishRequestStub,
            type: IssueType.PUBLISH_REQUEST,
        });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(Object.keys(body)).toEqual(['title', 'description', 'publishRequest', 'type', 'schedule']);
        expect(body.type).toBe('PUBLISH_REQUEST');
    });
});

describe('fetchIssue', () => {
    it('should GET the issue by id with the id as a query param', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'iss-1' }));

        const result = await fetchIssue('iss-1');

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/issue/id?id=iss-1');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ issueFrom: { id: 'iss-1' } });
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(404, 'Not Found'));

        const result = await fetchIssue('iss-404');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('updateIssue', () => {
    it('should POST the full update payload with an always-present publish schedule', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'iss-1' }));

        const result = await updateIssue({
            id: 'iss-1',
            title: 'Renamed',
            description: 'd',
            status: IssueStatus.CLOSED,
            approvers: [PrincipalKey.fromString('user:system:su')],
            publishRequest: publishRequestStub,
            publishFrom: new Date('2030-01-01T00:00:00.000Z'),
        });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/issue/update');

        const body = JSON.parse(init.body);
        expect(Object.keys(body)).toEqual([
            'id',
            'title',
            'description',
            'status',
            'publishSchedule',
            'isPublish',
            'autoSave',
            'approvers',
            'publishRequest',
        ]);
        expect(body.status).toBe('CLOSED');
        expect(body.publishSchedule).toEqual({ from: '2030-01-01T00:00:00.000Z', to: null });
        expect(body.isPublish).toBe(false);
        expect(body.autoSave).toBe(false);
        expect(body.approvers).toEqual(['user:system:su']);
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ issueFrom: { id: 'iss-1' } });
    });

    it('should emit a null-null publish schedule and omit unset lists for the minimal update', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'iss-1' }));

        await updateIssue({ id: 'iss-1', title: 't', description: '', status: IssueStatus.OPEN });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(Object.keys(body)).toEqual([
            'id',
            'title',
            'description',
            'status',
            'publishSchedule',
            'isPublish',
            'autoSave',
        ]);
        expect(body.status).toBe('OPEN');
        expect(body.publishSchedule).toEqual({ from: null, to: null });
    });
});

describe('listIssueComments', () => {
    it('should POST the comment list payload and parse comments sorted by created time', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({
                issueComments: [
                    { id: 'c-2', createdTime: '2030-01-02T00:00:00.000Z' },
                    { id: 'c-1', createdTime: '2030-01-01T00:00:00.000Z' },
                ],
                metadata: { totalHits: 2 },
            }),
        );

        const result = await listIssueComments('iss-1');

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/issue/comment/list');

        const body = JSON.parse(init.body);
        expect(body).toEqual({ issue: 'iss-1', from: 0, size: 150 });
        expect(result.isOk()).toBe(true);
        const commentIds = result
            ._unsafeUnwrap()
            .map((comment) => (comment as unknown as MockedComment).commentFrom.id);
        expect(commentIds).toEqual(['c-1', 'c-2']);
    });
});

describe('createIssueComment', () => {
    it('should POST the comment payload with the creator key', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'c-1', createdTime: '2030-01-01T00:00:00.000Z' }));

        const result = await createIssueComment({
            issueId: 'iss-1',
            text: 'hello',
            creator: PrincipalKey.fromString('user:system:su'),
        });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/issue/comment');
        expect(url).not.toContain('comment/list');

        expect(JSON.parse(init.body)).toEqual({ issue: 'iss-1', text: 'hello', creator: 'user:system:su' });
        expect(result.isOk()).toBe(true);
        expect((result._unsafeUnwrap() as unknown as MockedComment).commentFrom.id).toBe('c-1');
    });
});

describe('updateIssueComment', () => {
    it('should POST the comment id and text to the update endpoint', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'c-1', createdTime: '2030-01-01T00:00:00.000Z' }));

        const result = await updateIssueComment({ commentId: 'c-1', text: 'edited' });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/issue/comment/update');
        expect(JSON.parse(init.body)).toEqual({ comment: 'c-1', text: 'edited' });
        expect(result.isOk()).toBe(true);
    });
});

describe('deleteIssueComment', () => {
    it('should POST the comment id and derive the result from the returned ids', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ ids: ['c-1'] }));

        const result = await deleteIssueComment('c-1');

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/issue/comment/delete');
        expect(JSON.parse(init.body)).toEqual({ comment: 'c-1' });
        expect(result._unsafeUnwrap()).toBe(true);
    });

    it('should resolve false when the server deletes nothing', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ ids: [] }));

        const result = await deleteIssueComment('c-404');

        expect(result._unsafeUnwrap()).toBe(false);
    });
});
