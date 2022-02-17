import {AppContainer} from '../AppContainer';
import {SettingsAppBar} from './SettingsAppBar';
import {SettingsAppPanel} from './SettingsAppPanel';
import {Application} from 'lib-admin-ui/app/Application';
import {Router} from '../Router';

export class SettingsAppContainer
    extends AppContainer {

    constructor() {
        super();

        this.onShown(() => {
            Router.get().setGlobalHash('settings');
        });
    }

    protected createAppBar(application: Application): SettingsAppBar {
        return new SettingsAppBar(application);
    }

    protected createAppPanel(): SettingsAppPanel {
        return new SettingsAppPanel(<SettingsAppBar>this.appBar);
    }

}
