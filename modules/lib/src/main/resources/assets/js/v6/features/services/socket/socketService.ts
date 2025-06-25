import {ContentServerEventsHandler} from '../../../../app/event/ContentServerEventsHandler';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import type {ContentServerChangeItem} from '../../../../app/event/ContentServerChangeItem';
import type {MovedContentItem} from '../../../../app/browse/MovedContentItem';
import type {ContentPath} from '../../../../app/content/ContentPath';
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
} from '../../store/socket.store';

type Listener<T> = (data: T) => void;
type ContentListener = Listener<ContentSummaryAndCompareStatus[]>;
type ChangeItemListener = Listener<ContentServerChangeItem[]>;
type MovedListener = Listener<MovedContentItem[]>;
type RenamedListener = (data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => void;

/**
 * Socket service that bridges legacy ContentServerEventsHandler to v6 stores.
 * Subscribes to server events and emits them to nanostores for reactive updates.
 */
class SocketService {
    private initialized = false;

    private listeners: {
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

    constructor() {
        this.listeners = {
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
    }

    /**
     * Initialize the socket service and start listening to server events.
     * Safe to call multiple times - will only initialize once.
     */
    start(): void {
        if (this.initialized) {
            return;
        }

        const handler = ContentServerEventsHandler.getInstance();

        handler.onContentCreated(this.listeners.created);
        handler.onContentUpdated(this.listeners.updated);
        handler.onContentDeleted(this.listeners.deleted);
        handler.onContentMoved(this.listeners.moved);
        handler.onContentRenamed(this.listeners.renamed);
        handler.onContentArchived(this.listeners.archived);
        handler.onContentPublished(this.listeners.published);
        handler.onContentUnpublished(this.listeners.unpublished);
        handler.onContentDuplicated(this.listeners.duplicated);
        handler.onContentSorted(this.listeners.sorted);
        handler.onContentPermissionsUpdated(this.listeners.permissionsUpdated);

        this.initialized = true;
        setSocketConnected(true);
    }

    /**
     * Stop listening to server events and clean up.
     */
    stop(): void {
        if (!this.initialized) {
            return;
        }

        const handler = ContentServerEventsHandler.getInstance();

        handler.unContentCreated(this.listeners.created);
        handler.unContentUpdated(this.listeners.updated);
        handler.unContentDeleted(this.listeners.deleted);
        handler.unContentMoved(this.listeners.moved);
        handler.unContentRenamed(this.listeners.renamed);
        handler.unContentArchived(this.listeners.archived);
        handler.unContentPublished(this.listeners.published);
        handler.unContentUnpublished(this.listeners.unpublished);
        handler.unContentDuplicated(this.listeners.duplicated);
        handler.unContentSorted(this.listeners.sorted);
        handler.unContentPermissionsUpdated(this.listeners.permissionsUpdated);

        this.initialized = false;
        setSocketConnected(false);
    }

    /**
     * Check if the service is currently listening to events.
     */
    isRunning(): boolean {
        return this.initialized;
    }
}

/** Singleton instance */
export const socketService = new SocketService();
