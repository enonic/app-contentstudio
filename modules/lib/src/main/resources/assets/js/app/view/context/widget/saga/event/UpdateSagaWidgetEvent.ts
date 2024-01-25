import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {SagaWidgetItemViewData} from '../SagaWidgetItemView';

export class UpdateSagaWidgetEvent
    extends Event {

    private readonly data: SagaWidgetItemViewData;

    constructor(data: SagaWidgetItemViewData) {
        super();
        this.data = data;
    }

    getData(): SagaWidgetItemViewData {
        return this.data;
    }

    static on(handler: (event: UpdateSagaWidgetEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: UpdateSagaWidgetEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
