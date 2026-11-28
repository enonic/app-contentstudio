import { Body } from '@enonic/lib-admin-ui/dom/Body';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentSummaryAndCompareStatus } from '../content/ContentSummaryAndCompareStatus';
import type { Project } from '../settings/data/project/Project';
import type { ContentWizardActions } from '../wizard/action/ContentWizardActions';

type Named = { key: string; displayName: string };

type Subscription = {
    contentId: string;
    project: string;
    active: boolean;
    emit: (keys: string[]) => void;
};

const mocks = vi.hoisted(() => ({
    collaborationEnabled: true,
    user: { key: 'user:system:me', displayName: 'Me' } as { key: string; displayName: string } | undefined,
    subscriptions: [] as Subscription[],
    lookups: [] as string[][],
    projects: [] as { getName(): string }[],
    projectListFails: false,
    projectUpdatedListeners: [] as ((event: { getProjectName(): string }) => void)[],
    lookup: (keys: string[]): Promise<Named[]> =>
        Promise.resolve(keys.map((key) => ({ key, displayName: `Name of ${key}` }))),
}));

const runLookup = vi.hoisted(() => (keys: string[]): Promise<Named[]> => {
    mocks.lookups.push(keys);
    return mocks.lookup(keys);
});

vi.mock('../stores/collaboration', () => ({
    subscribe: (contentId: string, project: string, callback: (collaborators: Set<string>) => void) => {
        const subscription: Subscription = {
            contentId,
            project,
            active: true,
            emit: (keys) => callback(new Set(keys)),
        };
        mocks.subscriptions.push(subscription);
        callback(new Set());

        return () => {
            subscription.active = false;
        };
    },
}));

vi.mock('../security/GetPrincipalsByKeysRequest', async () => {
    const { default: Q } = await import('q');

    class GetPrincipalsByKeysRequest {
        constructor(private readonly keys: { toString(): string }[]) {}

        sendAndParse() {
            return Q(
                runLookup(this.keys.map((key) => key.toString())).then((principals) =>
                    principals.map((principal) => ({
                        getKey: () => ({ toString: () => principal.key }),
                        getDisplayName: () => principal.displayName,
                    })),
                ),
            );
        }
    }

    return { GetPrincipalsByKeysRequest };
});

vi.mock('../../v6/entities/principal/api/principals.api', async () => {
    const { ResultAsync } = await import('neverthrow');

    return {
        resolvePrincipalsByKeys: (keys: string[]) =>
            ResultAsync.fromPromise(runLookup(keys.map((key) => key.toString())), (error) => error),
    };
});

vi.mock('@enonic/lib-admin-ui/auth/AuthContext', () => ({
    AuthContext: {
        get: () => ({
            getUser: () =>
                mocks.user && {
                    getKey: () => ({ toString: () => mocks.user?.key }),
                    getDisplayName: () => mocks.user?.displayName,
                },
        }),
    },
}));

vi.mock('../../v6/shared/lib/cms/security/auth', () => ({
    getCurrentUser: () => mocks.user,
}));

vi.mock('@enonic/lib-admin-ui/util/Config', async (importOriginal) => {
    const original = await importOriginal<typeof import('@enonic/lib-admin-ui/util/Config')>();
    vi.spyOn(original.CONFIG, 'isTrue').mockImplementation(() => mocks.collaborationEnabled);
    vi.spyOn(original.CONFIG, 'getLocale').mockImplementation(() => 'en');

    return original;
});

vi.mock('@enonic/lib-admin-ui/DefaultErrorHandler', () => ({
    DefaultErrorHandler: { handle: vi.fn() },
}));

vi.mock('../../v6/shared/notifications', () => ({
    handleError: vi.fn(),
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
}));

vi.mock('../../v6/widgets/browse-toolbar/ContentWizardToolbar', async () => {
    const { DivEl } = await import('@enonic/lib-admin-ui/dom/DivEl');

    class ContentWizardToolbarElement extends DivEl {
        constructor() {
            super();
        }
    }

    return { ContentWizardToolbarElement };
});

