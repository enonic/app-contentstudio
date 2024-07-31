import {Toolbar} from '@enonic/lib-admin-ui/ui/toolbar/Toolbar';
import {SettingsTreeGridActions} from '../grid/SettingsTreeGridActions';
import {SettingsTreeActions} from '../tree/SettingsTreeActions';

export class SettingsBrowseToolbar
    extends Toolbar {

    constructor(actions: SettingsTreeActions) {
        super();
        this.addClass('settings-browse-toolbar');
        this.addActions(actions.getAllActions());
    }
}
