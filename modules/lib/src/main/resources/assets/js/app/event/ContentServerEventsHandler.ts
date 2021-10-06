/* eslint-disable complexity */
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {NodeServerChangeType} from 'lib-admin-ui/event/NodeServerChange';
import {ContentDeletedEvent} from './ContentDeletedEvent';
import {BatchContentServerEvent} from './BatchContentServerEvent';
import {ContentUpdatedEvent} from './ContentUpdatedEvent';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {CompareStatusChecker} from '../content/CompareStatus';
import {ContentIds} from '../content/ContentIds';
import {Branch} from '../versioning/Branch';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentServerChangeItem} from './ContentServerChangeItem';
import {ProjectContext} from '../project/ProjectContext';
import {RepositoryId} from '../repository/RepositoryId';
import {ContentId} from '../content/ContentId';
import {ContentPath} from '../content/ContentPath';
import {Store} from 'lib-admin-ui/store/Store';

export const CONTENT_SERVER_EVENTS_HANDLER_KEY: string = 'ContentServerEventsHandler';

/**
 * Class that listens to server events and fires UI events
 */
export class ContentServerEventsHandler {

    private handler: (event: BatchContentServerEvent) => void;

    private contentCreatedListeners: { (data: ContentSummaryAndCompareStatus[]): void }[] = [];

    private contentUpdatedListeners: { (data: ContentSummaryAndCompareStatus[]): void }[] = [];

    private contentDeletedListeners: { (paths: ContentServerChangeItem[]): void }[] = [];

    private contentDeletedInOtherReposListeners: { (paths: ContentServerChangeItem[]): void }[] = [];

