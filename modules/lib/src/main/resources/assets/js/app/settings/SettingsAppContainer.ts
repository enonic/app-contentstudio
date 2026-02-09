import {SettingsAppShellElement} from '../../v6/features/views/settings/SettingsAppShell';
import {AppContainer} from '../AppContainer';
import {SettingsAppPanel} from './SettingsAppPanel';
import {reloadProjects} from '../../v6/features/store/projects.store';

export class SettingsAppContainer extends AppContainer {
    constructor() {
        super();
        this.prependChild(new SettingsAppShellElement());
    }

    protected initElements(): void {
        super.initElements();

        reloadProjects();
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
