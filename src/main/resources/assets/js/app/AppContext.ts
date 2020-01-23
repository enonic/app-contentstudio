import {AppMode} from './AppMode';

export class AppContext {

    private static INSTANCE: AppContext;

    private appMode: AppMode = AppMode.MAIN;

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

    isMainMode(): boolean {
        return this.appMode === AppMode.MAIN;
    }

    isSettingsMode(): boolean {
        return this.appMode === AppMode.SETTINGS;
    }
}
