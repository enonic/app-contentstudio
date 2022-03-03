import {NodeServerChangeType} from 'lib-admin-ui/event/NodeServerChange';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ContentServerEvent} from './ContentServerEvent';
import {ContentServerChangeItem} from './ContentServerChangeItem';

export class ServerEventAggregator {

    private static AGGREGATION_TIMEOUT: number = 500;

    private batchReadyListeners: { (items: ContentServerChangeItem[], type: NodeServerChangeType): void }[] = [];

    private typesAndDelayedFunctions: Map<string, Function> = new Map<string, Function>();

    private typesAndChangeItems: Map<string, ContentServerChangeItem[]> =
        new Map<string, ContentServerChangeItem[]>();

    constructor() {
    //
    }

    appendEvent(event: ContentServerEvent) {
        const type: NodeServerChangeType = event.getNodeChange().getChangeType();

        event.getNodeChange().getChangeItems().forEach((changeItem: ContentServerChangeItem) => {
            const typeAndRepo: string = `${NodeServerChangeType[type]}:${changeItem.getRepo()}`;

            if (this.typesAndDelayedFunctions.get(typeAndRepo)) {
                this.typesAndChangeItems.get(typeAndRepo).push(changeItem);
                this.typesAndDelayedFunctions.get(typeAndRepo)();
            } else {
                const debouncedFunc: Function = AppHelper.debounceWithInterrupt(() => {
                    const items: ContentServerChangeItem[] = this.filterItems(typeAndRepo);

                    this.typesAndDelayedFunctions.delete(typeAndRepo);
                    this.typesAndChangeItems.delete(typeAndRepo);

                    if (items?.length > 0) {
                        this.notifyBatchIsReady(items, type);
                    }
                }, ServerEventAggregator.AGGREGATION_TIMEOUT);

                this.typesAndDelayedFunctions.set(typeAndRepo, debouncedFunc);
                this.typesAndChangeItems.set(typeAndRepo, event.getNodeChange().getChangeItems());

                debouncedFunc();
            }
        });
    }

    private filterItems(typeAndRepo: string): ContentServerChangeItem[] {
        const items: ContentServerChangeItem[] = this.typesAndChangeItems.get(typeAndRepo);

        if (this.isNotMoveOrDeleteEvent(typeAndRepo)) {
            return items.filter((item: ContentServerChangeItem) => this.isNotPendingMoveOrDeleteItem(item));
        }

        return items;
    }

    private isNotMoveOrDeleteEvent(typeAndRepo: string): boolean {
        const eventType: string = typeAndRepo.split(':')[0];
        return eventType !== NodeServerChangeType[NodeServerChangeType.MOVE]
               && eventType !== NodeServerChangeType[NodeServerChangeType.DELETE];
    }

    private isNotPendingMoveOrDeleteItem(item: ContentServerChangeItem): boolean {
        return !this.isItemPendingDelete(item) && !this.isItemPendingMove(item);
    }

    private isItemPendingMove(item: ContentServerChangeItem): boolean {
        return this.isItemPending(item, NodeServerChangeType.MOVE);
    }

    private isItemPendingDelete(item: ContentServerChangeItem): boolean {
        return this.isItemPending(item, NodeServerChangeType.DELETE);
    }

    private isItemPending(item: ContentServerChangeItem, type: NodeServerChangeType): boolean {
        const itemsPendingMove: ContentServerChangeItem[] =
            this.typesAndChangeItems.get(`${NodeServerChangeType[type]}:${item.getRepo()}`);

        return itemsPendingMove?.some((pendingMove: ContentServerChangeItem) => pendingMove.getId() === item.getId());
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
