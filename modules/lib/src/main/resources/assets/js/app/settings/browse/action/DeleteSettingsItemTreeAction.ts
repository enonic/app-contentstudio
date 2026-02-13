import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {getCurrentItems} from '../../../../v6/features/store/settingsTreeSelection.store';
import {openDeleteSettingsDialog} from '../../../../v6/features/store/dialogs/deleteSettingsDialog.store';

export class DeleteSettingsItemTreeAction
    extends Action {

    constructor() {
        super(i18n('action.delete'), 'mod+del');
        this.setEnabled(false);
        this.onExecuted(this.handleExecuted.bind(this));
    }

    private handleExecuted() {
        const selectedItems: SettingsViewItem[] = [...getCurrentItems()];
        const selectedItem = selectedItems[0];

        if (!selectedItem || !ObjectHelper.iFrameSafeInstanceOf(selectedItem, ProjectViewItem)) {
            return;
        }

        const projectItem = selectedItem as ProjectViewItem;
        openDeleteSettingsDialog(projectItem.getId(), projectItem.getName());
    }
}
