import {Widget} from 'lib-admin-ui/content/Widget';
import {DescriptorKey} from './page/DescriptorKey';

export class AppContext {

    private static INSTANCE: AppContext;

    private appId: DescriptorKey;

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

    setCurrentApp(value: DescriptorKey): void {
        this.appId = value;
        this.widget = null;
    }

    setWidget(widget: Widget): void {
        this.widget = widget;
        this.appId = null;
    }

    getCurrentAppOrWidgetId(): string {
        return this.appId?.toString() || this.widget?.getWidgetDescriptorKey()?.toString();
    }

}
