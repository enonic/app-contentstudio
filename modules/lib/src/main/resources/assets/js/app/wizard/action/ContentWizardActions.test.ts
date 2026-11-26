import { ManagedActionState } from '@enonic/lib-admin-ui/managedaction/ManagedActionState';
import type { Action } from '@enonic/lib-admin-ui/ui/Action';
import Q from 'q';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Permission } from '../../../v6/shared/lib/cms/permissions/Permission';
import type { Content } from '../../content/Content';
import type { ContentSummaryAndCompareStatus } from '../../content/ContentSummaryAndCompareStatus';
import type { ContentWizardPanel } from '../ContentWizardPanel';

const mocks = vi.hoisted(() => ({
    writePermissions: [] as boolean[],
    canRequestPublish: false,
    hasContentType: true,
    parentPermissions: [] as number[],
    rootPermissions: [] as number[],
    hasUnpublishedChildren: false,
    unpublishedChildrenRequests: 0,
    managedActionListeners: [] as ((state: number) => void)[],
    openPublishDialog: vi.fn(),
    showWarning: vi.fn(),
}));

const fakeAction = vi.hoisted(() => async (exportName: string, label: string, enabled = true) => {
    const { Action: LibAction } = await import('@enonic/lib-admin-ui/ui/Action');

    class FakeAction extends LibAction {
        constructor() {
            super(label);
            this.setEnabled(enabled);
        }

        setWritePermissions(value: boolean): void {
            mocks.writePermissions.push(value);
        }
    }

    return { [exportName]: FakeAction };
});

// Actions outside the rules under test: their own dependencies reach into the page editor.
vi.mock('./PreviewAction', () => fakeAction('PreviewAction', 'preview', false));
vi.mock('./ShowLiveEditAction', () => fakeAction('ShowLiveEditAction', 'showLiveEdit'));
vi.mock('./ShowFormAction', () => fakeAction('ShowFormAction', 'showForm'));
vi.mock('@enonic/lib-admin-ui/app/wizard/CloseAction', () => fakeAction('CloseAction', 'close'));

vi.mock('../../../v6/shared/ui/dialogs/DialogPreset', () => ({
    DialogPresetConfirmElement: class {},
}));

vi.mock('../../../v6/features/publish/model/publishDialog.commands', () => ({
    openPublishDialog: mocks.openPublishDialog,
}));

vi.mock('@enonic/lib-admin-ui/notify/MessageBus', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    showWarning: mocks.showWarning,
}));

vi.mock('@enonic/lib-admin-ui/util/Messages', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    i18n: (key: string) => key,
}));

vi.mock('@enonic/lib-admin-ui/util/AppHelper', async (importOriginal) => {
    const original = await importOriginal<typeof import('@enonic/lib-admin-ui/util/AppHelper')>();

    class AppHelper extends original.AppHelper {
        static debounce(func: (...args: unknown[]) => unknown): (...args: unknown[]) => void {
            return (...args: unknown[]) => {
                func(...args);
            };
        }
    }

    return { ...original, AppHelper };
});

vi.mock('@enonic/lib-admin-ui/DefaultErrorHandler', () => ({
    DefaultErrorHandler: { handle: vi.fn() },
}));

vi.mock('@enonic/lib-admin-ui/managedaction/ManagedActionManager', () => ({
    ManagedActionManager: {
        instance: () => ({
            onManagedActionStateChanged: (listener: (state: number) => void) => {
                mocks.managedActionListeners.push(listener);
            },
        }),
    },
}));

vi.mock('../AccessControlHelper', () => ({
    AccessControlHelper: {
        hasPermission: (permission: number, acl: number[]) => acl.includes(permission),
    },
}));

vi.mock('../../settings/data/project/ProjectHelper', () => ({
    ProjectHelper: { canRequestPublish: () => mocks.canRequestPublish },
}));

vi.mock('../../../v6/shared/lib/cms/content/status', () => ({
    isOnline: (summary: { online: boolean }) => summary.online,
    isPublished: (summary: { published: boolean }) => summary.published,
}));

vi.mock('../../resource/GetContentByPathRequest', () => ({
    GetContentByPathRequest: class {
        sendAndParse() {
            return Promise.resolve({ getContentId: () => 'parent' });
        }
    },
}));

vi.mock('../../resource/GetContentPermissionsByIdRequest', () => ({
    GetContentPermissionsByIdRequest: class {
        sendAndParse() {
            return Promise.resolve(mocks.parentPermissions);
        }
    },
}));

vi.mock('../../resource/GetContentRootPermissionsRequest', () => ({
    GetContentRootPermissionsRequest: class {
        sendAndParse() {
            return Promise.resolve(mocks.rootPermissions);
        }
    },
}));

vi.mock('../../resource/HasUnpublishedChildrenRequest', () => ({
    HasUnpublishedChildrenRequest: class {
        sendAndParse() {
            mocks.unpublishedChildrenRequests++;
            return Promise.resolve({
                getResult: () => [{ getHasChildren: () => mocks.hasUnpublishedChildren }],
            });
        }
    },
}));

const stores = vi.hoisted(() => ({}) as Record<string, { set: (value: unknown) => void; get: () => unknown }>);

vi.mock('../../../v6/pages/wizard/model/wizardContent.store', async (importOriginal) => {
    const { atom } = await import('nanostores');

    stores.hasChanges = atom(false);
    stores.pathExists = atom({ exists: false });
    stores.contentState = atom(null);

    return {
        ...(await importOriginal<object>()),
        $wizardHasChanges: stores.hasChanges,
        $wizardContentPathExists: stores.pathExists,
        $wizardContentState: stores.contentState,
    };
});

