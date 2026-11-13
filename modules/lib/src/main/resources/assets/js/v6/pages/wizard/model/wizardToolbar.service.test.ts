import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentSummaryAndCompareStatus } from '../../../../app/content/ContentSummaryAndCompareStatus';

const mocks = vi.hoisted(() => ({
    collaborationEnabled: false,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    principals: vi.fn(),
    projects: vi.fn(),
    project: vi.fn(),
    projectUpdatedOn: vi.fn(),
    projectUpdatedUn: vi.fn(),
    openRename: vi.fn(),
    save: vi.fn(),
    setDraftName: vi.fn(),
    handleError: vi.fn(),
    openContextWidget: vi.fn(),
    draftName: undefined as string | undefined,
    online: false,
}));

const projectOf = (name: string, displayName = '', language = '', parents = false) => ({
    getName: () => name,
    getDisplayName: () => displayName,
    getLanguage: () => language,
    getIcon: () => null,
    hasParents: () => parents,
});

vi.mock('@enonic/lib-admin-ui/auth/AuthContext', () => ({
    AuthContext: { get: () => ({ getUser: () => ({ getKey: () => 'user:me', getDisplayName: () => 'Me' }) }) },
}));
vi.mock('@enonic/lib-admin-ui/security/PrincipalKey', () => ({ PrincipalKey: { fromString: (key: string) => key } }));
vi.mock('@enonic/lib-admin-ui/util/Config', () => ({ CONFIG: { isTrue: () => mocks.collaborationEnabled } }));
vi.mock('../../../../app/content/ContentName', () => ({
    ContentName: class {
        constructor(readonly value: string) {}
    },
}));
vi.mock('../../../../app/content/ContentUnnamed', () => ({ ContentUnnamed: { UNNAMED_PREFIX: '__unnamed__' } }));
vi.mock('../../../../app/publish/PublishStatus', () => ({ PublishStatus: { OFFLINE: 'OFFLINE', ONLINE: 'ONLINE' } }));
vi.mock('../../../../app/security/GetPrincipalsByKeysRequest', () => ({
    GetPrincipalsByKeysRequest: class {
        constructor(private readonly keys: string[]) {}
        sendAndParse = () => mocks.principals(this.keys);
    },
}));
vi.mock('../../../../app/settings/data/project/Project', () => ({
    Project: { create: () => ({ setName: (name: string) => ({ build: () => projectOf(name) }) }) },
}));
vi.mock('../../../../app/settings/event/ProjectUpdatedEvent', () => ({
    ProjectUpdatedEvent: { on: mocks.projectUpdatedOn, un: mocks.projectUpdatedUn },
}));
vi.mock('../../../../app/settings/resource/ProjectGetRequest', () => ({
    ProjectGetRequest: class {
        sendAndParse = () => mocks.project();
    },
}));
vi.mock('../../../../app/settings/resource/ProjectListRequest', () => ({
    ProjectListRequest: class {
        sendAndParse = () => mocks.projects();
    },
}));
vi.mock('../../../../app/stores/collaboration', () => ({ subscribe: mocks.subscribe }));
vi.mock('../../../../app/util/UrlHelper', () => ({
    UrlHelper: { createContentBrowseUrl: (name: string) => `/${name}` },
}));
vi.mock('../../../entities/project/activeProject.store', () => ({
    getActiveProject: () => projectOf('site', 'Site', 'no', true),
    getActiveProjectName: () => 'site',
}));
vi.mock('../../../features/rename/model/renameContentDialog.store', () => ({
    openRenameContentDialog: mocks.openRename,
}));
vi.mock('../../../shared/lib/cms/content/paths', () => ({ normalizeContentPathName: (name: string) => name }));
vi.mock('../../../shared/lib/cms/content/status', () => ({ calcTreePublishStatus: () => 'OFFLINE' }));
vi.mock('../../../shared/lib/widget/layers', () => ({ LAYERS_WIDGET_NAME: 'layers' }));
vi.mock('../../../shared/notifications', () => ({ handleError: mocks.handleError }));
vi.mock('../../../widgets/context-panel/openContextWidget', () => ({ openContextWidget: mocks.openContextWidget }));
vi.mock('./wizardActions.commands', () => ({ saveWizardContent: mocks.save }));
vi.mock('./wizardActions.store', () => ({
    $wizardActionFacts: { get: () => ({ summary: { online: mocks.online } }) },
}));
vi.mock('./wizardContent.store', () => ({
    $wizardDraftName: { get: () => mocks.draftName },
    setDraftName: mocks.setDraftName,
}));
vi.mock('./wizardToolbar.store', async () => {
    const { map } = await import('nanostores');
    const $wizardToolbar = map<Record<string, unknown>>({});
    const set = (key: string) => (value: unknown) => $wizardToolbar.setKey(key, value);

    return {
        $wizardToolbar,
        resetWizardToolbar: () => $wizardToolbar.set({}),
        setWizardToolbarCanRenameContentPath: set('canRenameContentPath'),
        setWizardToolbarCollaborators: set('collaborators'),
        setWizardToolbarContentInheritance: (inherited: boolean, dataInherited: boolean) => {
            $wizardToolbar.setKey('isContentInherited', inherited);
            $wizardToolbar.setKey('isContentDataInherited', dataInherited);
        },
        setWizardToolbarContentName: set('contentName'),
        setWizardToolbarContentParentPath: set('contentParentPath'),
        setWizardToolbarIsContentOnline: set('isContentOnline'),
        setWizardToolbarIsLayerProject: set('isLayerProject'),
        setWizardToolbarProjectInfo: (name: string, language: string) => {
            $wizardToolbar.setKey('projectName', name);
            $wizardToolbar.setKey('projectLanguage', language);
        },
        setWizardToolbarProjectLabel: set('projectLabel'),
        setWizardToolbarPublishStatus: set('publishStatus'),
    };
});

