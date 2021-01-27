import {AppMode} from './AppMode';
import {MainAppContainer} from './MainAppContainer';
import {ContentAppContainer} from './ContentAppContainer';
import {SettingsAppContainer} from './settings/SettingsAppContainer';

export class AppContainerFactory {

    private static INSTANCE: AppContainerFactory;

    private constructor() {
    //
    }

    static get(): AppContainerFactory {
        if (!AppContainerFactory.INSTANCE) {
            AppContainerFactory.INSTANCE = new AppContainerFactory();
        }

        return AppContainerFactory.INSTANCE;
    }

    createApp(appMode: AppMode): MainAppContainer {
        if (appMode === AppMode.MAIN) {
            return new ContentAppContainer();
        }

        if (appMode === AppMode.SETTINGS) {
            return new SettingsAppContainer();
        }

        throw new Error(`Unsupported type of app: ${appMode}`);
    }
}
