import {AppContainer} from '../AppContainer';
import {SettingsAppPanel} from './SettingsAppPanel';
import {ContentAppBar} from '../bar/ContentAppBar';

export class SettingsAppContainer
    extends AppContainer {

    constructor() {
        super();
    }

    protected createAppPanel(): SettingsAppPanel {
        return new SettingsAppPanel();
    }

    hide() {
        super.hide();

        const appBar: ContentAppBar = ContentAppBar.getInstance();
        appBar.hideTabs();
        appBar.disableHomeButton();
        appBar.showProjectSelector();
    }

    show() {
        super.show();

        const appBar: ContentAppBar = ContentAppBar.getInstance();

        appBar.showTabs();
        appBar.enableHomeButton();
        appBar.hideProjectSelector();
    }

}