import { $wizardActions, unbindWizardActions } from '../../../v6/features/wizard-actions/model/wizardActions.store';
import { ContentWizardActions } from './ContentWizardActions';
import { SaveAndCloseAction } from './SaveAndCloseAction';

//
// * Fixtures
//

const ALL_PERMISSIONS = [Permission.CREATE, Permission.MODIFY, Permission.DELETE, Permission.PUBLISH];

type PersistedOptions = {
    unnamed?: boolean;
    deletable?: boolean;
    editable?: boolean;
    dataInherited?: boolean;
    permissions?: Permission[];
    hasParent?: boolean;
};

type SummaryOptions = {
    online?: boolean;
    published?: boolean;
    inProgress?: boolean;
    hasChildren?: boolean;
    dataInherited?: boolean;
    hasOriginProject?: boolean;
};

const createPersisted = (options: PersistedOptions = {}): Content => {
    const {
        unnamed = false,
        deletable = true,
        editable = true,
        dataInherited = false,
        permissions = ALL_PERMISSIONS,
        hasParent = true,
    } = options;

    return {
        getName: () => ({ isUnnamed: () => unnamed }),
        isDeletable: () => deletable,
        isEditable: () => editable,
        isDataInherited: () => dataInherited,
        getPermissions: () => permissions,
        hasParent: () => hasParent,
        getPath: () => ({ getParentPath: () => '/parent' }),
    } as unknown as Content;
};

const createSummary = (options: SummaryOptions = {}): ContentSummaryAndCompareStatus => {
    const {
        online = false,
        published = false,
        inProgress = false,
        hasChildren = false,
        dataInherited = false,
        hasOriginProject = false,
    } = options;

    return {
        getContentSummary: () => ({ online, published, isInProgress: () => inProgress }),
        hasChildren: () => hasChildren,
        isDataInherited: () => dataInherited,
        hasOriginProject: () => hasOriginProject,
        getContentId: () => 'content',
    } as unknown as ContentSummaryAndCompareStatus;
};

type PanelState = {
    isNew: boolean;
    persisted: Content;
    existsInParentProject: boolean;
};

type SaveCall = {
    resolve: () => void;
    reject: () => void;
};

const saves: SaveCall[] = [];

const createPanel = (state: PanelState): ContentWizardPanel => {
    let contentState: unknown = null;
    let markedAsReady = false;
    stores.contentState.set(null);

    return {
        isRendered: () => true,
        whenRendered: (callback: () => void) => callback(),
        onPageStateChanged: vi.fn(),
        checkContentCanBePublished: () => {
            const current = contentState;
            return current != null && current !== 'invalid' && mocks.hasContentType;
        },
        setContentStateForTest: (value: unknown) => {
            contentState = value;
        },
        getPersistedItem: () => state.persisted,
        getPersistedSummary: () => state.persisted,
        isNew: () => state.isNew,
        isContentExistsInParentProject: () => state.existsInParentProject,
        hasUnsavedChanges: () => stores.hasChanges.get() === true,
        isMarkedAsReady: () => markedAsReady,
        setMarkedAsReady: (value: boolean) => {
            markedAsReady = value;
        },
        setRequireValid: vi.fn(),
        saveChanges: () => {
            const deferred = Q.defer<Content>();
            saves.push({
                resolve: () => deferred.resolve(state.persisted),
                reject: () => deferred.reject(new Error('save failed')),
            });
            return deferred.promise;
        },
    } as unknown as ContentWizardPanel;
};

const opened: ContentWizardActions[] = [];

const flush = async (): Promise<void> => {
    for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
};

const describeAction = (action: Action | undefined): string => {
    if (action == null) return 'missing';

    const enabled = action.isEnabled() ? 'on' : 'off';
    return action.isVisible() ? enabled : `hidden:${enabled}`;
};

const track = (actions: ContentWizardActions): void => {
    opened.push(actions);
    actions.bindStore();
};

const expectStoreMirrorsActions = (actions: ContentWizardActions): void => {
    if (opened.at(-1) !== actions) return;

    const sources = actions.getStoreSources();
    const store = $wizardActions.get();

    for (const [id, source] of Object.entries(sources)) {
        expect({ id, ...store[id] }).toEqual({
            id,
            label: source.getLabel(),
            enabled: source.isEnabled(),
            visible: source.isVisible(),
        });
    }
};

const describeActions = (actions: ContentWizardActions): Record<string, string> => {
    expectStoreMirrorsActions(actions);
    return describeActionStates(actions);
};

const describeActionStates = (actions: ContentWizardActions): Record<string, string> => ({
    archive: describeAction(actions.getArchiveAction()),
    createIssue: describeAction(actions.getCreateIssueAction()),
    duplicate: describeAction(actions.getDuplicateAction()),
    localize: describeAction(actions.getLocalizeAction()),
    markAsReady: describeAction(actions.getMarkAsReadyAction()),
    move: describeAction(actions.getMoveAction()),
    openRequest: describeAction(actions.getOpenRequestAction()),
    preview: describeAction(actions.getPreviewAction()),
    publish: describeAction(actions.getPublishAction()),
    publishTree: describeAction(actions.getPublishTreeAction()),
    requestPublish: describeAction(actions.getRequestPublishAction()),
    reset: describeAction(actions.getResetAction()),
    save: describeAction(actions.getSaveAction()),
    saveAndClose: describeAction(actions.getActions().find((action) => action instanceof SaveAndCloseAction)),
    saveLabel: actions.getSaveAction().getLabel(),
    unpublish: describeAction(actions.getUnpublishAction()),
});

