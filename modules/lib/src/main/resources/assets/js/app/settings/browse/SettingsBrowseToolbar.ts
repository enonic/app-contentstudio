import {Toolbar} from '@enonic/lib-admin-ui/ui/toolbar/Toolbar';
import {SettingsTreeActions} from '../tree/SettingsTreeActions';

export class SettingsBrowseToolbar
    extends Toolbar {

    constructor(actions: SettingsTreeActions) {
        super();
        this.addClass('settings-browse-toolbar');
        this.addActions(actions.getAllActions());
    }
}
