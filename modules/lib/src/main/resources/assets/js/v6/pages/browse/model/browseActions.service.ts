import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { ProjectHelper } from '../../../../app/settings/data/project/ProjectHelper';
import { onApplicationEvent } from '../../../entities/application';
import { $currentItems, hasUnpublishedChildren } from '../../../entities/content';
import { type ContentPermission, fetchPermittedActions } from '../../../entities/content/api/permittedActions.api';
import { $noProjectMode, onActiveProjectChanged } from '../../../entities/project';
import { clearAllowsChildContentCache, fetchAllowsChildContent } from '../../../entities/schema';
import { i18n } from '../../../shared/i18n';
import { handleError, notifyWarning } from '../../../shared/notifications';
import {
    $contentCreated,
    $contentDeleted,
    $contentDuplicated,
    $contentPermissionsUpdated,
    $contentPublished,
    $contentUnpublished,
    $contentUpdated,
} from '../../../shared/socket/socket.store';
import {
    $browseActionFacts,
    type BrowseActionFacts,
    isBrowseActionsStashed,
    needsChildrenAllowedCheck,
    needsUnpublishedChildrenCheck,
} from './browseActions.store';

//
// * Browse Actions Service
//
// Keeps the facts behind the browse actions (permissions, whether the content
// type allows children, unpublished descendants) in step with the current items
// and with the content changes the server reports.
// Started explicitly with the browse app; never a side effect of importing.
//

const ROOT_PERMISSIONS: readonly ContentPermission[] = ['CREATE'];
const ITEM_PERMISSIONS: readonly ContentPermission[] = ['CREATE', 'DELETE', 'PUBLISH', 'MODIFY'];
const CONTENT_CHANGE_DELAY_MS = 300;

const CONTENT_CHANGES = [
    $contentCreated,
    $contentUpdated,
    $contentDeleted,
    $contentPublished,
    $contentUnpublished,
    $contentDuplicated,
    $contentPermissionsUpdated,
];

let unsubscribers: Array<() => void> = [];
let requestId = 0;
let trackedItems: readonly ContentSummary[] | undefined;
let pendingRefresh: ReturnType<typeof setTimeout> | undefined;

const isSameItems = (a: readonly ContentSummary[], b: readonly ContentSummary[] | undefined): boolean =>
    b != null && a.length === b.length && a.every((item, index) => item === b[index]);

function mergeFacts(id: number, patch: Partial<BrowseActionFacts>): void {
    if (id !== requestId) return;

    $browseActionFacts.set({ ...$browseActionFacts.get(), ...patch });
}

function checkChildrenAllowed(id: number, facts: BrowseActionFacts): void {
    if (!needsChildrenAllowedCheck(facts)) return;

    const type = facts.items[0].getType();

    void fetchAllowsChildContent(type.toString()).match(
        (childrenAllowed) => mergeFacts(id, { childrenAllowed }),
        () => {
            if (id !== requestId) return;

            notifyWarning(i18n('notify.contentType.notFound', type.getLocalName()));
            mergeFacts(id, { contentTypeMissing: true });
        },
    );
}

function checkUnpublishedChildren(id: number, facts: BrowseActionFacts): void {
    const env = { stashed: isBrowseActionsStashed(), canRequestPublish: ProjectHelper.canRequestPublish() };
    if (!needsUnpublishedChildrenCheck(facts, env)) return;

    void hasUnpublishedChildren(facts.items.map((item) => item.getContentId())).match(
        (result) => mergeFacts(id, { hasUnpublishedChildren: [...result.values()].some(Boolean) }),
        handleError,
    );
}

/** Re-reads the facts for the current items; a newer call supersedes the answers of an older one. */
export function refreshBrowseActions(): void {
    clearTimeout(pendingRefresh);
    pendingRefresh = undefined;

    if ($noProjectMode.get()) return;

    const items = $currentItems.get();
    const id = ++requestId;
    trackedItems = items;

    void fetchPermittedActions(
        items.map((item) => item.getId()),
        items.length === 0 ? ROOT_PERMISSIONS : ITEM_PERMISSIONS,
    ).match((permissions) => {
        if (id !== requestId) return;

        const facts: BrowseActionFacts = { items, permissions };
        $browseActionFacts.set(facts);
        checkChildrenAllowed(id, facts);
        checkUnpublishedChildren(id, facts);
    }, handleError);
}

// ! Any content change counts, not only one to the current items: publishing a child
// ! changes what Publish tree and Request publish offer for its parent.
function handleContentChanged(event: unknown): void {
    if (event == null || $currentItems.get().length === 0) return;

    clearTimeout(pendingRefresh);
    pendingRefresh = setTimeout(refreshBrowseActions, CONTENT_CHANGE_DELAY_MS);
}

//
// * Service Lifecycle
//

export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    unsubscribers = [
        // ! The store hands out a new array on every cache change, also for unrelated content.
        $currentItems.listen((items) => {
            if (!isSameItems(items, trackedItems)) {
                refreshBrowseActions();
            }
        }),
        onActiveProjectChanged(refreshBrowseActions),
        ...CONTENT_CHANGES.map((store) => store.listen(handleContentChanged)),
        onApplicationEvent(clearAllowsChildContentCache),
    ];

    refreshBrowseActions();
};

export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
    clearTimeout(pendingRefresh);
    pendingRefresh = undefined;
    trackedItems = undefined;
    requestId += 1;
};