type Opened = {
    actions: ContentWizardActions;
    panel: ContentWizardPanel;
    setContentState: (value: 'ready' | 'in-progress' | 'invalid') => void;
};

type OpenOptions = {
    persisted?: PersistedOptions;
    summary?: SummaryOptions;
    contentState?: 'ready' | 'in-progress' | 'invalid';
    existsInParentProject?: boolean;
    isNew?: boolean;
};

// The order of the calls follows `WizardPanel.doLoadData` and `ContentWizardPanel.doRenderOnDataLoaded`.
const open = async (options: OpenOptions = {}): Promise<Opened> => {
    const persisted = createPersisted(options.persisted);
    const state: PanelState = {
        isNew: options.isNew ?? false,
        persisted,
        existsInParentProject: options.existsInParentProject ?? false,
    };
    const panel = createPanel(state);
    const setContentState = (value: 'ready' | 'in-progress' | 'invalid'): void => {
        Reflect.get(panel, 'setContentStateForTest')(value);
        stores.contentState.set(value);
    };

    const actions = new ContentWizardActions(panel);
    track(actions);

    if (state.isNew) {
        actions.enableActionsForNew();
    } else {
        void actions.enableActionsForExisting(persisted);
    }

    setContentState(options.contentState ?? 'ready');

    actions
        .setContent(createSummary(options.summary))
        .setContentCanBePublished(panel.checkContentCanBePublished())
        .refreshState();

    await flush();

    return { actions, panel, setContentState };
};

//
// * Tests
//