import { renameWizardContent, setWizardToolbarItem, startWizardToolbar } from './wizardToolbar.service';
import { $wizardToolbar } from './wizardToolbar.store';

type ItemOptions = { name?: string; publishStatus?: string | null; path?: boolean };

const itemOf = ({ name = 'post', publishStatus = 'ONLINE', path = true }: ItemOptions = {}) =>
    ({
        getContentId: () => 'content-id',
        getPublishStatus: () => publishStatus,
        getContentSummary: () => ({ getName: () => name }),
        getPath: () => (path ? { getName: () => name, getParentPath: () => ({ toString: () => '/site' }) } : undefined),
        isInherited: () => true,
        isDataInherited: () => false,
    }) as unknown as ContentSummaryAndCompareStatus;

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const state = (): Record<string, unknown> => $wizardToolbar.get() as unknown as Record<string, unknown>;

describe('wizardToolbar.service', () => {
    let stop: () => void = () => undefined;

    beforeEach(() => {
        stop();
        Object.values(mocks).forEach((mock) => typeof mock === 'function' && mock.mockReset());
        mocks.collaborationEnabled = false;
        mocks.draftName = undefined;
        mocks.online = false;
        mocks.projects.mockResolvedValue([projectOf('site', 'My site', 'en')]);
        mocks.subscribe.mockReturnValue(mocks.unsubscribe);
        stop = startWizardToolbar();
    });

    it('should show the active project at once and its label once loaded', async () => {
        stop();
        stop = startWizardToolbar();

        expect(state()).toMatchObject({ projectName: 'site', projectLanguage: 'no', isLayerProject: true });

        await flush();

        expect(state()).toMatchObject({ projectLabel: 'My site (en)', projectLanguage: 'en', isLayerProject: false });
    });

    it('should fall back to the project name when the projects cannot be loaded', async () => {
        stop();
        mocks.projects.mockRejectedValue(new Error('nope'));
        stop = startWizardToolbar();
        await flush();

        expect(state().projectLabel).toBe('site');
        expect(mocks.handleError).toHaveBeenCalledTimes(1);
    });

    it('should show the content', () => {
        setWizardToolbarItem(itemOf());

        expect(state()).toMatchObject({
            publishStatus: 'ONLINE',
            contentName: 'post',
            contentParentPath: '/site',
            canRenameContentPath: true,
            isContentOnline: true,
            isContentInherited: true,
            isContentDataInherited: false,
        });
    });

    it('should prefer the draft name and hide an unnamed one', () => {
        setWizardToolbarItem(itemOf({ name: '__unnamed__123', publishStatus: null }));
        expect(state()).toMatchObject({ contentName: '', publishStatus: 'OFFLINE', isContentOnline: false });

        mocks.draftName = 'draft';
        setWizardToolbarItem(itemOf());
        expect(state().contentName).toBe('draft');
    });

    it('should clear the store and stop listening when stopped', () => {
        setWizardToolbarItem(itemOf());

        stop();

        expect(state()).toEqual({});
        expect(mocks.projectUpdatedUn).toHaveBeenCalledTimes(1);
    });

    describe('collaboration', () => {
        beforeEach(() => {
            mocks.collaborationEnabled = true;
        });

        it('should not join unless collaboration is enabled', () => {
            mocks.collaborationEnabled = false;
            setWizardToolbarItem(itemOf());

            expect(mocks.subscribe).not.toHaveBeenCalled();
        });

        it('should join once per content and leave when stopped', () => {
            setWizardToolbarItem(itemOf());
            setWizardToolbarItem(itemOf());

            expect(mocks.subscribe).toHaveBeenCalledTimes(1);
            expect(mocks.subscribe.mock.calls[0].slice(0, 2)).toEqual(['content-id', 'site']);

            stop();
            expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
        });

        it('should list the current user first and name the others', async () => {
            mocks.principals.mockResolvedValue([{ getKey: () => 'user:ann', getDisplayName: () => 'Ann' }]);
            setWizardToolbarItem(itemOf());

            mocks.subscribe.mock.calls[0][2](new Set(['user:ann', 'user:me']));
            await flush();

            expect(mocks.principals).toHaveBeenCalledWith(['user:ann']);
            expect(state().collaborators).toEqual([
                { key: 'user:me', label: 'Me', isCurrent: true },
                { key: 'user:ann', label: 'Ann', isCurrent: false },
            ]);
        });

        it('should show the keys when the names cannot be loaded', async () => {
            mocks.principals.mockRejectedValue(new Error('nope'));
            setWizardToolbarItem(itemOf());

            mocks.subscribe.mock.calls[0][2](new Set(['user:bob']));
            await flush();

            expect(state().collaborators).toEqual([{ key: 'user:bob', label: 'user:bob', isCurrent: false }]);
        });
    });

    describe('rename', () => {
        it('should save the new name as a rename', async () => {
            mocks.online = true;
            mocks.openRename.mockResolvedValue('renamed');
            setWizardToolbarItem(itemOf());

            renameWizardContent();
            await flush();

            expect(mocks.openRename).toHaveBeenCalledWith(
                expect.objectContaining({ initialName: 'post', persistedName: 'post', isPublished: true }),
            );
            expect(mocks.setDraftName).toHaveBeenCalledWith(expect.objectContaining({ value: 'renamed' }));
            expect(mocks.save).toHaveBeenCalledWith({ renamed: true });
        });

        it('should save nothing when the dialog is cancelled', async () => {
            mocks.openRename.mockResolvedValue(undefined);
            setWizardToolbarItem(itemOf());

            renameWizardContent();
            await flush();

            expect(mocks.save).not.toHaveBeenCalled();
        });

        it('should not open without content or a path', () => {
            renameWizardContent();
            setWizardToolbarItem(itemOf({ path: false }));
            renameWizardContent();

            expect(mocks.openRename).not.toHaveBeenCalled();
        });
    });
});
