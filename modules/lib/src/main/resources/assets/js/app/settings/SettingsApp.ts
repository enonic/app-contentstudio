import {App} from '../App';
import {AppContainer} from '../AppContainer';
import {SettingsAppContainer} from './SettingsAppContainer';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DescriptorKey} from '../page/DescriptorKey';
import {CONFIG} from 'lib-admin-ui/util/Config';

export class SettingsApp extends App {

    constructor() {
        super(DescriptorKey.fromString(`${CONFIG.get('appId')}:settings`));
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

    getUrlPath(): string {
        return 'settings';
    }
}
