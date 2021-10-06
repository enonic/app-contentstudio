import {NodeServerEvent} from 'lib-admin-ui/event/NodeServerEvent';
import {NodeServerChange, NodeServerChangeType} from 'lib-admin-ui/event/NodeServerChange';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {NodeServerChangeItem} from 'lib-admin-ui/event/NodeServerChangeItem';

export class ServerEventAggregator {

    private static AGGREGATION_TIMEOUT: number = 500;

    private items: NodeServerChangeItem[];

    private type: NodeServerChangeType;

    private batchReadyListeners: { (event: any): void }[] = [];

    private debouncedNotification: Function;

    constructor() {
        this.debouncedNotification = AppHelper.debounce(() => {
            this.notifyBatchIsReady();
        }, ServerEventAggregator.AGGREGATION_TIMEOUT, false);
    }

    getItems(): NodeServerChangeItem[] {
        return this.items;
    }

    resetItems() {
        this.items = [];
    }

    appendEvent(event: NodeServerEvent) {
        if (this.isEmpty()) {
            this.init(event);
        } else {
            this.processAppendedEvent(event);
        }

        this.debouncedNotification();
    }

    private isEmpty(): boolean {
        return this.items == null || this.items.length === 0;
    }

    private processAppendedEvent(event: NodeServerEvent) {
        if (this.isTheSameTypeEvent(event)) {
            this.items.push(...event.getNodeChange().getChangeItems());
            return;
        }

        if (this.isEventItemMovedToOtherRoot(event)) {
            if (this.type === NodeServerChangeType.UPDATE) {
                this.processBatchedUpdateEvents(event);
            }

            this.init(event);
            return;
        }

        this.notifyBatchIsReady();
        this.init(event);
    }

    getType(): NodeServerChangeType {
        return this.type;
    }

    private isTheSameTypeEvent(event: NodeServerEvent) {
        const change: NodeServerChange = event.getNodeChange();

        if (this.type !== change.getChangeType()) {
            return false;
        }

        return true;
    }

    private init(event: NodeServerEvent) {
        this.items = event.getNodeChange().getChangeItems();
        this.type = !!event.getNodeChange() ? event.getNodeChange().getChangeType() : null;
    }

    private isEventItemMovedToOtherRoot(event: NodeServerEvent): boolean {
        return event.getNodeChange()?.getChangeItems().some((item: NodeServerChangeItem) => {
            return item.getNewPath()?.toString().indexOf('/archive') === 0;
        });
    }

    private processBatchedUpdateEvents(event: NodeServerEvent) {
        const archivedItems: NodeServerChangeItem[] = event.getNodeChange().getChangeItems();
        const nonArchivedItems: NodeServerChangeItem[] =
            this.items.filter((item: NodeServerChangeItem) => !archivedItems.some(
                (archivedItem: NodeServerChangeItem) => archivedItem.getId() === item.getId()));

        if (nonArchivedItems.length > 0) {
            this.notifyBatchIsReady();
        }
    }

    onBatchIsReady(listener: (event: any) => void) {
        this.batchReadyListeners.push(listener);
    }

    unBatchIsReady(listener: (event: any) => void) {
        this.batchReadyListeners = this.batchReadyListeners.filter((currentListener: (event: any) => void) => {
            return listener !== currentListener;
        });
    }

    private notifyBatchIsReady() {
        this.batchReadyListeners.forEach((listener: (event: any) => void) => {
            listener.call(this);
        });
    }

}
