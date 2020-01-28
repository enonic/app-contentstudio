import {MainAppContainer} from '../MainAppContainer';
import {SettingsAppBar} from './SettingsAppBar';
import {SettingsAppPanel} from './SettingsAppPanel';
import {Application} from 'lib-admin-ui/app/Application';
import {SettingsServerEventsListener} from './event/SettingsServerEventsListener';

export class SettingsAppContainer
    extends MainAppContainer {

    constructor(application: Application) {
        super(application);

        new SettingsServerEventsListener([application]).start();
    }

    protected createAppBar(application: Application): SettingsAppBar {
        return new SettingsAppBar(application);
    }

    protected createAppPanel(): SettingsAppPanel {
        return new SettingsAppPanel(<SettingsAppBar>this.appBar);
    }

}
