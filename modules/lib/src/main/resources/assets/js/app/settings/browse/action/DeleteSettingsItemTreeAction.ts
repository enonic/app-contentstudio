import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type SettingsViewItem} from '../../view/SettingsViewItem';
import {ProjectDeleteRequest} from '../../resource/ProjectDeleteRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {getCurrentItems} from '../../../../v6/features/store/settingsTreeSelection.store';
import {openDeleteSettingsDialog} from '../../../../v6/features/store/dialogs/deleteSettingsDialog.store';
import {ConfirmValueDialog} from '../../../remove/ConfirmValueDialog';
import {TextInputSize} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {type SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';

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

        if (!selectedItem || !ObjectHelper.iFrameSafeInstanceOf(selectedItem, ProjectViewItem)) return;

        const projectItem = selectedItem as ProjectViewItem;
        openDeleteSettingsDialog(projectItem.getId(), projectItem.getName());
    }
}
