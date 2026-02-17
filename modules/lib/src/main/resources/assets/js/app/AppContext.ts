import {type Widget} from '@enonic/lib-admin-ui/content/Widget';

export class AppContext {

    private static INSTANCE: AppContext;

    private widget: Widget;

    private constructor() {
        //
    }

    static get(): AppContext {
        if (!AppContext.INSTANCE) {
            AppContext.INSTANCE = new AppContext();
        }

        return AppContext.INSTANCE;
    }


    setWidget(widget: Widget): void {
        this.widget = widget;
    }

    getCurrentAppOrWidgetId(): string {
        return this.widget?.getWidgetDescriptorKey()?.toString();
    }

}