describe('ContentWizardActions (characterization of the legacy rules)', () => {
    beforeEach(() => {
        mocks.writePermissions = [];
        mocks.canRequestPublish = false;
        mocks.hasContentType = true;
        mocks.parentPermissions = ALL_PERMISSIONS;
        mocks.rootPermissions = ALL_PERMISSIONS;
        mocks.hasUnpublishedChildren = false;
        mocks.unpublishedChildrenRequests = 0;
        mocks.managedActionListeners = [];
        mocks.openPublishDialog.mockClear();
        mocks.showWarning.mockClear();
        saves.length = 0;
        stores.hasChanges.set(false);
        stores.pathExists.set({ exists: false });
    });

    afterEach(() => {
        opened.splice(0).forEach((actions) => actions.cleanupUnsavedChangesListeners());
        unbindWizardActions();
        vi.restoreAllMocks();
    });

    it('existing offline content with every permission', async () => {
        const { actions } = await open();

        expect(describeActions(actions)).toMatchInlineSnapshot(`
          {
            "archive": "on",
            "createIssue": "on",
            "duplicate": "on",
            "localize": "hidden:off",
            "markAsReady": "off",
            "move": "on",
            "openRequest": "hidden:off",
            "preview": "off",
            "publish": "on",
            "publishTree": "off",
            "requestPublish": "off",
            "reset": "hidden:off",
            "save": "off",
            "saveAndClose": "on",
            "saveLabel": "action.save",
            "unpublish": "off",
          }
        `);
    });

    it('enables Save once the form has changes, unless the path is taken', async () => {
        const { actions } = await open();

        stores.hasChanges.set(true);
        const withChanges = describeActions(actions);

        stores.pathExists.set({ exists: true });
        const pathTaken = describeActions(actions);

        expect({ withChanges, pathTaken }).toMatchInlineSnapshot(`
          {
            "pathTaken": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "withChanges": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "on",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
          }
        `);
    });

    it('keeps Save off for content that is not editable or inherits its data', async () => {
        const notEditable = await open({ persisted: { editable: false } });
        stores.hasChanges.set(true);
        const notEditableState = describeActions(notEditable.actions);

        stores.hasChanges.set(false);
        const inherited = await open({ persisted: { dataInherited: true } });
        stores.hasChanges.set(true);
        const inheritedState = describeActions(inherited.actions);

        expect({ notEditable: notEditableState, inherited: inheritedState }).toMatchInlineSnapshot(`
          {
            "inherited": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "notEditable": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
          }
        `);
    });

    it('a user without the modify permission', async () => {
        const { actions } = await open({
            persisted: { permissions: [Permission.CREATE, Permission.DELETE, Permission.PUBLISH] },
            summary: { inProgress: true },
            contentState: 'in-progress',
        });

        stores.hasChanges.set(true);

        expect(describeActions(actions)).toMatchInlineSnapshot(`
          {
            "archive": "on",
            "createIssue": "on",
            "duplicate": "on",
            "localize": "hidden:off",
            "markAsReady": "off",
            "move": "on",
            "openRequest": "hidden:off",
            "preview": "off",
            "publish": "off",
            "publishTree": "off",
            "requestPublish": "off",
            "reset": "hidden:off",
            "save": "off",
            "saveAndClose": "off",
            "saveLabel": "action.save",
            "unpublish": "off",
          }
        `);
    });

    it('a user without the publish permission', async () => {
        const { actions } = await open({
            persisted: { permissions: [Permission.CREATE, Permission.MODIFY, Permission.DELETE] },
            summary: { published: true },
        });

        expect(describeActions(actions)).toMatchInlineSnapshot(`
          {
            "archive": "on",
            "createIssue": "on",
            "duplicate": "on",
            "localize": "hidden:off",
            "markAsReady": "off",
            "move": "on",
            "openRequest": "hidden:off",
            "preview": "off",
            "publish": "off",
            "publishTree": "off",
            "requestPublish": "off",
            "reset": "hidden:off",
            "save": "off",
            "saveAndClose": "on",
            "saveLabel": "action.save",
            "unpublish": "off",
          }
        `);
    });

    it('a user without the delete permission', async () => {
        const { actions } = await open({
            persisted: { permissions: [Permission.CREATE, Permission.MODIFY, Permission.PUBLISH] },
        });

        expect(describeActions(actions)).toMatchInlineSnapshot(`
          {
            "archive": "off",
            "createIssue": "on",
            "duplicate": "on",
            "localize": "hidden:off",
            "markAsReady": "off",
            "move": "on",
            "openRequest": "hidden:off",
            "preview": "off",
            "publish": "on",
            "publishTree": "off",
            "requestPublish": "off",
            "reset": "hidden:off",
            "save": "off",
            "saveAndClose": "on",
            "saveLabel": "action.save",
            "unpublish": "off",
          }
        `);
    });

    it('content that cannot be deleted', async () => {
        const { actions } = await open({ persisted: { deletable: false } });

        expect(describeActions(actions)).toMatchInlineSnapshot(`
          {
            "archive": "off",
            "createIssue": "on",
            "duplicate": "on",
            "localize": "hidden:off",
            "markAsReady": "off",
            "move": "on",
            "openRequest": "hidden:off",
            "preview": "off",
            "publish": "on",
            "publishTree": "off",
            "requestPublish": "off",
            "reset": "hidden:off",
            "save": "off",
            "saveAndClose": "on",
            "saveLabel": "action.save",
            "unpublish": "off",
          }
        `);
    });

    it('online content', async () => {
        const { actions } = await open({ summary: { online: true, published: true } });

        expect(describeActions(actions)).toMatchInlineSnapshot(`
          {
            "archive": "on",
            "createIssue": "on",
            "duplicate": "on",
            "localize": "hidden:off",
            "markAsReady": "off",
            "move": "on",
            "openRequest": "hidden:off",
            "preview": "off",
            "publish": "off",
            "publishTree": "off",
            "requestPublish": "off",
            "reset": "hidden:off",
            "save": "off",
            "saveAndClose": "on",
            "saveLabel": "action.save",
            "unpublish": "on",
          }
        `);
    });

    it('published content with changes since', async () => {
        const { actions } = await open({ summary: { online: false, published: true } });

        expect(describeActions(actions)).toMatchInlineSnapshot(`
          {
            "archive": "on",
            "createIssue": "on",
            "duplicate": "on",
            "localize": "hidden:off",
            "markAsReady": "off",
            "move": "on",
            "openRequest": "hidden:off",
            "preview": "off",
            "publish": "on",
            "publishTree": "off",
            "requestPublish": "off",
            "reset": "hidden:off",
            "save": "off",
            "saveAndClose": "on",
            "saveLabel": "action.save",
            "unpublish": "on",
          }
        `);
    });

    it('invalid content', async () => {
        mocks.canRequestPublish = true;
        const { actions } = await open({ contentState: 'invalid' });

        expect(describeActions(actions)).toMatchInlineSnapshot(`
          {
            "archive": "on",
            "createIssue": "on",
            "duplicate": "on",
            "localize": "hidden:off",
            "markAsReady": "off",
            "move": "on",
            "openRequest": "hidden:off",
            "preview": "off",
            "publish": "off",
            "publishTree": "off",
            "requestPublish": "off",
            "reset": "hidden:off",
            "save": "off",
            "saveAndClose": "on",
            "saveLabel": "action.save",
            "unpublish": "off",
          }
        `);
    });

    it('content without a resolved content type', async () => {
        mocks.hasContentType = false;
        const { actions } = await open();

        expect(describeActions(actions)).toMatchInlineSnapshot(`
          {
            "archive": "on",
            "createIssue": "on",
            "duplicate": "on",
            "localize": "hidden:off",
            "markAsReady": "off",
            "move": "on",
            "openRequest": "hidden:off",
            "preview": "off",
            "publish": "off",
            "publishTree": "off",
            "requestPublish": "off",
            "reset": "hidden:off",
            "save": "off",
            "saveAndClose": "on",
            "saveLabel": "action.save",
            "unpublish": "off",
          }
        `);
    });

    it('content in progress', async () => {
        const { actions } = await open({ summary: { inProgress: true }, contentState: 'in-progress' });

        expect(describeActions(actions)).toMatchInlineSnapshot(`
          {
            "archive": "on",
            "createIssue": "on",
            "duplicate": "on",
            "localize": "hidden:off",
            "markAsReady": "on",
            "move": "on",
            "openRequest": "hidden:off",
            "preview": "off",
            "publish": "on",
            "publishTree": "off",
            "requestPublish": "off",
            "reset": "hidden:off",
            "save": "off",
            "saveAndClose": "on",
            "saveLabel": "action.save",
            "unpublish": "off",
          }
        `);
    });

    it('turns Mark as ready on and off with the content state', async () => {
        const { actions, setContentState } = await open();

        setContentState('in-progress');
        const inProgress = describeActions(actions);

        setContentState('ready');
        const ready = describeActions(actions);

        setContentState('invalid');
        const invalid = describeActions(actions);

        expect({ inProgress, ready, invalid }).toMatchInlineSnapshot(`
          {
            "inProgress": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "on",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "invalid": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "off",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "ready": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
          }
        `);
    });

    it('content with unpublished children', async () => {
        mocks.hasUnpublishedChildren = true;
        const { actions } = await open({ summary: { hasChildren: true } });

        expect({ state: describeActions(actions), requests: mocks.unpublishedChildrenRequests }).toMatchInlineSnapshot(`
          {
            "requests": 1,
            "state": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "on",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
          }
        `);
    });

    it('content whose children are all published', async () => {
        mocks.hasUnpublishedChildren = false;
        const { actions } = await open({ summary: { hasChildren: true } });

        expect({ state: describeActions(actions), requests: mocks.unpublishedChildrenRequests }).toMatchInlineSnapshot(`
          {
            "requests": 1,
            "state": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
          }
        `);
    });

    it('does not ask for the children of a leaf', async () => {
        await open({ summary: { hasChildren: false } });

        expect(mocks.unpublishedChildrenRequests).toBe(0);
    });

    it('asks for the children again only after the check is reset', async () => {
        mocks.hasUnpublishedChildren = true;
        const { actions } = await open({ summary: { hasChildren: true } });

        actions.refreshState();
        await flush();
        const afterRefresh = mocks.unpublishedChildrenRequests;

        actions.resetUnpublishedChildrenCheck().refreshState();
        await flush();
        const afterReset = mocks.unpublishedChildrenRequests;

        expect({ afterRefresh, afterReset }).toMatchInlineSnapshot(`
          {
            "afterRefresh": 1,
            "afterReset": 2,
          }
        `);
    });

    it('request publish, when the project allows it', async () => {
        mocks.canRequestPublish = true;
        const offline = await open();
        const offlineState = describeActions(offline.actions);

        mocks.hasUnpublishedChildren = true;
        const onlineWithChildren = await open({ summary: { online: true, published: true, hasChildren: true } });
        const onlineWithChildrenState = describeActions(onlineWithChildren.actions);

        mocks.hasUnpublishedChildren = false;
        const onlineLeaf = await open({ summary: { online: true, published: true } });
        const onlineLeafState = describeActions(onlineLeaf.actions);

        expect({
            offline: offlineState,
            onlineWithChildren: onlineWithChildrenState,
            onlineLeaf: onlineLeafState,
        }).toMatchInlineSnapshot(`
          {
            "offline": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "on",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "onlineLeaf": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "off",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "on",
            },
            "onlineWithChildren": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "off",
              "publishTree": "on",
              "requestPublish": "on",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "on",
            },
          }
        `);
    });

    it('shows Open request while the content has a publish request', async () => {
        const { actions } = await open();

        actions.setHasPublishRequest(true).refreshState();
        const withRequest = describeActions(actions);

        actions.setHasPublishRequest(false).refreshState();
        const withoutRequest = describeActions(actions);

        expect({ withRequest, withoutRequest }).toMatchInlineSnapshot(`
          {
            "withRequest": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "on",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "withoutRequest": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
          }
        `);
    });

    it('inherited content in a layer', async () => {
        const inherited = await open({
            existsInParentProject: true,
            persisted: { dataInherited: true },
            summary: { hasOriginProject: true, dataInherited: true },
        });
        const inheritedState = describeActions(inherited.actions);

        const localized = await open({
            existsInParentProject: true,
            summary: { hasOriginProject: true, dataInherited: false },
        });
        const localizedState = describeActions(localized.actions);

        const removedFromParent = await open({
            existsInParentProject: false,
            summary: { hasOriginProject: true, dataInherited: false },
        });
        const removedFromParentState = describeActions(removedFromParent.actions);

        expect({
            inherited: inheritedState,
            localized: localizedState,
            removedFromParent: removedFromParentState,
        }).toMatchInlineSnapshot(`
          {
            "inherited": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "on",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "localized": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "on",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "removedFromParent": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
          }
        `);
    });

    it('should hide Save for inherited content only once the actions are refreshed', async () => {
        const { actions } = await open({ persisted: { dataInherited: true } });
        const onLoad = describeActions(actions);

        await actions.refreshActions();
        await flush();
        const refreshed = describeActions(actions);

        expect({ onLoad: onLoad.save, refreshed: refreshed.save }).toMatchInlineSnapshot(`
          {
            "onLoad": "off",
            "refreshed": "hidden:off",
          }
        `);
    });

    it('Duplicate follows the create permission of the parent', async () => {
        mocks.parentPermissions = [Permission.MODIFY];
        const underParent = await open();
        const underParentState = describeActions(underParent.actions);

        mocks.rootPermissions = [Permission.MODIFY];
        const atRoot = await open({ persisted: { hasParent: false } });
        const atRootState = describeActions(atRoot.actions);

        expect({ underParent: underParentState, atRoot: atRootState }).toMatchInlineSnapshot(`
          {
            "atRoot": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "off",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "underParent": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "off",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
          }
        `);
    });

    it('new content', async () => {
        const { actions } = await open({ isNew: true, persisted: { unnamed: true } });

        stores.hasChanges.set(true);

        expect(describeActions(actions)).toMatchInlineSnapshot(`
          {
            "archive": "on",
            "createIssue": "on",
            "duplicate": "on",
            "localize": "hidden:off",
            "markAsReady": "off",
            "move": "off",
            "openRequest": "hidden:off",
            "preview": "off",
            "publish": "on",
            "publishTree": "off",
            "requestPublish": "off",
            "reset": "hidden:off",
            "save": "on",
            "saveAndClose": "on",
            "saveLabel": "action.save",
            "unpublish": "off",
          }
        `);
    });

    it('enables Move once an unnamed content gets a name', async () => {
        const { actions } = await open({ persisted: { unnamed: true } });
        const unnamed = describeActions(actions);

        void actions.enableActionsForExisting(createPersisted({ unnamed: false }));
        await flush();
        const named = describeActions(actions);

        expect({ unnamed, named }).toMatchInlineSnapshot(`
          {
            "named": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "unnamed": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
          }
        `);
    });

    it('updates the permissions from the panel', async () => {
        const { actions } = await open();

        actions.setUserCanPublish(false).setUserCanModify(false).refreshState();
        const revoked = describeActions(actions);

        actions.setUserCanPublish(true).setUserCanModify(true).refreshState();
        const restored = describeActions(actions);

        expect({ revoked, restored }).toMatchInlineSnapshot(`
          {
            "restored": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "revoked": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "off",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
          }
        `);
    });

    it('delete-only mode for a broken image', async () => {
        const { actions, panel } = await open();

        actions.setDeleteOnlyMode(panel.getPersistedItem());
        const deleteOnly = describeActions(actions);

        actions.refreshState();
        await flush();
        const afterRefresh = describeActions(actions);

        actions.setDeleteOnlyMode(panel.getPersistedItem(), false);
        await flush();
        const off = describeActions(actions);

        expect({ deleteOnly, afterRefresh, off }).toMatchInlineSnapshot(`
          {
            "afterRefresh": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "off",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "off",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "deleteOnly": {
              "archive": "on",
              "createIssue": "off",
              "duplicate": "off",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "off",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "off",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "off": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "on",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "on",
            },
          }
        `);
    });

    it('delete-only mode without the delete permission', async () => {
        const { actions, panel } = await open({
            persisted: { permissions: [Permission.CREATE, Permission.MODIFY, Permission.PUBLISH] },
        });

        actions.setDeleteOnlyMode(panel.getPersistedItem());

        expect(describeActions(actions)).toMatchInlineSnapshot(`
          {
            "archive": "off",
            "createIssue": "off",
            "duplicate": "off",
            "localize": "hidden:off",
            "markAsReady": "off",
            "move": "off",
            "openRequest": "hidden:off",
            "preview": "off",
            "publish": "off",
            "publishTree": "off",
            "requestPublish": "off",
            "reset": "hidden:off",
            "save": "off",
            "saveAndClose": "on",
            "saveLabel": "action.save",
            "unpublish": "off",
          }
        `);
    });

    it('holds the long-running actions back while a managed action runs', async () => {
        const { actions } = await open({ summary: { published: true } });
        const listener = mocks.managedActionListeners.at(-1);

        listener?.(ManagedActionState.PREPARING);
        const stashed = describeActions(actions);

        actions.refreshState();
        const refreshedWhileStashed = describeActions(actions);

        listener?.(ManagedActionState.ENDED);
        const unstashed = describeActions(actions);

        expect({ stashed, refreshedWhileStashed, unstashed }).toMatchInlineSnapshot(`
          {
            "refreshedWhileStashed": {
              "archive": "off",
              "createIssue": "on",
              "duplicate": "off",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "off",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "off",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "stashed": {
              "archive": "off",
              "createIssue": "on",
              "duplicate": "off",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "off",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "off",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "unstashed": {
              "archive": "on",
              "createIssue": "on",
              "duplicate": "on",
              "localize": "hidden:off",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "hidden:off",
              "preview": "off",
              "publish": "on",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "hidden:off",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "on",
            },
          }
        `);
    });

    it('labels Save as saved once the save action is in its saved state', async () => {
        const { actions } = await open();

        actions.getSaveAction().setIconClass('saved');
        stores.hasChanges.set(true);
        stores.hasChanges.set(false);
        const saved = describeActions(actions).saveLabel;

        stores.hasChanges.set(true);
        const changedAgain = describeActions(actions).saveLabel;

        expect({ saved, changedAgain }).toMatchInlineSnapshot(`
          {
            "changedAgain": "action.save",
            "saved": "action.saved",
          }
        `);
    });

    it('should keep the initial states until the content summary arrives', () => {
        const persisted = createPersisted();
        const actions = new ContentWizardActions(
            createPanel({ isNew: false, persisted, existsInParentProject: false }),
        );
        track(actions);

        const created = describeActions(actions);

        void actions.enableActionsForExisting(persisted);
        const withPersisted = describeActions(actions);

        expect({ created, withPersisted }).toMatchInlineSnapshot(`
          {
            "created": {
              "archive": "on",
              "createIssue": "off",
              "duplicate": "on",
              "localize": "on",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "on",
              "preview": "off",
              "publish": "off",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "on",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
            "withPersisted": {
              "archive": "on",
              "createIssue": "off",
              "duplicate": "on",
              "localize": "on",
              "markAsReady": "off",
              "move": "on",
              "openRequest": "on",
              "preview": "off",
              "publish": "off",
              "publishTree": "off",
              "requestPublish": "off",
              "reset": "on",
              "save": "off",
              "saveAndClose": "on",
              "saveLabel": "action.save",
              "unpublish": "off",
            },
          }
        `);
    });

    describe('while executing', () => {
        it('should take Save off while saving and label it saved afterwards', async () => {
            const { actions } = await open();
            stores.hasChanges.set(true);

            actions.getSaveAction().execute();
            await flush();
            const saving = describeActions(actions);

            stores.hasChanges.set(false);
            saves[0].resolve();
            await flush();
            const saved = describeActions(actions);

            stores.hasChanges.set(true);
            const changedAgain = describeActions(actions);

            expect({ saving, saved, changedAgain }).toMatchInlineSnapshot(`
              {
                "changedAgain": {
                  "archive": "on",
                  "createIssue": "on",
                  "duplicate": "on",
                  "localize": "hidden:off",
                  "markAsReady": "off",
                  "move": "on",
                  "openRequest": "hidden:off",
                  "preview": "off",
                  "publish": "on",
                  "publishTree": "off",
                  "requestPublish": "off",
                  "reset": "hidden:off",
                  "save": "on",
                  "saveAndClose": "on",
                  "saveLabel": "action.save",
                  "unpublish": "off",
                },
                "saved": {
                  "archive": "on",
                  "createIssue": "on",
                  "duplicate": "on",
                  "localize": "hidden:off",
                  "markAsReady": "off",
                  "move": "on",
                  "openRequest": "hidden:off",
                  "preview": "off",
                  "publish": "on",
                  "publishTree": "off",
                  "requestPublish": "off",
                  "reset": "hidden:off",
                  "save": "off",
                  "saveAndClose": "on",
                  "saveLabel": "action.saved",
                  "unpublish": "off",
                },
                "saving": {
                  "archive": "on",
                  "createIssue": "on",
                  "duplicate": "on",
                  "localize": "hidden:off",
                  "markAsReady": "off",
                  "move": "on",
                  "openRequest": "hidden:off",
                  "preview": "off",
                  "publish": "on",
                  "publishTree": "off",
                  "requestPublish": "off",
                  "reset": "hidden:off",
                  "save": "off",
                  "saveAndClose": "on",
                  "saveLabel": "action.saving",
                  "unpublish": "off",
                },
              }
            `);
        });

        it('should put Save back on when the save fails', async () => {
            const { actions } = await open();
            stores.hasChanges.set(true);

            actions.getSaveAction().execute();
            await flush();
            saves[0].reject();
            await flush();

            expect(describeActions(actions)).toMatchInlineSnapshot(`
              {
                "archive": "on",
                "createIssue": "on",
                "duplicate": "on",
                "localize": "hidden:off",
                "markAsReady": "off",
                "move": "on",
                "openRequest": "hidden:off",
                "preview": "off",
                "publish": "on",
                "publishTree": "off",
                "requestPublish": "off",
                "reset": "hidden:off",
                "save": "on",
                "saveAndClose": "on",
                "saveLabel": "action.save",
                "unpublish": "off",
              }
            `);
        });

        it('should re-enable Save when the form changes during a save', async () => {
            const { actions } = await open();
            stores.hasChanges.set(true);

            actions.getSaveAction().execute();
            await flush();
            stores.pathExists.set({ exists: true });
            stores.pathExists.set({ exists: false });
            const changedWhileSaving = describeActions(actions);

            saves[0].resolve();
            await flush();
            const saved = describeActions(actions);

            expect({ changedWhileSaving, saved }).toMatchInlineSnapshot(`
              {
                "changedWhileSaving": {
                  "archive": "on",
                  "createIssue": "on",
                  "duplicate": "on",
                  "localize": "hidden:off",
                  "markAsReady": "off",
                  "move": "on",
                  "openRequest": "hidden:off",
                  "preview": "off",
                  "publish": "on",
                  "publishTree": "off",
                  "requestPublish": "off",
                  "reset": "hidden:off",
                  "save": "on",
                  "saveAndClose": "on",
                  "saveLabel": "action.save",
                  "unpublish": "off",
                },
                "saved": {
                  "archive": "on",
                  "createIssue": "on",
                  "duplicate": "on",
                  "localize": "hidden:off",
                  "markAsReady": "off",
                  "move": "on",
                  "openRequest": "hidden:off",
                  "preview": "off",
                  "publish": "on",
                  "publishTree": "off",
                  "requestPublish": "off",
                  "reset": "hidden:off",
                  "save": "on",
                  "saveAndClose": "on",
                  "saveLabel": "action.saved",
                  "unpublish": "off",
                },
              }
            `);
        });

        it('should open the publish dialog at once when nothing is unsaved', async () => {
            const { actions } = await open();

            actions.getPublishAction().execute();
            await flush();

            expect({
                state: describeActions(actions),
                dialogs: mocks.openPublishDialog.mock.calls.length,
                saves: saves.length,
            }).toMatchInlineSnapshot(`
              {
                "dialogs": 1,
                "saves": 0,
                "state": {
                  "archive": "on",
                  "createIssue": "on",
                  "duplicate": "on",
                  "localize": "hidden:off",
                  "markAsReady": "off",
                  "move": "on",
                  "openRequest": "hidden:off",
                  "preview": "off",
                  "publish": "on",
                  "publishTree": "off",
                  "requestPublish": "off",
                  "reset": "hidden:off",
                  "save": "off",
                  "saveAndClose": "on",
                  "saveLabel": "action.save",
                  "unpublish": "off",
                },
              }
            `);
        });

        it('should save before publishing and put Publish back on afterwards', async () => {
            const { actions } = await open();
            stores.hasChanges.set(true);

            actions.getPublishAction().execute();
            await flush();
            const saving = describeActions(actions);

            stores.hasChanges.set(false);
            saves[0].resolve();
            await flush();
            const saved = describeActions(actions);

            expect({
                saving,
                saved,
                dialogs: mocks.openPublishDialog.mock.calls.length,
            }).toMatchInlineSnapshot(`
              {
                "dialogs": 1,
                "saved": {
                  "archive": "on",
                  "createIssue": "on",
                  "duplicate": "on",
                  "localize": "hidden:off",
                  "markAsReady": "off",
                  "move": "on",
                  "openRequest": "hidden:off",
                  "preview": "off",
                  "publish": "on",
                  "publishTree": "off",
                  "requestPublish": "off",
                  "reset": "hidden:off",
                  "save": "off",
                  "saveAndClose": "on",
                  "saveLabel": "action.save",
                  "unpublish": "off",
                },
                "saving": {
                  "archive": "on",
                  "createIssue": "on",
                  "duplicate": "on",
                  "localize": "hidden:off",
                  "markAsReady": "off",
                  "move": "on",
                  "openRequest": "hidden:off",
                  "preview": "off",
                  "publish": "off",
                  "publishTree": "off",
                  "requestPublish": "off",
                  "reset": "hidden:off",
                  "save": "on",
                  "saveAndClose": "on",
                  "saveLabel": "action.save",
                  "unpublish": "off",
                },
              }
            `);
        });

        it('should put Publish back on after the save even when the rules turned it off meanwhile', async () => {
            const { actions } = await open();
            stores.hasChanges.set(true);

            actions.getPublishAction().execute();
            await flush();

            actions.setUserCanPublish(false).refreshState();
            const revokedWhileSaving = describeActions(actions);

            saves[0].resolve();
            await flush();
            const saved = describeActions(actions);

            expect({ revokedWhileSaving, saved }).toMatchInlineSnapshot(`
              {
                "revokedWhileSaving": {
                  "archive": "on",
                  "createIssue": "on",
                  "duplicate": "on",
                  "localize": "hidden:off",
                  "markAsReady": "off",
                  "move": "on",
                  "openRequest": "hidden:off",
                  "preview": "off",
                  "publish": "off",
                  "publishTree": "off",
                  "requestPublish": "off",
                  "reset": "hidden:off",
                  "save": "on",
                  "saveAndClose": "on",
                  "saveLabel": "action.save",
                  "unpublish": "off",
                },
                "saved": {
                  "archive": "on",
                  "createIssue": "on",
                  "duplicate": "on",
                  "localize": "hidden:off",
                  "markAsReady": "off",
                  "move": "on",
                  "openRequest": "hidden:off",
                  "preview": "off",
                  "publish": "on",
                  "publishTree": "off",
                  "requestPublish": "off",
                  "reset": "hidden:off",
                  "save": "on",
                  "saveAndClose": "on",
                  "saveLabel": "action.save",
                  "unpublish": "off",
                },
              }
            `);
        });

        it('should put Publish back on when the save before publishing fails', async () => {
            const { actions } = await open();
            stores.hasChanges.set(true);

            actions.getPublishAction().execute();
            await flush();
            saves[0].reject();
            await flush();

            expect({
                state: describeActions(actions),
                dialogs: mocks.openPublishDialog.mock.calls.length,
            }).toMatchInlineSnapshot(`
              {
                "dialogs": 0,
                "state": {
                  "archive": "on",
                  "createIssue": "on",
                  "duplicate": "on",
                  "localize": "hidden:off",
                  "markAsReady": "off",
                  "move": "on",
                  "openRequest": "hidden:off",
                  "preview": "off",
                  "publish": "on",
                  "publishTree": "off",
                  "requestPublish": "off",
                  "reset": "hidden:off",
                  "save": "on",
                  "saveAndClose": "on",
                  "saveLabel": "action.save",
                  "unpublish": "off",
                },
              }
            `);
        });

        it('should warn instead of publishing invalid content', async () => {
            const { actions, setContentState } = await open();

            setContentState('invalid');
            actions.getPublishAction().setEnabled(true);
            actions.getPublishAction().execute();
            await flush();

            expect({
                warnings: mocks.showWarning.mock.calls.length,
                dialogs: mocks.openPublishDialog.mock.calls.length,
            }).toMatchInlineSnapshot(`
              {
                "dialogs": 0,
                "warnings": 1,
              }
            `);
        });

        it('should save before marking as ready and keep Mark as ready on afterwards', async () => {
            const { actions } = await open({ summary: { inProgress: true }, contentState: 'in-progress' });

            actions.getMarkAsReadyAction().execute();
            await flush();
            const saving = describeActions(actions);

            saves[0].resolve();
            await flush();
            const saved = describeActions(actions);

            expect({
                saving,
                saved,
                dialogs: mocks.openPublishDialog.mock.calls.length,
            }).toMatchInlineSnapshot(`
              {
                "dialogs": 1,
                "saved": {
                  "archive": "on",
                  "createIssue": "on",
                  "duplicate": "on",
                  "localize": "hidden:off",
                  "markAsReady": "on",
                  "move": "on",
                  "openRequest": "hidden:off",
                  "preview": "off",
                  "publish": "on",
                  "publishTree": "off",
                  "requestPublish": "off",
                  "reset": "hidden:off",
                  "save": "off",
                  "saveAndClose": "on",
                  "saveLabel": "action.save",
                  "unpublish": "off",
                },
                "saving": {
                  "archive": "on",
                  "createIssue": "on",
                  "duplicate": "on",
                  "localize": "hidden:off",
                  "markAsReady": "off",
                  "move": "on",
                  "openRequest": "hidden:off",
                  "preview": "off",
                  "publish": "on",
                  "publishTree": "off",
                  "requestPublish": "off",
                  "reset": "hidden:off",
                  "save": "off",
                  "saveAndClose": "on",
                  "saveLabel": "action.save",
                  "unpublish": "off",
                },
              }
            `);
        });
    });

    it('passes the modify permission to Preview', async () => {
        await open({ persisted: { permissions: [Permission.CREATE] } });
        const withoutModify = [...mocks.writePermissions];

        mocks.writePermissions = [];
        await open({ isNew: true });
        const forNew = [...mocks.writePermissions];

        expect({ withoutModify, forNew }).toMatchInlineSnapshot(`
          {
            "forNew": [
              true,
            ],
            "withoutModify": [
              false,
            ],
          }
        `);
    });
});
