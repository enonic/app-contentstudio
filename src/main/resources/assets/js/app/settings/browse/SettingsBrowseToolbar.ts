import {Toolbar} from '../../../../../../../../.xp/dev/lib-admin-ui/ui/toolbar/Toolbar';
import {SettingsTreeGridActions} from '../grid/SettingsTreeGridActions';

export class SettingsBrowseToolbar
    extends Toolbar {

    constructor(actions: SettingsTreeGridActions) {
        super();
        this.addClass('settings-browse-toolbar');
        this.addActions(actions.getAllActions());
    }
}