    private contentMovedListeners: { (data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]): void }[] = [];

    private contentRenamedListeners: { (data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]): void }[] = [];

    private contentArchivedListeners: { (paths: ContentServerChangeItem[]): void }[] = [];

    private contentPublishListeners: { (data: ContentSummaryAndCompareStatus[]): void }[] = [];

    private contentUnpublishListeners: { (data: ContentSummaryAndCompareStatus[]): void }[] = [];

    private contentPendingListeners: { (data: ContentSummaryAndCompareStatus[]): void }[] = [];

    private contentDuplicateListeners: { (data: ContentSummaryAndCompareStatus[]): void }[] = [];

    private contentSortListeners: { (data: ContentSummaryAndCompareStatus[]): void }[] = [];

    private contentPermissionsUpdatedListeners: { (contentIds: ContentIds): void }[] = [];

    private static debug: boolean = false;

    constructor() {
        //
    }

    static getInstance(): ContentServerEventsHandler {
        let instance: ContentServerEventsHandler = Store.instance().get(CONTENT_SERVER_EVENTS_HANDLER_KEY);

        if (instance == null) {
            instance = new ContentServerEventsHandler();
            Store.instance().set(CONTENT_SERVER_EVENTS_HANDLER_KEY, instance);
        }

        return instance;
    }

    start() {
        if (!this.handler) {
            this.handler = this.contentServerEventHandler.bind(this);
        }

        BatchContentServerEvent.on(this.handler);
    }

    stop() {
        if (this.handler) {
            BatchContentServerEvent.un(this.handler);
            this.handler = null;
        }
    }

    onContentPermissionsUpdated(listener: (contentIds: ContentIds) => void) {
        this.contentPermissionsUpdatedListeners.push(listener);
    }

    private hasDraftBranchChanges(changeItems: ContentServerChangeItem[]): boolean {
        return changeItems.some(changeItem => {
            return changeItem.getBranch() === Branch.DRAFT;
        });
    }

    private extractContentPaths(changeItems: ContentServerChangeItem[]): ContentPath[] {
        return changeItems.map((item: ContentServerChangeItem) => item.getPath());
    }

    private extractNewContentPaths(changeItems: ContentServerChangeItem[]): ContentPath[] {
        return changeItems.map((changeItem: ContentServerChangeItem) => changeItem.getNewPath());
    }

    private extractContentIds(changeItems: ContentServerChangeItem[]): ContentId[] {
        return changeItems.map((item: ContentServerChangeItem) => item.getContentId());
    }

    private handleContentCreated(data: ContentSummaryAndCompareStatus[]) {
        if (ContentServerEventsHandler.debug) {
            console.debug('ContentServerEventsHandler: created', data);
        }
        this.notifyContentCreated(data);
    }

    private handleContentUpdated(data: ContentSummaryAndCompareStatus[]) {
        if (ContentServerEventsHandler.debug) {
            console.debug('ContentServerEventsHandler: updated', data);
        }
        // TODO: refactor update event to contain multiple contents ?
        data.forEach((el) => {
            new ContentUpdatedEvent(el.getContentSummary()).fire();
        });

        this.notifyContentUpdated(data);
    }

    private handleContentRenamed(data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) {
        if (ContentServerEventsHandler.debug) {
            console.debug('ContentServerEventsHandler: renamed', data, oldPaths);
        }
        this.notifyContentRenamed(data, oldPaths);
    }

    private handleContentDeleted(changeItems: ContentServerChangeItem[]) {
        if (ContentServerEventsHandler.debug) {
            console.debug('ContentServerEventsHandler: deleted', changeItems);
        }
        const contentDeletedEvent: ContentDeletedEvent = new ContentDeletedEvent();
        changeItems.forEach((changeItem) => {
            contentDeletedEvent.addItem(changeItem.getContentId(), changeItem.getPath(),
                Branch[changeItem.getBranch().toUpperCase()]);
        });
        contentDeletedEvent.fire();

        this.notifyContentDeleted(changeItems);
    }

    private handleContentPending(data: ContentSummaryAndCompareStatus[]) {
        if (ContentServerEventsHandler.debug) {
            console.debug('ContentServerEventsHandler: pending', data);
        }
        let contentDeletedEvent = new ContentDeletedEvent();

        data.filter((el) => {
            return !!el;        // not sure if this check is necessary
        }).forEach((el) => {

            if (CompareStatusChecker.isPendingDelete(el.getCompareStatus())) {
                contentDeletedEvent.addPendingItem(el);
            } else {
                contentDeletedEvent.addUndeletedItem(el);
            }
        });
        contentDeletedEvent.fire();

        this.notifyContentPending(data);
    }

    private handleContentDuplicated(data: ContentSummaryAndCompareStatus[]) {
        if (ContentServerEventsHandler.debug) {
            console.debug('ContentServerEventsHandler: duplicated', data);
        }
        this.notifyContentDuplicated(data);
    }

    private handleContentPublished(data: ContentSummaryAndCompareStatus[]) {
        if (ContentServerEventsHandler.debug) {
            console.debug('ContentServerEventsHandler: published', data);
        }

        this.notifyContentPublished(data);
    }

    private handleContentUnpublished(data: ContentSummaryAndCompareStatus[]) {
        if (ContentServerEventsHandler.debug) {
            console.debug('ContentServerEventsHandler: unpublished', data);
        }

        this.notifyContentUnpublished(data);
    }

    private handleContentMoved(data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) {
        if (ContentServerEventsHandler.debug) {
            console.debug('ContentServerEventsHandler: moved', data, oldPaths);
        }
        this.notifyContentMoved(data, oldPaths);
    }

    private handleContentSorted(data: ContentSummaryAndCompareStatus[]) {
        if (ContentServerEventsHandler.debug) {
            console.debug('ContentServerEventsHandler: sorted', data);
        }
        this.notifyContentSorted(data);
    }

    unContentPermissionsUpdated(listener: (contentIds: ContentIds) => void) {
        this.contentPermissionsUpdatedListeners =
            this.contentPermissionsUpdatedListeners.filter((currentListener: (contentIds: ContentIds) => void) => {
                return currentListener !== listener;
            });
    }

    onContentCreated(listener: (data: ContentSummaryAndCompareStatus[]) => void) {
        this.contentCreatedListeners.push(listener);
    }

    unContentCreated(listener: (data: ContentSummaryAndCompareStatus[]) => void) {
        this.contentCreatedListeners =
            this.contentCreatedListeners.filter((currentListener: (data: ContentSummaryAndCompareStatus[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyContentCreated(data: ContentSummaryAndCompareStatus[]) {
        this.contentCreatedListeners.forEach((listener: (data: ContentSummaryAndCompareStatus[]) => void) => {
            listener(data);
        });
    }

    onContentUpdated(listener: (data: ContentSummaryAndCompareStatus[]) => void) {
        this.contentUpdatedListeners.push(listener);
    }

    unContentUpdated(listener: (data: ContentSummaryAndCompareStatus[]) => void) {
        this.contentUpdatedListeners =
            this.contentUpdatedListeners.filter((currentListener: (data: ContentSummaryAndCompareStatus[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyContentUpdated(data: ContentSummaryAndCompareStatus[]) {
        this.contentUpdatedListeners.forEach((listener: (data: ContentSummaryAndCompareStatus[]) => void) => {
            listener(data);
        });
    }

    onContentDeleted(listener: (paths: ContentServerChangeItem[]) => void) {
        this.contentDeletedListeners.push(listener);
    }

    unContentDeleted(listener: (paths: ContentServerChangeItem[]) => void) {
        this.contentDeletedListeners =
            this.contentDeletedListeners.filter((currentListener: (paths: ContentServerChangeItem[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyContentDeleted(paths: ContentServerChangeItem[]) {
        this.contentDeletedListeners.forEach((listener: (paths: ContentServerChangeItem[]) => void) => {
            listener(paths);
        });
    }

    onContentDeletedInOtherRepos(listener: (paths: ContentServerChangeItem[]) => void) {
        this.contentDeletedInOtherReposListeners.push(listener);
    }

    unContentDeletedInOtherRepos(listener: (paths: ContentServerChangeItem[]) => void) {
        this.contentDeletedInOtherReposListeners =
            this.contentDeletedInOtherReposListeners.filter((currentListener: (paths: ContentServerChangeItem[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyContentDeletedInOtherRepos(paths: ContentServerChangeItem[]) {
        this.contentDeletedInOtherReposListeners.forEach((listener: (paths: ContentServerChangeItem[]) => void) => {
            listener(paths);
        });
    }

    onContentMoved(listener: (data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => void) {
        this.contentMovedListeners.push(listener);
    }

    unContentMoved(listener: (data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => void) {
        this.contentMovedListeners =
            this.contentMovedListeners.filter((currentListener: (data: ContentSummaryAndCompareStatus[],
                                                                 oldPaths: ContentPath[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyContentMoved(data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) {
        this.contentMovedListeners.forEach((listener: (data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => void) => {
            listener(data, oldPaths);
        });
    }

    onContentArchived(listener: (paths: ContentServerChangeItem[]) => void) {
        this.contentArchivedListeners.push(listener);
    }

    unContentArchived(listener: (paths: ContentServerChangeItem[]) => void) {
        this.contentArchivedListeners =
            this.contentArchivedListeners.filter((currentListener: (paths: ContentServerChangeItem[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyContentArchived(paths: ContentServerChangeItem[]) {
        this.contentArchivedListeners.forEach((listener: (paths: ContentServerChangeItem[]) => void) => {
            listener(paths);
        });
    }

    onContentRenamed(listener: (data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => void) {
        this.contentRenamedListeners.push(listener);
    }

    unContentRenamed(listener: (data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => void) {
        this.contentRenamedListeners =
            this.contentRenamedListeners.filter((currentListener: (data: ContentSummaryAndCompareStatus[],
                                                                   oldPaths: ContentPath[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyContentRenamed(data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) {
        this.contentRenamedListeners.forEach((listener: (data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => void) => {
            listener(data, oldPaths);
        });
    }

    onContentDuplicated(listener: (data: ContentSummaryAndCompareStatus[]) => void) {
        this.contentDuplicateListeners.push(listener);
    }

    unContentDuplicated(listener: (data: ContentSummaryAndCompareStatus[]) => void) {
        this.contentDuplicateListeners =
            this.contentDuplicateListeners.filter((currentListener: (data: ContentSummaryAndCompareStatus[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyContentDuplicated(data: ContentSummaryAndCompareStatus[]) {
        this.contentDuplicateListeners.forEach((listener: (data: ContentSummaryAndCompareStatus[]) => void) => {
            listener(data);
        });
    }

    onContentPublished(listener: (data: ContentSummaryAndCompareStatus[]) => void) {
        this.contentPublishListeners.push(listener);
    }

    unContentPublished(listener: (data: ContentSummaryAndCompareStatus[]) => void) {
        this.contentPublishListeners =
            this.contentPublishListeners.filter((currentListener: (data: ContentSummaryAndCompareStatus[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyContentPublished(data: ContentSummaryAndCompareStatus[]) {
        this.contentPublishListeners.forEach((listener: (data: ContentSummaryAndCompareStatus[]) => void) => {
            listener(data);
        });
    }

    onContentUnpublished(listener: (data: ContentSummaryAndCompareStatus[]) => void) {
        this.contentUnpublishListeners.push(listener);
    }

    unContentUnpublished(listener: (data: ContentSummaryAndCompareStatus[]) => void) {
        this.contentUnpublishListeners =
            this.contentUnpublishListeners.filter((currentListener: (data: ContentSummaryAndCompareStatus[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyContentUnpublished(data: ContentSummaryAndCompareStatus[]) {
        this.contentUnpublishListeners.forEach((listener: (data: ContentSummaryAndCompareStatus[]) => void) => {
            listener(data);
        });
    }

    onContentPending(listener: (data: ContentSummaryAndCompareStatus[]) => void) {
        this.contentPendingListeners.push(listener);
    }

    unContentPending(listener: (data: ContentSummaryAndCompareStatus[]) => void) {
        this.contentPendingListeners =
            this.contentPendingListeners.filter((currentListener: (data: ContentSummaryAndCompareStatus[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyContentPending(data: ContentSummaryAndCompareStatus[]) {
        this.contentPendingListeners.forEach((listener: (data: ContentSummaryAndCompareStatus[]) => void) => {
            listener(data);
        });
    }

    onContentSorted(listener: (data: ContentSummaryAndCompareStatus[]) => void) {
        this.contentSortListeners.push(listener);
    }

    unContentSorted(listener: (data: ContentSummaryAndCompareStatus[]) => void) {
        this.contentSortListeners =
            this.contentSortListeners.filter((currentListener: (data: ContentSummaryAndCompareStatus[]) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyContentSorted(data: ContentSummaryAndCompareStatus[]) {
        this.contentSortListeners.forEach((listener: (data: ContentSummaryAndCompareStatus[]) => void) => {
            listener(data);
        });
    }

    private contentServerEventHandler(event: BatchContentServerEvent) {
        if (ContentServerEventsHandler.debug) {
            console.debug('ContentServerEventsHandler: received server event', event);
        }

        if (!ProjectContext.get().isInitialized()) {
            return;
        }

        const currentRepo: string = RepositoryId.fromCurrentProject().toString();
        const currentRepoChanges: ContentServerChangeItem[] = [];
        const otherReposChanges: ContentServerChangeItem[] = [];

        event.getItems().forEach((item: ContentServerChangeItem) => {
            if (item.getRepo() === currentRepo) {
                currentRepoChanges.push(item);
            } else {
                otherReposChanges.push(item);
            }
        });

        if (currentRepoChanges.length > 0) {
            this.handleCurrentRepoChanges(currentRepoChanges, event.getType());
        }

        if (otherReposChanges.length > 0) {
            this.handleOtherReposChanges(otherReposChanges, event.getType());
        }
    }

    private handleContentEvent(type: NodeServerChangeType, summaries: ContentSummaryAndCompareStatus[], changedItems: ContentServerChangeItem[]) {
        switch (type) {
            case NodeServerChangeType.CREATE:
                this.handleContentCreated(summaries);
                break;
            case NodeServerChangeType.UPDATE:
                this.handleContentUpdated(summaries);
                break;
            case NodeServerChangeType.RENAME:
                // also supply old paths in case of rename
                this.handleContentRenamed(summaries, this.extractContentPaths(changedItems));
                break;
            case NodeServerChangeType.DELETE:
                // delete from draft has been handled without fetching summaries,
                // deleting from master is unpublish
                this.handleContentUnpublished(summaries);
                break;
            case NodeServerChangeType.PENDING:
                this.handleContentPending(summaries);
                break;
            case NodeServerChangeType.DUPLICATE:
                this.handleContentDuplicated(summaries);
                break;
            case NodeServerChangeType.PUBLISH:
                this.handleContentPublished(summaries);
                break;
            case NodeServerChangeType.SORT:
                this.handleContentSorted(summaries);
                break;
            case NodeServerChangeType.UNKNOWN:
                break;
            default:
            //
        }
    }
    
    private handleCurrentRepoChanges(changedItems: ContentServerChangeItem[], type: NodeServerChangeType) {
        if (type === NodeServerChangeType.DELETE && this.hasDraftBranchChanges(changedItems)) {
            // content has already been deleted so no need to fetch summaries

            const deletedItems: ContentServerChangeItem[] = changedItems.filter(d => d.getBranch() === Branch.DRAFT);
            if (deletedItems.length) {
                this.handleContentDeleted(deletedItems);
            }

            const unpublishedItems: ContentServerChangeItem[] = changedItems.filter(
                d => deletedItems.every(deleted => !ObjectHelper.equals(deleted.getContentId(),
                    d.getContentId())));

            if (unpublishedItems.length) {
                ContentSummaryAndCompareStatusFetcher.fetchByPaths(unpublishedItems.map(item => item.getPath()))
                    .then((summaries) => {
                        this.handleContentUnpublished(summaries);
                    });
            }
        } else if (type === NodeServerChangeType.MOVE) {
            ContentSummaryAndCompareStatusFetcher.fetchByPaths(this.extractNewContentPaths(changedItems))
                .then((summaries) => {
                    this.handleContentMoved(summaries, this.extractContentPaths(changedItems));
                });
        } else if (type === NodeServerChangeType.UPDATE_PERMISSIONS) {
            this.handleContentPermissionsUpdated(this.extractContentIds(changedItems));
        } else {
            ContentSummaryAndCompareStatusFetcher.fetchByIds(this.extractContentIds(changedItems))
                .then((summaries: ContentSummaryAndCompareStatus[]) => {
                    if (ContentServerEventsHandler.debug) {
                        console.debug('ContentServerEventsHandler: fetched summaries', summaries);
                    }
                    this.handleContentEvent(type, summaries, changedItems);
                }).catch(DefaultErrorHandler.handle);
        }
    }

    private handleContentPermissionsUpdated(contentIds: ContentId[]) {
        if (ContentServerEventsHandler.debug) {
            console.debug('ContentServerEventsHandler: permissions updated', contentIds);
        }
        this.notifyContentPermissionsUpdated(ContentIds.from(contentIds));
    }

    private notifyContentPermissionsUpdated(contentIds: ContentIds) {
        this.contentPermissionsUpdatedListeners.forEach((listener: (contentIds: ContentIds) => void) => {
            listener(contentIds);
        });
    }

    private handleOtherReposChanges(changeItems: ContentServerChangeItem[], type: NodeServerChangeType) {
        if (type === NodeServerChangeType.DELETE) {
            // content has already been deleted so no need to fetch summaries
            this.notifyContentDeletedInOtherRepos(changeItems);
        }
    }
}
