import {Toolbar, ToolbarConfig} from '@enonic/lib-admin-ui/ui/toolbar/Toolbar';
import {SettingsTreeActions} from '../tree/SettingsTreeActions';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class SettingsBrowseToolbar
    extends Toolbar<ToolbarConfig> {

    constructor(actions: SettingsTreeActions) {
        super();
        this.addClass('settings-browse-toolbar');
        this.addActions(actions.getAllActions());
    }

    protected getAriaLabel(): string {
        return i18n('wcag.toolbar.settings.label');
    }
}