vi.mock('../wizard/ContentWizardToolbarPublishControls', async () => {
    const { DivEl } = await import('@enonic/lib-admin-ui/dom/DivEl');

    class ContentWizardToolbarPublishControls extends DivEl {
        constructor() {
            super();
        }

        private readonly publishButton = {
            hide: vi.fn(),
            show: vi.fn(),
            onActionUpdated: vi.fn(),
            unActionUpdated: vi.fn(),
            onPublishRequestActionChanged: vi.fn(),
        };

        getPublishButton() {
            return this.publishButton;
        }

        setContent(): this {
            return this;
        }
    }

    return { ContentWizardToolbarPublishControls };
});

vi.mock('../settings/resource/ProjectListRequest', async () => {
    const { default: Q } = await import('q');

    class ProjectListRequest {
        sendAndParse() {
            return mocks.projectListFails ? Q.reject(new Error('no projects')) : Q(mocks.projects);
        }
    }

    return { ProjectListRequest };
});

vi.mock('../settings/resource/ProjectGetRequest', async () => {
    const { default: Q } = await import('q');

    class ProjectGetRequest {
        constructor(private readonly name: string) {}

        sendAndParse() {
            return Q(mocks.projects.find((project) => project.getName() === this.name));
        }
    }

    return { ProjectGetRequest };
});

vi.mock('../settings/event/ProjectUpdatedEvent', () => ({
    ProjectUpdatedEvent: {
        on: (listener: (event: { getProjectName(): string }) => void) => {
            mocks.projectUpdatedListeners.push(listener);
        },
    },
}));
vi.mock('../../v6/features/rename/model/renameContentDialog.store', () => ({ openRenameContentDialog: vi.fn() }));
vi.mock('../../v6/widgets/context-panel/openContextWidget', () => ({ openContextWidget: vi.fn() }));

import { setActiveProject } from '../../v6/entities/project/activeProject.store';
import { $wizardDraftName, setDraftName } from '../../v6/pages/wizard/model/wizardContent.store';
import { $wizardToolbar } from '../../v6/pages/wizard/model/wizardToolbar.store';
import { $activeProjectInfo } from '../../v6/entities/project/activeProjectInfo.store';
import { ContentName } from '../content/ContentName';
import { PublishStatus } from '../publish/PublishStatus';
import { ContentWizardToolbar } from './ContentWizardToolbar';

const flush = async (): Promise<void> => {
    for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
};

type ProjectOptions = {
    name?: string;
    displayName?: string;
    language?: string;
    icon?: boolean;
    parents?: boolean;
};

const createProject = ({
    name = 'my-project',
    displayName = 'My project',
    language = '',
    icon = false,
    parents = false,
}: ProjectOptions = {}): Project =>
    ({
        getName: () => name,
        getDisplayName: () => displayName,
        getLanguage: () => language,
        getIcon: () => (icon ? {} : undefined),
        hasParents: () => parents,
    }) as unknown as Project;

type ItemOptions = {
    publishStatus?: PublishStatus | null;
    summary?: { name?: string; from?: Date; to?: Date } | null;
    path?: { parent: string; name: string } | null;
    inherited?: boolean;
    dataInherited?: boolean;
};

const createItem = ({
    publishStatus = null,
    summary = null,
    path = { parent: '/site', name: 'page' },
    inherited = false,
    dataInherited = false,
}: ItemOptions = {}): ContentSummaryAndCompareStatus =>
    ({
        getContentId: () => ({ toString: () => 'content-1' }),
        getPublishStatus: () => publishStatus,
        getContentSummary: () =>
            summary && {
                getName: () => (summary.name == null ? null : { toString: () => summary.name }),
                getPublishFromTime: () => summary.from,
                getPublishToTime: () => summary.to,
            },
        getPath: () =>
            path && {
                getName: () => path.name,
                getParentPath: () => ({ toString: () => path.parent }),
            },
        isInherited: () => inherited,
        isDataInherited: () => dataInherited,
    }) as unknown as ContentSummaryAndCompareStatus;

const opened: ContentWizardToolbar[] = [];

const openToolbar = (): ContentWizardToolbar => {
    const toolbar = new ContentWizardToolbar({ actions: {} as ContentWizardActions });
    Body.get().appendChild(toolbar);
    opened.push(toolbar);
    return toolbar;
};

const useProjects = (active: Project, others: Project[] = []): void => {
    mocks.projects = [active, ...others];
    setActiveProject(active);
};

