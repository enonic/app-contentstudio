import {NodeServerChangeType} from '@enonic/lib-admin-ui/event/NodeServerChange';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ContentServerEvent} from './ContentServerEvent';
import {ContentServerChangeItem} from './ContentServerChangeItem';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type delayedFnType = (args?: any[], interrupt?: boolean) => void

export class ServerEventAggregator {

    private static AGGREGATION_TIMEOUT: number = 500;

    private batchReadyListeners: ((items: ContentServerChangeItem[], type: NodeServerChangeType) => void)[] = [];

    private typesAndDelayedFunctions: Map<string, delayedFnType> = new Map<string, delayedFnType>();

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
                const debouncedFunc: delayedFnType =
                    AppHelper.debounceWithInterrupt(() => {
                        const items: ContentServerChangeItem[] = this.typesAndChangeItems.get(typeAndRepo);

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
