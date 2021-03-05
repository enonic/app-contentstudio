import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';
import {SettingsItemsTreeGrid} from '../../grid/SettingsItemsTreeGrid';
import {EditSettingsItemEvent} from '../../event/EditSettingsItemEvent';
import {SettingsViewItem} from '../../view/SettingsViewItem';

export class EditSettingsItemAction
    extends Action {

    constructor(grid: SettingsItemsTreeGrid) {
        super(i18n('action.edit'), 'mod+e');
        this.onExecuted(() => {
            const items: SettingsViewItem[] = grid.getSelectedDataList();
            new EditSettingsItemEvent(items).fire();
        });
    }
}
