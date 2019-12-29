import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';
import {SettingsItemsTreeGrid} from '../../grid/SettingsItemsTreeGrid';
import {NewSettingsItemDialog} from '../../dialog/NewSettingsItemDialog';

export class NewSettingsItemAction
    extends Action {

    private newSettingsItemDialog: NewSettingsItemDialog;

    constructor(grid: SettingsItemsTreeGrid) {
        super(i18n('action.new'), 'mod+alt+n');
        this.newSettingsItemDialog = new NewSettingsItemDialog();
        this.onExecuted(() => {
            this.newSettingsItemDialog.open();
        });
    }
}
