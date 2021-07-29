import {Application} from 'lib-admin-ui/app/Application';
import {DescriptorKey} from './page/DescriptorKey';

export class AppContext {

    private static INSTANCE: AppContext;

    private appId: DescriptorKey;

    private application: Application;

    private constructor() {
        //
    }

    static get(): AppContext {
        if (!AppContext.INSTANCE) {
            AppContext.INSTANCE = new AppContext();
        }

        return AppContext.INSTANCE;
    }

    setCurrentApp(value: DescriptorKey) {
        this.appId = value;
    }

    setApplication(application: Application) {
        this.application = application;
    }

    getCurrentApp(): DescriptorKey {
        return this.appId;
    }

    getApplication(): Application {
        return this.application;
    }

}
