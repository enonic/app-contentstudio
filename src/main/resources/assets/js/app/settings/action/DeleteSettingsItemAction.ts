import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';
import {SettingsItemsTreeGrid} from '../grid/SettingsItemsTreeGrid';

export class DeleteSettingsItemAction
    extends Action {

    constructor(grid: SettingsItemsTreeGrid) {
        super(i18n('action.delete'), 'mod+alt+n');
        this.setEnabled(false);
        this.onExecuted(() => {
            //
        });
    }
}