const updateProject = (project: Project): void => {
    mocks.projects = mocks.projects.map((candidate) =>
        candidate.getName() === project.getName() ? project : candidate,
    );
    setActiveProject(project);
    mocks.projectUpdatedListeners.forEach((listener) => listener({ getProjectName: () => project.getName() }));
};

const describeProject = () => {
    const { label, name, language, hasIcon, isLayer } = $activeProjectInfo.get();
    return {
        projectLabel: label,
        projectName: name,
        projectLanguage: language,
        projectHasIcon: hasIcon,
        isLayerProject: isLayer,
    };
};

const describeContent = () => {
    const {
        publishStatus,
        contentName,
        contentParentPath,
        canRenameContentPath,
        isContentOnline,
        isContentInherited,
        isContentDataInherited,
    } = $wizardToolbar.get();

    return {
        publishStatus,
        contentName,
        contentParentPath,
        canRenameContentPath,
        isContentOnline,
        isContentInherited,
        isContentDataInherited,
    };
};

const DAY_MS = 24 * 60 * 60 * 1000;

describe('ContentWizardToolbar header (characterization of the legacy rules)', () => {
    beforeEach(() => {
        mocks.collaborationEnabled = false;
        mocks.projects = [];
        mocks.projectListFails = false;
        mocks.projectUpdatedListeners = [];
        $wizardDraftName.set(null);
        useProjects(createProject());
    });

    afterEach(() => {
        opened.splice(0).forEach((toolbar) => toolbar.remove());
    });

    describe('project', () => {
        it('shows the display name of the active project', async () => {
            openToolbar();
            await flush();

            expect(describeProject()).toMatchInlineSnapshot(`
              {
                "isLayerProject": false,
                "projectHasIcon": false,
                "projectLabel": "My project",
                "projectLanguage": "",
                "projectName": "my-project",
              }
            `);
        });

        it('adds the language, the icon and the layer mark', async () => {
            useProjects(createProject({ language: 'no', icon: true, parents: true }), [
                createProject({ name: 'other' }),
            ]);
            openToolbar();
            await flush();

            expect(describeProject()).toMatchInlineSnapshot(`
              {
                "isLayerProject": true,
                "projectHasIcon": true,
                "projectLabel": "My project (no)",
                "projectLanguage": "no",
                "projectName": "my-project",
              }
            `);
        });

        it('falls back to the name of a project without a display name', async () => {
            useProjects(createProject({ displayName: '' }));
            openToolbar();
            await flush();

            expect(describeProject()).toMatchInlineSnapshot(`
              {
                "isLayerProject": false,
                "projectHasIcon": false,
                "projectLabel": "my-project",
                "projectLanguage": "",
                "projectName": "my-project",
              }
            `);
        });

        it('follows an update of the active project', async () => {
            openToolbar();
            await flush();

            updateProject(createProject({ displayName: 'Renamed', language: 'en', icon: true, parents: true }));
            await flush();

            expect(describeProject()).toMatchInlineSnapshot(`
              {
                "isLayerProject": true,
                "projectHasIcon": true,
                "projectLabel": "Renamed (en)",
                "projectLanguage": "en",
                "projectName": "my-project",
              }
            `);
        });

        it('is empty without an active project', () => {
            setActiveProject(undefined);

            expect(describeProject()).toMatchInlineSnapshot(`
              {
                "isLayerProject": false,
                "projectHasIcon": false,
                "projectLabel": "",
                "projectLanguage": "",
                "projectName": "",
              }
            `);
        });
    });

    describe('content', () => {
        it('starts empty', () => {
            openToolbar();

            expect(describeContent()).toMatchInlineSnapshot(`
              {
                "canRenameContentPath": false,
                "contentName": "",
                "contentParentPath": "",
                "isContentDataInherited": false,
                "isContentInherited": false,
                "isContentOnline": false,
                "publishStatus": null,
              }
            `);
        });

        it('takes the publish status of the item', () => {
            const toolbar = openToolbar();
            const statuses = [
                PublishStatus.ONLINE,
                PublishStatus.PENDING,
                PublishStatus.EXPIRED,
                PublishStatus.OFFLINE,
            ];

            const result = statuses.map((publishStatus) => {
                toolbar.setItem(createItem({ publishStatus }));
                const { publishStatus: status, isContentOnline } = describeContent();
                return `${status}:${isContentOnline ? 'online' : 'offline'}`;
            });

            expect(result).toMatchInlineSnapshot(`
              [
                "online:online",
                "pending:online",
                "expired:online",
                "offline:offline",
              ]
            `);
        });

        it('works the publish status out of the summary when the item has none', () => {
            const toolbar = openToolbar();
            const now = Date.now();
            const summaries = {
                neverPublished: {},
                published: { from: new Date(now - DAY_MS) },
                scheduled: { from: new Date(now + DAY_MS) },
                expired: { from: new Date(now - 2 * DAY_MS), to: new Date(now - DAY_MS) },
            };

            const result = Object.entries(summaries).map(([label, summary]) => {
                toolbar.setItem(createItem({ summary }));
                const { publishStatus, isContentOnline } = describeContent();
                return `${label} → ${publishStatus}:${isContentOnline ? 'online' : 'offline'}`;
            });

            expect(result).toMatchInlineSnapshot(`
              [
                "neverPublished → offline:offline",
                "published → online:online",
                "scheduled → pending:online",
                "expired → expired:online",
              ]
            `);
        });

        it('keeps the previous publish status when the item has neither', () => {
            const toolbar = openToolbar();
            toolbar.setItem(createItem({ publishStatus: PublishStatus.ONLINE }));
            toolbar.setItem(createItem());

            expect(describeContent()).toMatchInlineSnapshot(`
              {
                "canRenameContentPath": true,
                "contentName": "page",
                "contentParentPath": "/site",
                "isContentDataInherited": false,
                "isContentInherited": false,
                "isContentOnline": true,
                "publishStatus": "online",
              }
            `);
        });

        it('takes the name from the draft, then the summary, then the path', () => {
            const toolbar = openToolbar();
            const names: Record<string, string> = {};

            toolbar.setItem(createItem());
            names.fromPath = describeContent().contentName;

            toolbar.setItem(createItem({ summary: { name: 'summary-name' } }));
            names.fromSummary = describeContent().contentName;

            setDraftName(new ContentName('draft-name'));
            toolbar.setItem(createItem({ summary: { name: 'summary-name' } }));
            names.fromDraft = describeContent().contentName;

            expect(names).toMatchInlineSnapshot(`
              {
                "fromDraft": "draft-name",
                "fromPath": "page",
                "fromSummary": "summary-name",
              }
            `);
        });

        it('shows no name for an unnamed content', () => {
            const toolbar = openToolbar();
            const names: Record<string, string> = {};

            toolbar.setItem(createItem({ path: { parent: '/site', name: '__unnamed__123' } }));
            names.unnamedPath = describeContent().contentName;

            toolbar.setItem(createItem({ summary: { name: '__unnamed__123' } }));
            names.unnamedSummary = describeContent().contentName;

            expect(names).toMatchInlineSnapshot(`
              {
                "unnamedPath": "",
                "unnamedSummary": "",
              }
            `);
        });

        it('takes the parent path and the inheritance of the item', () => {
            const toolbar = openToolbar();
            toolbar.setItem(createItem({ inherited: true, dataInherited: true }));

            expect(describeContent()).toMatchInlineSnapshot(`
              {
                "canRenameContentPath": true,
                "contentName": "page",
                "contentParentPath": "/site",
                "isContentDataInherited": true,
                "isContentInherited": true,
                "isContentOnline": false,
                "publishStatus": null,
              }
            `);
        });

        it('does not let a content without a path be renamed', () => {
            const toolbar = openToolbar();
            toolbar.setItem(createItem({ path: null }));

            expect(describeContent()).toMatchInlineSnapshot(`
              {
                "canRenameContentPath": false,
                "contentName": "",
                "contentParentPath": "",
                "isContentDataInherited": false,
                "isContentInherited": false,
                "isContentOnline": false,
                "publishStatus": null,
              }
            `);
        });

        it('clears the content when the toolbar is removed', () => {
            const toolbar = openToolbar();
            toolbar.setItem(createItem({ publishStatus: PublishStatus.ONLINE, inherited: true }));
            toolbar.remove();

            expect(describeContent()).toMatchInlineSnapshot(`
              {
                "canRenameContentPath": false,
                "contentName": "",
                "contentParentPath": "",
                "isContentDataInherited": false,
                "isContentInherited": false,
                "isContentOnline": false,
                "publishStatus": null,
              }
            `);
        });
    });
});
