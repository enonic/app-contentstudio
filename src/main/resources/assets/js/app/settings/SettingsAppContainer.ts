import {MainAppContainer} from '../MainAppContainer';
import {SettingsAppBar} from './SettingsAppBar';
import {SettingsAppPanel} from './SettingsAppPanel';
import {Application} from 'lib-admin-ui/app/Application';
import {AppMode} from '../AppMode';

export class SettingsAppContainer
    extends MainAppContainer {

    protected createAppBar(application: Application): SettingsAppBar {
        return new SettingsAppBar(application);
    }

    protected createAppPanel(): SettingsAppPanel {
        return new SettingsAppPanel(<SettingsAppBar>this.appBar);
    }

    generateAppUrl(): string {
        return AppMode.SETTINGS;
    }

}
