import {Application} from 'lib-admin-ui/app/Application';
import {AppId} from './AppId';

export class AppContext {

    private static INSTANCE: AppContext;

    private appId: AppId;

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

    setCurrentApp(value: AppId) {
        this.appId = value;
    }

    setApplication(application: Application) {
        this.application = application;
    }

    getCurrentApp(): AppId {
        return this.appId;
    }

    getApplication(): Application {
        return this.application;
    }

}
