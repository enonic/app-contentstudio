import {AppContainer} from '../AppContainer';
import {SettingsAppPanel} from './SettingsAppPanel';
import {ContentAppBar} from '../bar/ContentAppBar';
import {Projects} from './resource/Projects';

export class SettingsAppContainer
    extends AppContainer {

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

        const appBar: ContentAppBar = ContentAppBar.getInstance();
        appBar.hideTabs();
        appBar.disableHomeButton();
    }

    show() {
        super.show();

        const appBar: ContentAppBar = ContentAppBar.getInstance();

        appBar.showTabs();
        appBar.enableHomeButton();
    }

}
