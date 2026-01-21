import {type Extension} from '@enonic/lib-admin-ui/extension/Extension';

export class AppContext {

    private static INSTANCE: AppContext;

    private extension: Extension;

    private constructor() {
        //
    }

    static get(): AppContext {
        if (!AppContext.INSTANCE) {
            AppContext.INSTANCE = new AppContext();
        }

        return AppContext.INSTANCE;
    }

    setExtension(extension: Extension): void {
        this.extension = extension;
    }

    getCurrentAppOrWidgetId(): string {
        return this.extension?.getDescriptorKey()?.toString();
    }

}
