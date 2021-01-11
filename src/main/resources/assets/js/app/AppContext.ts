import {AppMode} from './AppMode';
import {Application} from 'lib-admin-ui/app/Application';

export class AppContext {

    private static INSTANCE: AppContext;

    private appMode: AppMode = AppMode.MAIN;

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

    setMode(value: AppMode) {
        this.appMode = value;
    }

    setApplication(application: Application) {
        this.application = application;
    }

    getMode(): AppMode {
        return this.appMode;
    }

    getApplication(): Application {
        return this.application;
    }

    isMainMode(): boolean {
        return this.appMode === AppMode.MAIN;
    }

    isSettingsMode(): boolean {
        return this.appMode === AppMode.SETTINGS;
    }
}
