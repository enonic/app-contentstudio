import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {AppContext} from '../AppContext';
import {type Extension} from '@enonic/lib-admin-ui/extension/Extension';

export class WidgetButton
    extends Button {

    private readonly widget: Extension;

    static SELECTED_CLASS: string = 'selected';

    constructor(widget: Extension) {
        super();

        this.widget = widget;
        this.toggleClass(WidgetButton.SELECTED_CLASS, this.getWidgetId() === AppContext.get().getCurrentAppOrWidgetId());
    }

    getWidgetId(): string {
        return this.widget.getDescriptorKey().toString();
    }

    getWidgetDisplayName(): string {
        return this.widget.getDisplayName();
    }

    toggleSelected(condition: boolean) {
        this.toggleClass(WidgetButton.SELECTED_CLASS, condition);
    }
}
