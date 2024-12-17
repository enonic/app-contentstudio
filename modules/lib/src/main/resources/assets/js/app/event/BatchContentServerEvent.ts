import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {NodeServerChangeType} from '@enonic/lib-admin-ui/event/NodeServerChange';
import {ContentServerChangeItem} from './ContentServerChangeItem';

export class BatchContentServerEvent
    extends Event {

    private readonly items: ContentServerChangeItem[];

    private readonly type: NodeServerChangeType;

    constructor(items: ContentServerChangeItem[], type: NodeServerChangeType) {
        super();
        this.items = items || [];
        this.type = type;
    }

    getItems(): ContentServerChangeItem[] {
        return this.items;
    }

    getType(): NodeServerChangeType {
        return this.type;
    }

    toString(): string {
        return 'BatchContentServerChangeItem: [' +
               this.items.map((event) => JSON.stringify(event)).join(', ') +
               ']';
    }

    static on(handler: (event: BatchContentServerEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: BatchContentServerEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
