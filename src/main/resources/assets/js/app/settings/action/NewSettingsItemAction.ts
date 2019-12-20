import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';
import {SettingsItemsTreeGrid} from '../grid/SettingsItemsTreeGrid';

export class NewSettingsItemAction
    extends Action {

    constructor(grid: SettingsItemsTreeGrid) {
        super(i18n('action.new'), 'mod+alt+n');
        this.setEnabled(false);
        this.onExecuted(() => {
            //
        });
    }
}
