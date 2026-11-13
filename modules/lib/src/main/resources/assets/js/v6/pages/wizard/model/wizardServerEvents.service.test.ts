import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MovedContentItem } from '../../../../app/browse/MovedContentItem';
import type { Content } from '../../../../app/content/Content';
import type { ContentId } from '../../../../app/content/ContentId';
import type { ContentPath } from '../../../../app/content/ContentPath';
import type { ContentSummaryAndCompareStatus } from '../../../../app/content/ContentSummaryAndCompareStatus';
import type { ContentServerChangeItem } from '../../../../app/event/ContentServerChangeItem';

const mocks = vi.hoisted(() => ({
    exists: vi.fn(),
    handleError: vi.fn(),
    project: { parents: [] as string[], name: 'child' },
}));

vi.mock('../../../../app/event/ContentServerEventsHandler', () => ({ ContentServerEventsHandler: {} }));
vi.mock('../../../../app/settings/event/ProjectDeletedEvent', () => ({ ProjectDeletedEvent: {} }));
vi.mock('../../../../app/resource/ContentSummaryAndCompareStatusFetcher', () => ({
    ContentSummaryAndCompareStatusFetcher: class {},
}));
vi.mock('../../../../app/repository/RepositoryId', () => ({
    RepositoryId: { fromProjectName: (name: string) => `repo.${name}` },
}));
vi.mock('../../../../app/resource/ContentsExistRequest', () => ({
    ContentsExistRequest: class {
        private project = '';
        constructor(private readonly ids: string[]) {}
        setRequestProjectName = (project: string) => {
            this.project = project;
            return this;
        };
        sendAndParse = () => mocks.exists(this.ids, this.project);
    },
}));
vi.mock('../../../entities/project', () => ({
    getActiveProject: () => ({
        hasParents: () => mocks.project.parents.length > 0,
        getParents: () => mocks.project.parents,
    }),
    getActiveProjectName: () => mocks.project.name,
}));
vi.mock('../../../shared/notifications', () => ({ handleError: mocks.handleError }));
vi.mock('../../../shared/lib/page/templateEvent', () => ({
    isDeletedTemplateForContent: (path: { template?: boolean } | null) => path?.template === true,
}));

import { createWizardServerEventHandlers, type WizardServerEventsHost } from './wizardServerEvents.service';

const idOf = (value: string): ContentId =>
    ({
        value,
        equals: (other: { value: string }) => other?.value === value,
        toString: () => value,
    }) as unknown as ContentId;

const pathOf = (value: string): ContentPath =>
    ({
        value,
        equals: (other: { value: string }) => other.value === value,
        isDescendantOf: (other: { value: string }) => value.startsWith(`${other.value}/`),
    }) as unknown as ContentPath;

const summaryOf = (id: string, path = `/${id}`): ContentSummaryAndCompareStatus =>
    ({
        id,
        getContentId: () => idOf(id),
        getPath: () => pathOf(path),
        equals: () => false,
    }) as unknown as ContentSummaryAndCompareStatus;

const changeOf = (id: string, repo = 'repo.child', template = false): ContentServerChangeItem =>
    ({
        getContentId: () => idOf(id),
        getPath: () => ({ template }),
        getRepo: () => repo,
    }) as unknown as ContentServerChangeItem;

