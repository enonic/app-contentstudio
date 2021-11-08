import {NodeServerChangeType} from 'lib-admin-ui/event/NodeServerChange';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ContentServerEvent} from './ContentServerEvent';
import {ContentServerChangeItem} from './ContentServerChangeItem';

export class ServerEventAggregator {

    private static AGGREGATION_TIMEOUT: number = 500;

    private batchReadyListeners: { (items: ContentServerChangeItem[], type: NodeServerChangeType): void }[] = [];

    private typesAndDelayedFunctions: Map<NodeServerChangeType, Function> = new Map<NodeServerChangeType, Function>();

    private typesAndChangeItems: Map<NodeServerChangeType, ContentServerChangeItem[]> =
        new Map<NodeServerChangeType, ContentServerChangeItem[]>();

    constructor() {
    //
    }

    appendEvent(event: ContentServerEvent) {
        const type: NodeServerChangeType = event.getNodeChange().getChangeType();
        this.processNewEvent(event);

        if (this.typesAndDelayedFunctions.get(type)) {
            this.typesAndDelayedFunctions.get(type)();
            this.typesAndChangeItems.get(type).push(...event.getNodeChange().getChangeItems());
        } else {
            const debouncedFunc: Function = AppHelper.debounce(() => {
                const items: ContentServerChangeItem[] = this.typesAndChangeItems.get(type);

                this.typesAndDelayedFunctions.delete(type);
                this.typesAndChangeItems.delete(type);

                if (items?.length > 0) {
                    this.notifyBatchIsReady(items, type);
                }

            }, ServerEventAggregator.AGGREGATION_TIMEOUT);

            this.typesAndDelayedFunctions.set(type, debouncedFunc);
            this.typesAndChangeItems.set(type, event.getNodeChange().getChangeItems());

            debouncedFunc();
        }

    }

    private processNewEvent(event: ContentServerEvent) {
        if (!this.isMoveEvent(event)) {
            return;
        }

        const itemsMovedToOtherRoot: ContentServerChangeItem[] = this.getItemsMovedToOtherRoot(event);

        if (itemsMovedToOtherRoot.length > 0) {
            this.filterEventsOfDeletedOrMovedItems(itemsMovedToOtherRoot);
        }
    }

    private getItemsMovedToOtherRoot(event: ContentServerEvent): ContentServerChangeItem[] {
        return event.getNodeChange().getChangeItems().filter((item: ContentServerChangeItem) => {
            return item.getNewPath()?.isInArchiveRoot();
        });
    }

    private isMoveEvent(event: ContentServerEvent): boolean {
        return event.getNodeChange().getChangeType() === NodeServerChangeType.MOVE;
    }

    private filterEventsOfDeletedOrMovedItems(itemsMovedToOtherRoot: ContentServerChangeItem[]) {
        const updatedItems: ContentServerChangeItem[] = this.typesAndChangeItems.get(NodeServerChangeType.UPDATE) || [];
        const renamedItems: ContentServerChangeItem[] = this.typesAndChangeItems.get(NodeServerChangeType.RENAME) || [];

        const filteredUpdatedItems: ContentServerChangeItem[] =
            updatedItems.filter((item: ContentServerChangeItem) => !this.contains(itemsMovedToOtherRoot, item));
        const filteredRenamedItems: ContentServerChangeItem[] =
            renamedItems.filter((item: ContentServerChangeItem) => !this.contains(itemsMovedToOtherRoot, item));

        this.typesAndChangeItems.set(NodeServerChangeType.UPDATE, filteredUpdatedItems);
        this.typesAndChangeItems.set(NodeServerChangeType.RENAME, filteredRenamedItems);
    }

    private contains(items: ContentServerChangeItem[], item: ContentServerChangeItem): boolean {
        return items.some((i: ContentServerChangeItem) => i.getId() === item.getId());
    }

    onBatchIsReady(listener: (items: ContentServerChangeItem[], type: NodeServerChangeType) => void) {
        this.batchReadyListeners.push(listener);
    }

    unBatchIsReady(listener: (items: ContentServerChangeItem[], type: NodeServerChangeType) => void) {
        this.batchReadyListeners =
            this.batchReadyListeners.filter((currentListener: (items: ContentServerChangeItem[], type: NodeServerChangeType) => void) => {
                return listener !== currentListener;
            });
    }

    private notifyBatchIsReady(items: ContentServerChangeItem[], type: NodeServerChangeType) {
        this.batchReadyListeners.forEach((listener: (items: ContentServerChangeItem[], type: NodeServerChangeType) => void) => {
            listener(items, type);
        });
    }

}
