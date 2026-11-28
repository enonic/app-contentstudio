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
            return Q([]);
        }
    }

    return { ProjectListRequest };
});

vi.mock('../settings/resource/ProjectGetRequest', () => ({ ProjectGetRequest: class {} }));
vi.mock('../settings/event/ProjectUpdatedEvent', () => ({ ProjectUpdatedEvent: { on: vi.fn() } }));
vi.mock('../../v6/features/rename/model/renameContentDialog.store', () => ({ openRenameContentDialog: vi.fn() }));
vi.mock('../../v6/widgets/context-panel/openContextWidget', () => ({ openContextWidget: vi.fn() }));

import { setActiveProject } from '../../v6/entities/project/activeProject.store';
import { $wizardToolbar } from '../../v6/pages/wizard/model/wizardToolbar.store';
import { handleError } from '../../v6/shared/notifications';
import { ContentWizardToolbar } from './ContentWizardToolbar';

const flush = async (): Promise<void> => {
    for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
};

const createItem = (contentId: string): ContentSummaryAndCompareStatus =>
    ({
        getContentId: () => ({ toString: () => contentId }),
        getPublishStatus: () => null,
        getContentSummary: () => null,
        getPath: () => null,
        isInherited: () => false,
        isDataInherited: () => false,
    }) as unknown as ContentSummaryAndCompareStatus;

const createProject = (): Project =>
    ({
        getName: () => 'my-project',
        getDisplayName: () => 'My project',
        getLanguage: () => '',
        getIcon: () => undefined,
        hasParents: () => false,
    }) as unknown as Project;

const opened: ContentWizardToolbar[] = [];

const openToolbar = (): ContentWizardToolbar => {
    const toolbar = new ContentWizardToolbar({ actions: {} as ContentWizardActions });
    Body.get().appendChild(toolbar);
    opened.push(toolbar);
    return toolbar;
};

const collaborators = () => $wizardToolbar.get().collaborators;

const describeSubscriptions = (): string[] =>
    mocks.subscriptions.map(({ contentId, project, active }) => `${contentId}@${project}:${active ? 'on' : 'off'}`);

const deferLookup = (): ((names: Named[]) => void) => {
    let resolve: (names: Named[]) => void = () => undefined;
    const pending = new Promise<Named[]>((done) => {
        resolve = done;
    });
    const original = mocks.lookup;
    mocks.lookup = () => {
        mocks.lookup = original;
        return pending;
    };
    return resolve;
};

