import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {EditSettingsItemEvent} from '../../event/EditSettingsItemEvent';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {getCurrentItems} from '../../../../v6/features/store/settingsTreeSelection.store';

export class EditSettingsItemTreeAction
    extends Action {

    constructor() {
        super(i18n('action.edit'), 'mod+e');
        this.onExecuted(() => {
            const items: SettingsViewItem[] = [...getCurrentItems()];
            new EditSettingsItemEvent(items).fire();
        });
    }
}
