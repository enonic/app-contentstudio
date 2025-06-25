import {ContentServerEventsHandler} from '../../../app/event/ContentServerEventsHandler';
import type {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import type {ContentServerChangeItem} from '../../../app/event/ContentServerChangeItem';
import type {MovedContentItem} from '../../../app/browse/MovedContentItem';
import type {ContentPath} from '../../../app/content/ContentPath';
import {
    setSocketConnected,
    emitContentCreated,
    emitContentUpdated,
    emitContentDeleted,
    emitContentMoved,
    emitContentRenamed,
    emitContentArchived,
    emitContentPublished,
    emitContentUnpublished,
    emitContentDuplicated,
    emitContentSorted,
    emitContentPermissionsUpdated,
} from '../store/socket.store';

//
// * Types
//

type Listener<T> = (data: T) => void;
type ContentListener = Listener<ContentSummaryAndCompareStatus[]>;
type ChangeItemListener = Listener<ContentServerChangeItem[]>;
type MovedListener = Listener<MovedContentItem[]>;
type RenamedListener = (data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => void;

type Listeners = {
    created: ContentListener;
    updated: ContentListener;
    deleted: ChangeItemListener;
    moved: MovedListener;
    renamed: RenamedListener;
    archived: ChangeItemListener;
    published: ContentListener;
    unpublished: ContentListener;
    duplicated: ContentListener;
    sorted: ContentListener;
    permissionsUpdated: ContentListener;
};

//
// * State
//

let initialized = false;

const listeners: Listeners = {
    created: (data) => emitContentCreated(data),
    updated: (data) => emitContentUpdated(data),
    deleted: (data) => emitContentDeleted(data),
    moved: (data) => emitContentMoved(data),
    renamed: (data, oldPaths) => emitContentRenamed(data, oldPaths),
    archived: (data) => emitContentArchived(data),
    published: (data) => emitContentPublished(data),
    unpublished: (data) => emitContentUnpublished(data),
    duplicated: (data) => emitContentDuplicated(data),
    sorted: (data) => emitContentSorted(data),
    permissionsUpdated: (data) => emitContentPermissionsUpdated(data),
};

//
// * Public API
//

/**
 * Initialize the socket service and start listening to server events.
 * Bridges legacy ContentServerEventsHandler to v6 stores.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (initialized) {
        return;
    }

    const handler = ContentServerEventsHandler.getInstance();

    handler.onContentCreated(listeners.created);
    handler.onContentUpdated(listeners.updated);
    handler.onContentDeleted(listeners.deleted);
    handler.onContentMoved(listeners.moved);
    handler.onContentRenamed(listeners.renamed);
    handler.onContentArchived(listeners.archived);
    handler.onContentPublished(listeners.published);
    handler.onContentUnpublished(listeners.unpublished);
    handler.onContentDuplicated(listeners.duplicated);
    handler.onContentSorted(listeners.sorted);
    handler.onContentPermissionsUpdated(listeners.permissionsUpdated);

    initialized = true;
    setSocketConnected(true);
};

/**
 * Stop listening to server events and clean up.
 */
export const stop = (): void => {
    if (!initialized) {
        return;
    }

    const handler = ContentServerEventsHandler.getInstance();

    handler.unContentCreated(listeners.created);
    handler.unContentUpdated(listeners.updated);
    handler.unContentDeleted(listeners.deleted);
    handler.unContentMoved(listeners.moved);
    handler.unContentRenamed(listeners.renamed);
    handler.unContentArchived(listeners.archived);
    handler.unContentPublished(listeners.published);
    handler.unContentUnpublished(listeners.unpublished);
    handler.unContentDuplicated(listeners.duplicated);
    handler.unContentSorted(listeners.sorted);
    handler.unContentPermissionsUpdated(listeners.permissionsUpdated);

    initialized = false;
    setSocketConnected(false);
};

/**
 * Check if the service is currently listening to events.
 */
export const isRunning = (): boolean => {
    return initialized;
};