describe('ContentWizardToolbar collaborators (characterization of the legacy rules)', () => {
    beforeEach(() => {
        mocks.collaborationEnabled = true;
        mocks.user = { key: 'user:system:me', displayName: 'Me' };
        mocks.subscriptions = [];
        mocks.lookups = [];
        vi.mocked(handleError).mockClear();
        mocks.lookup = (keys) => Promise.resolve(keys.map((key) => ({ key, displayName: `Name of ${key}` })));
        setActiveProject(createProject());
    });

    afterEach(() => {
        opened.splice(0).forEach((toolbar) => toolbar.remove());
    });

    it('does not subscribe before a content is set', () => {
        openToolbar();

        expect({ subscriptions: describeSubscriptions(), collaborators: collaborators() }).toMatchInlineSnapshot(`
          {
            "collaborators": [],
            "subscriptions": [],
          }
        `);
    });

    it('subscribes to the content in the active project once it is set', () => {
        const toolbar = openToolbar();
        toolbar.setItem(createItem('content-1'));

        expect({ subscriptions: describeSubscriptions(), collaborators: collaborators() }).toMatchInlineSnapshot(`
          {
            "collaborators": [],
            "subscriptions": [
              "content-1@my-project:on",
            ],
          }
        `);
    });

    it('does not subscribe when collaboration is off', () => {
        mocks.collaborationEnabled = false;
        const toolbar = openToolbar();
        toolbar.setItem(createItem('content-1'));

        expect({ subscriptions: describeSubscriptions(), collaborators: collaborators() }).toMatchInlineSnapshot(`
          {
            "collaborators": [],
            "subscriptions": [],
          }
        `);
    });

    it('keeps one subscription while the same content is set again', () => {
        const toolbar = openToolbar();
        toolbar.setItem(createItem('content-1'));
        toolbar.setItem(createItem('content-1'));

        expect(describeSubscriptions()).toMatchInlineSnapshot(`
          [
            "content-1@my-project:on",
          ]
        `);
    });

    it('puts the current user first and looks up the names of the others', async () => {
        const toolbar = openToolbar();
        toolbar.setItem(createItem('content-1'));

        mocks.subscriptions[0].emit(['user:system:b', 'user:system:me', 'user:system:a']);
        const beforeLookup = collaborators();
        await flush();

        expect({ beforeLookup, afterLookup: collaborators(), lookups: mocks.lookups }).toMatchInlineSnapshot(`
          {
            "afterLookup": [
              {
                "isCurrent": true,
                "key": "user:system:me",
                "label": "Me",
              },
              {
                "isCurrent": false,
                "key": "user:system:b",
                "label": "Name of user:system:b",
              },
              {
                "isCurrent": false,
                "key": "user:system:a",
                "label": "Name of user:system:a",
              },
            ],
            "beforeLookup": [],
            "lookups": [
              [
                "user:system:b",
                "user:system:a",
              ],
            ],
          }
        `);
    });

    it('shows the current user alone without a lookup', async () => {
        const toolbar = openToolbar();
        toolbar.setItem(createItem('content-1'));

        mocks.subscriptions[0].emit(['user:system:me']);
        const immediately = collaborators();
        await flush();

        expect({ immediately, lookups: mocks.lookups }).toMatchInlineSnapshot(`
          {
            "immediately": [
              {
                "isCurrent": true,
                "key": "user:system:me",
                "label": "Me",
              },
            ],
            "lookups": [],
          }
        `);
    });

    it('does not look up a name twice', async () => {
        const toolbar = openToolbar();
        toolbar.setItem(createItem('content-1'));

        mocks.subscriptions[0].emit(['user:system:a']);
        await flush();
        mocks.subscriptions[0].emit(['user:system:a', 'user:system:b']);
        await flush();
        mocks.subscriptions[0].emit(['user:system:b']);
        await flush();

        expect({ collaborators: collaborators(), lookups: mocks.lookups }).toMatchInlineSnapshot(`
          {
            "collaborators": [
              {
                "isCurrent": false,
                "key": "user:system:b",
                "label": "Name of user:system:b",
              },
            ],
            "lookups": [
              [
                "user:system:a",
              ],
              [
                "user:system:b",
              ],
            ],
          }
        `);
    });

    it('keeps the order of the others when there is no current user', async () => {
        mocks.user = undefined;
        const toolbar = openToolbar();
        toolbar.setItem(createItem('content-1'));

        mocks.subscriptions[0].emit(['user:system:b', 'user:system:a']);
        await flush();

        expect(collaborators()).toMatchInlineSnapshot(`
          [
            {
              "isCurrent": false,
              "key": "user:system:b",
              "label": "Name of user:system:b",
            },
            {
              "isCurrent": false,
              "key": "user:system:a",
              "label": "Name of user:system:a",
            },
          ]
        `);
    });

    it('falls back to the keys when the lookup fails, and asks again next time', async () => {
        const toolbar = openToolbar();
        toolbar.setItem(createItem('content-1'));

        const failure = new Error('lookup failed');
        mocks.lookup = () => Promise.reject(failure);
        mocks.subscriptions[0].emit(['user:system:a']);
        await flush();
        const afterFailure = collaborators();

        expect(handleError).toHaveBeenCalledExactlyOnceWith(failure);

        mocks.lookup = (keys) => Promise.resolve(keys.map((key) => ({ key, displayName: `Name of ${key}` })));
        mocks.subscriptions[0].emit(['user:system:a', 'user:system:me']);
        await flush();

        expect({ afterFailure, afterRetry: collaborators(), lookups: mocks.lookups }).toMatchInlineSnapshot(`
          {
            "afterFailure": [
              {
                "isCurrent": false,
                "key": "user:system:a",
                "label": "user:system:a",
              },
            ],
            "afterRetry": [
              {
                "isCurrent": true,
                "key": "user:system:me",
                "label": "Me",
              },
              {
                "isCurrent": false,
                "key": "user:system:a",
                "label": "Name of user:system:a",
              },
            ],
            "lookups": [
              [
                "user:system:a",
              ],
              [
                "user:system:a",
              ],
            ],
          }
        `);
    });

    it('shows a key that is not a principal key as it is, without looking it up', async () => {
        const toolbar = openToolbar();
        toolbar.setItem(createItem('content-1'));

        mocks.subscriptions[0].emit(['not-a-key', 'user:system:a']);
        await flush();

        expect({ collaborators: collaborators(), lookups: mocks.lookups }).toMatchInlineSnapshot(`
          {
            "collaborators": [
              {
                "isCurrent": false,
                "key": "not-a-key",
                "label": "not-a-key",
              },
              {
                "isCurrent": false,
                "key": "user:system:a",
                "label": "Name of user:system:a",
              },
            ],
            "lookups": [
              [
                "user:system:a",
              ],
            ],
          }
        `);
    });

    it('drops a lookup answer that a newer update has overtaken', async () => {
        const toolbar = openToolbar();
        toolbar.setItem(createItem('content-1'));

        const resolveFirst = deferLookup();
        mocks.subscriptions[0].emit(['user:system:a']);
        mocks.subscriptions[0].emit(['user:system:me']);
        const afterSecond = collaborators();

        resolveFirst([{ key: 'user:system:a', displayName: 'Name of user:system:a' }]);
        await flush();

        expect({ afterSecond, afterFirstAnswer: collaborators() }).toMatchInlineSnapshot(`
          {
            "afterFirstAnswer": [
              {
                "isCurrent": true,
                "key": "user:system:me",
                "label": "Me",
              },
            ],
            "afterSecond": [
              {
                "isCurrent": true,
                "key": "user:system:me",
                "label": "Me",
              },
            ],
          }
        `);
    });

    it('moves the subscription to another content and clears the list', async () => {
        const toolbar = openToolbar();
        toolbar.setItem(createItem('content-1'));
        mocks.subscriptions[0].emit(['user:system:me']);
        await flush();

        toolbar.setItem(createItem('content-2'));

        expect({ subscriptions: describeSubscriptions(), collaborators: collaborators() }).toMatchInlineSnapshot(`
          {
            "collaborators": [],
            "subscriptions": [
              "content-1@my-project:off",
              "content-2@my-project:on",
            ],
          }
        `);
    });

    it('drops a lookup answer for the previous content', async () => {
        const toolbar = openToolbar();
        toolbar.setItem(createItem('content-1'));

        const resolveFirst = deferLookup();
        mocks.subscriptions[0].emit(['user:system:a']);
        toolbar.setItem(createItem('content-2'));

        resolveFirst([{ key: 'user:system:a', displayName: 'Name of user:system:a' }]);
        await flush();

        expect(collaborators()).toMatchInlineSnapshot(`[]`);
    });

    it('unsubscribes and clears the list when the toolbar is removed', async () => {
        const toolbar = openToolbar();
        toolbar.setItem(createItem('content-1'));
        mocks.subscriptions[0].emit(['user:system:me']);
        await flush();
        const beforeRemoval = collaborators();

        toolbar.remove();

        expect({
            beforeRemoval,
            subscriptions: describeSubscriptions(),
            collaborators: collaborators(),
        }).toMatchInlineSnapshot(`
          {
            "beforeRemoval": [
              {
                "isCurrent": true,
                "key": "user:system:me",
                "label": "Me",
              },
            ],
            "collaborators": [],
            "subscriptions": [
              "content-1@my-project:off",
            ],
          }
        `);
    });

    it('starts with fresh names in a new toolbar', async () => {
        const first = openToolbar();
        first.setItem(createItem('content-1'));
        mocks.subscriptions[0].emit(['user:system:a']);
        await flush();
        first.remove();

        const second = openToolbar();
        second.setItem(createItem('content-1'));
        mocks.subscriptions[1].emit(['user:system:a']);
        await flush();

        expect({ collaborators: collaborators(), lookups: mocks.lookups }).toMatchInlineSnapshot(`
          {
            "collaborators": [
              {
                "isCurrent": false,
                "key": "user:system:a",
                "label": "Name of user:system:a",
              },
            ],
            "lookups": [
              [
                "user:system:a",
              ],
              [
                "user:system:a",
              ],
            ],
          }
        `);
    });
});