const PERSISTED = {
    getContentId: () => idOf('current'),
    getPath: () => pathOf('/site/current'),
    isInherited: () => true,
} as unknown as Content;

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('wizardServerEvents.service', () => {
    let host: { [K in keyof WizardServerEventsHost]: ReturnType<typeof vi.fn> };
    let saving = false;
    let persisted: Content | undefined;
    const fetcher = { fetch: vi.fn(), fetchByContent: vi.fn() };

    const handlers = () => createWizardServerEventHandlers(host as unknown as WizardServerEventsHost, fetcher as never);

    beforeEach(() => {
        saving = false;
        persisted = PERSISTED;
        mocks.project.parents = [];
        mocks.exists.mockReset();
        mocks.handleError.mockReset();
        fetcher.fetch.mockReset();
        fetcher.fetchByContent.mockReset();
        host = {
            getPersistedContent: vi.fn(() => persisted),
            isSaving: vi.fn(() => saving),
            applySummary: vi.fn(),
            applySorted: vi.fn(),
            otherContentUpdated: vi.fn(),
            templatesDeleted: vi.fn(),
            descendantsPublishChanged: vi.fn(),
            publishStateChanged: vi.fn(),
            setExistsInParentProject: vi.fn(),
            closeDeleted: vi.fn(),
        };
    });

    describe('updated', () => {
        it('should tell the edited content from the others', () => {
            const current = summaryOf('current');
            const other = summaryOf('other');

            handlers().updated([current, other]);

            expect(host.applySummary).toHaveBeenCalledExactlyOnceWith(current);
            expect(host.otherContentUpdated).toHaveBeenCalledExactlyOnceWith(other);
        });

        it('should ignore the echoes of its own save', () => {
            saving = true;

            handlers().updated([summaryOf('current'), summaryOf('other')]);

            expect(host.applySummary).not.toHaveBeenCalled();
            expect(host.otherContentUpdated).not.toHaveBeenCalled();
        });

        it('should treat everything as another content before the content exists', () => {
            persisted = undefined;

            handlers().updated([summaryOf('current')]);

            expect(host.otherContentUpdated).toHaveBeenCalledTimes(1);
        });
    });

    describe('moved', () => {
        const moved = (id: string, oldPath: string): MovedContentItem =>
            ({ item: summaryOf(id), oldPath: pathOf(oldPath) }) as unknown as MovedContentItem;

        it('should follow a move of the content or of one of its ancestors', () => {
            handlers().moved([moved('current', '/old/current')]);
            handlers().moved([moved('site', '/site')]);

            expect(host.applySummary).toHaveBeenCalledTimes(1);
            expect(host.otherContentUpdated).toHaveBeenCalledTimes(1);
        });

        it('should ignore a move elsewhere', () => {
            handlers().moved([moved('other', '/elsewhere')]);

            expect(host.applySummary).not.toHaveBeenCalled();
            expect(host.otherContentUpdated).not.toHaveBeenCalled();
        });
    });

    it('should apply a sort of the edited content only', () => {
        const current = summaryOf('current');

        handlers().sorted([summaryOf('other')]);
        handlers().sorted([summaryOf('other'), current]);

        expect(host.applySorted).toHaveBeenCalledExactlyOnceWith(current);
    });

    describe('renamed', () => {
        it('should apply its own rename', () => {
            const current = summaryOf('current');

            handlers().renamed([current], [pathOf('/site/old')]);

            expect(host.applySummary).toHaveBeenCalledExactlyOnceWith(current);
        });

        it('should fetch its summary again when an ancestor is renamed', async () => {
            const fresh = summaryOf('current');
            fetcher.fetchByContent.mockResolvedValue(fresh);

            handlers().renamed([summaryOf('site')], [pathOf('/site')]);
            await flush();

            expect(fetcher.fetchByContent).toHaveBeenCalledWith(PERSISTED);
            expect(host.applySummary).toHaveBeenCalledExactlyOnceWith(fresh);
        });
    });

    describe('publishChanged', () => {
        it('should apply the publish status of the edited content', () => {
            const current = summaryOf('current');

            handlers().publishChanged([current, summaryOf('child', '/site/current/child')]);

            expect(host.applySummary).toHaveBeenCalledExactlyOnceWith(current);
            expect(host.descendantsPublishChanged).not.toHaveBeenCalled();
            expect(host.publishStateChanged).toHaveBeenCalledTimes(1);
        });

        it('should notice descendants published without the content', () => {
            handlers().publishChanged([summaryOf('child', '/site/current/child')]);

            expect(host.descendantsPublishChanged).toHaveBeenCalledTimes(1);
            expect(host.publishStateChanged).toHaveBeenCalledTimes(1);
        });
    });

    describe('permissionsUpdated', () => {
        it('should fetch and apply the summary of the edited content', async () => {
            const fresh = summaryOf('current');
            fetcher.fetch.mockResolvedValue(fresh);

            handlers().permissionsUpdated([idOf('other'), idOf('current')]);
            await flush();

            expect(host.applySummary).toHaveBeenCalledExactlyOnceWith(fresh);
        });

        it('should skip other contents and its own save', () => {
            handlers().permissionsUpdated([idOf('other')]);
            saving = true;
            handlers().permissionsUpdated([idOf('current')]);

            expect(fetcher.fetch).not.toHaveBeenCalled();
        });
    });

    describe('deleted and archived', () => {
        it('should close when the content is deleted, before looking at templates', () => {
            handlers().deleted([changeOf('template', 'repo.child', true), changeOf('current')]);

            expect(host.closeDeleted).toHaveBeenCalledTimes(1);
            expect(host.templatesDeleted).not.toHaveBeenCalled();
        });

        it('should report deleted templates', () => {
            handlers().deleted([changeOf('template', 'repo.child', true), changeOf('other')]);

            expect(host.templatesDeleted).toHaveBeenCalledTimes(1);
            expect(host.templatesDeleted.mock.calls[0][0]).toHaveLength(1);
            expect(host.closeDeleted).not.toHaveBeenCalled();
        });

        it('should close when the content is archived or its project deleted', () => {
            handlers().archived([changeOf('other')]);
            expect(host.closeDeleted).not.toHaveBeenCalled();

            handlers().archived([changeOf('current')]);
            handlers().projectDeleted('other-project');
            handlers().projectDeleted('child');

            expect(host.closeDeleted).toHaveBeenCalledTimes(2);
        });
    });

    describe('deletedInOtherRepos', () => {
        it('should ask whether the content still exists in the parent project', async () => {
            mocks.project.parents = ['parent'];
            mocks.exists.mockResolvedValue({ getContentsExistMap: () => new Map([['current', false]]) });

            handlers().deletedInOtherRepos([changeOf('current', 'repo.parent')]);
            await flush();

            expect(mocks.exists).toHaveBeenCalledWith(['current'], 'parent');
            expect(host.setExistsInParentProject).toHaveBeenCalledExactlyOnceWith(false);
        });

        it('should ignore deletions in unrelated repositories and projects without parents', async () => {
            handlers().deletedInOtherRepos([changeOf('current', 'repo.parent')]);
            mocks.project.parents = ['parent'];
            handlers().deletedInOtherRepos([changeOf('current', 'repo.unrelated')]);
            await flush();

            expect(mocks.exists).not.toHaveBeenCalled();
        });
    });
});
