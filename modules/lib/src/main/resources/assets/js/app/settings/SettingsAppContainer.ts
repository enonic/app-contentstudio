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
        appBar.unsetHomeIconAction();
    }

    show() {
        super.show();

        const appBar: ContentAppBar = ContentAppBar.getInstance();

        appBar.showTabs();
        if (appBar.getTabMenu().countVisible() > 0) {
            appBar.setHomeIconAction();
        }
    }

}
