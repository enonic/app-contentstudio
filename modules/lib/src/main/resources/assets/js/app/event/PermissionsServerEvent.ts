import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {type EventJson} from '@enonic/lib-admin-ui/event/EventJson';
import {ContentServerChangeItem} from './ContentServerChangeItem';

export type PermissionsEventJson = EventJson & {
    data: {
        id: string;
        path: string;
        branch: string;
        repo: string;
    };
};

export class PermissionsServerEvent
    extends Event {

    private readonly changeItem: ContentServerChangeItem;

    constructor(changeItem: ContentServerChangeItem) {
        super();
        this.changeItem = changeItem;
    }

    static is(eventJson: EventJson): boolean {
        return eventJson.type === 'node.permissionsUpdated';
    }

    static fromJson(json: PermissionsEventJson): PermissionsServerEvent {
        const changeItem = ContentServerChangeItem.fromJson({...json.data, newPath: ''});
        return new PermissionsServerEvent(changeItem);
    }

    getChangeItem(): ContentServerChangeItem {
        return this.changeItem;
    }

    static on(handler: (event: PermissionsServerEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: PermissionsServerEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

    toString(): string {
        return 'PermissionsServerEvent: [' + this.changeItem.toString() + ']';
    }
}
