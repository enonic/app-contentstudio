import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {PropertyArrayJson} from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import {FormJson} from '@enonic/lib-admin-ui/form/json/FormJson';

export class EnonicAiDataSentEvent
    extends Event {

    private readonly data: PropertyArrayJson[];

    private readonly schema: FormJson;

    constructor(data: PropertyArrayJson[], schema: FormJson) {
        super();

        this.data = data;
        this.schema = schema;
    }

    getData(): PropertyArrayJson[] {
        return this.data;
    }

    getSchema(): FormJson {
        return this.schema;
    }

    static on(handler: (event: EnonicAiDataSentEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiDataSentEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
