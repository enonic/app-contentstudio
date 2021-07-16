import {App} from '../App';
import {AppContainer} from '../AppContainer';
import {AppId} from '../AppId';
import {SettingsAppContainer} from './SettingsAppContainer';
import {i18n} from 'lib-admin-ui/util/Messages';
import {SettingAppId} from './SettingAppId';

export class SettingsApp extends App {

    constructor() {
        super();
    }

    protected createAppContainer(): AppContainer {
        return new SettingsAppContainer();
    }

    protected createAppId(): AppId {
        return new SettingAppId();
    }

    generateAppUrl(): string {
        return this.appId.getId();
    }

    getIconClass(): string {
        return 'icon-cog';
    }

    getIconName(): string {
        return i18n('app.settings');
    }
}
