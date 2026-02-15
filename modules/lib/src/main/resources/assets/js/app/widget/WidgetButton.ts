import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {AppContext} from '../AppContext';
import {type Widget} from '@enonic/lib-admin-ui/content/Widget';

export class WidgetButton
    extends Button {

    private readonly widget: Widget;

    static SELECTED_CLASS: string = 'selected';

    constructor(widget: Widget) {
        super();

        this.widget = widget;
        this.toggleClass(WidgetButton.SELECTED_CLASS, this.getWidgetId() === AppContext.get().getCurrentAppOrWidgetId());
    }

    getWidgetId(): string {
        return this.widget.getWidgetDescriptorKey().toString();
    }

    getWidgetDisplayName(): string {
        return this.widget.getDisplayName();
    }

    toggleSelected(condition: boolean) {
        this.toggleClass(WidgetButton.SELECTED_CLASS, condition);
    }
}
