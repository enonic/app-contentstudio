import {NavigatedAppPanel} from 'lib-admin-ui/app/NavigatedAppPanel';
import {SettingsBrowsePanel} from './browse/SettingsBrowsePanel';
import {SettingsAppBar} from './SettingsAppBar';
import {ShowBrowsePanelEvent} from 'lib-admin-ui/app/ShowBrowsePanelEvent';
import {SettingsItem} from './data/SettingsItem';

export class SettingsAppPanel
    extends NavigatedAppPanel<SettingsItem> {

    constructor(appBar: SettingsAppBar) {
        super(appBar);

        this.route();
    }

    private route() {
        new ShowBrowsePanelEvent().fire();
    }

    protected createBrowsePanel(): SettingsBrowsePanel {
        return new SettingsBrowsePanel();
    }
}
