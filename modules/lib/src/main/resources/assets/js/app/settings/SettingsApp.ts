import {App} from '../App';
import {AppContainer} from '../AppContainer';
import {SettingsAppContainer} from './SettingsAppContainer';
import {i18n} from 'lib-admin-ui/util/Messages';

export class SettingsApp extends App {

    constructor() {
        super('settings');
    }

    protected createAppContainer(): AppContainer {
        return new SettingsAppContainer();
    }

    getIconClass(): string {
        return 'icon-cog';
    }

    getDisplayName(): string {
        return i18n('app.settings');
    }
}
