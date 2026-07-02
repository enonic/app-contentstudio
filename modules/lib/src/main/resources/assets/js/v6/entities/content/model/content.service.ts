import { $activeProject } from '../../../features/store/activeProject.store';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentDuplicated,
    $contentMoved,
    $contentPublished,
    $contentRenamed,
    $contentSorted,
    $contentUnpublished,
    $contentUpdated,
} from '../../../shared/socket';
import { connectContentSelectionToSocket } from './content-selection.store';
import { connectContentTreeToSocket } from './content-tree.store';
import { removeContents, setContents } from './content.commands';
import { readPathIndex, readProjectCache, writePathIndex, writeProjectCache } from './content.store';
import type { PathIndex, ProjectCache } from './content.types';
import { connectFilterTreeToSocket } from './filter-tree.store';

//
// * Content Service
//
// Subscribes to socket event signals and keeps the content cache, the tree
// projections, and the selection in sync.
// Started explicitly from the app root (after the socket service) so wiring
// is ordered, testable, and never a side effect of importing a store.
// Server-side subscriptions are per-active-project, so writes target that partition.
//

let unsubscribers: Array<() => void> = [];

/**
 * Start syncing the content cache from socket events.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    unsubscribers = [
        $contentUpdated.subscribe((event) => {
            if (event?.data) {
                setContents(event.data);
            }
        }),
        $contentCreated.subscribe((event) => {
            if (event?.data) {
                setContents(event.data);
            }
        }),
        $contentDeleted.subscribe((event) => {
            if (event?.data) {
                const ids = event.data.map((item) => item.getContentId().toString());
                removeContents(ids);
            }
        }),
        $contentRenamed.subscribe((event) => {
            if (event?.data?.items) {
                setContents(event.data.items);
            }
        }),
        $contentArchived.subscribe((event) => {
            if (event?.data) {
                const ids = event.data.map((item) => item.getContentId().toString());
                removeContents(ids);
            }
        }),
        $contentPublished.subscribe((event) => {
            if (event?.data) {
                setContents(event.data);
            }
        }),
        $contentUnpublished.subscribe((event) => {
            if (event?.data) {
                setContents(event.data);
            }
        }),
        $contentDuplicated.subscribe((event) => {
            if (event?.data) {
                setContents(event.data);
            }
        }),
        // $contentMoved is the only event for cross-parent moves; delete/create are not emitted.
        $contentMoved.subscribe((event) => {
            if (!event?.data) return;

            const name = $activeProject.get()?.getName();
            if (!name) return;

            const cacheUpdates: ProjectCache = { ...readProjectCache(name) };
            const indexUpdates: PathIndex = { ...readPathIndex(name) };

            for (const moved of event.data) {
                const summary = moved.item.getContentSummary();
                const id = summary.getId();
                const newPath = summary.getPath?.()?.toString();
                const oldPath = moved.oldPath.toString();

                cacheUpdates[id] = summary;

                if (indexUpdates[oldPath] === id) {
                    delete indexUpdates[oldPath];
                }

                if (newPath) {
                    indexUpdates[newPath] = id;
                }
            }

            writeProjectCache(name, cacheUpdates);
            writePathIndex(name, indexUpdates);
        }),
        $contentSorted.subscribe((event) => {
            if (event?.data) {
                setContents(event.data);
            }
        }),
        ...connectContentTreeToSocket(),
        ...connectFilterTreeToSocket(),
        ...connectContentSelectionToSocket(),
    ];
};

/**
 * Stop syncing and detach all subscriptions.
 */
export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};

/**
 * Check if the service is currently syncing.
 */
export const isRunning = (): boolean => {
    return unsubscribers.length > 0;
};
