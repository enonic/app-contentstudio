import {SettingsAppShellElement} from '../../v6/features/views/settings/SettingsAppShell';
import {AppContainer} from '../AppContainer';
import {SettingsAppPanel} from './SettingsAppPanel';
import {Projects} from './resource/Projects';

export class SettingsAppContainer extends AppContainer {
    constructor() {
        super();
        this.prependChild(new SettingsAppShellElement());
    }

    protected initElements(): void {
        super.initElements();

        Projects.get().reloadProjects();
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
