import {AppContainer} from '../AppContainer';
import {SettingsAppPanel} from './SettingsAppPanel';
import {Projects} from './resource/Projects';

export class SettingsAppContainer extends AppContainer {
    constructor() {
        super();
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
