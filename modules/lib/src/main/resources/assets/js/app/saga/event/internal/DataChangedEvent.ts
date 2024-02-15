import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {PropertyArrayJson} from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import {FormJson} from '@enonic/lib-admin-ui/form/json/FormJson';

export class DataChangedEvent
    extends Event {

    private readonly data: PropertyArrayJson[];

    constructor(data: PropertyArrayJson[]) {
        super();

        this.data = data;
    }

    getData(): PropertyArrayJson[] {
        return this.data;
    }

    static on(handler: (event: DataChangedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: DataChangedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
