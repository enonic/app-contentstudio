import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {SagaWidgetItemViewData} from './SagaWidgetItemView';

export class UpdateSagaWidgetItemView
    extends Event {

    private readonly data: SagaWidgetItemViewData;

    constructor(data: SagaWidgetItemViewData) {
        super();
        this.data = data;
    }

    getData(): SagaWidgetItemViewData {
        return this.data;
    }

    static on(handler: (event: UpdateSagaWidgetItemView) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: UpdateSagaWidgetItemView) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
