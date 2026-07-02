import { SettingsAppShellElement } from '../../v6/pages/settings/SettingsAppShell';
import { AppContainer } from '../AppContainer';
import { SettingsAppPanel } from './SettingsAppPanel';

export class SettingsAppContainer extends AppContainer {
    constructor() {
        super();
        this.prependChild(new SettingsAppShellElement());
    }

    protected createAppPanel(): SettingsAppPanel {
        return new SettingsAppPanel();
    }

    hide() {
        super.hide();
    }

    show() {
        super.show();
    }
}
