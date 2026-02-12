import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectDeleteRequest} from '../../resource/ProjectDeleteRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {ConfirmValueDialog} from '../../../remove/ConfirmValueDialog';
import {TextInputSize} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {getCurrentItems} from '../../../../v6/features/store/settingsTreeSelection.store';

export class DeleteSettingsItemTreeAction
    extends Action {

    private deleteConfirmationDialog?: ConfirmValueDialog;

    constructor() {
        super(i18n('action.delete'), 'mod+del');
        this.setEnabled(false);
        this.onExecuted(this.handleExecuted.bind(this));
    }

    private handleExecuted() {
        if (!this.deleteConfirmationDialog) {
            this.initConfirmationDialog();
        }

        const selectedItems: SettingsViewItem[] = [...getCurrentItems()];

        this.deleteConfirmationDialog.setValueToCheck(selectedItems[0].getId()).open();
    }

    private initConfirmationDialog() {
        this.deleteConfirmationDialog = new ConfirmValueDialog({inputSize: TextInputSize.LARGE});
        this.deleteConfirmationDialog
            .setHeaderText(i18n('dialog.confirmDelete'))
            .setSubheaderText(i18n('dialog.project.delete.confirm.subheader'))
            .setYesCallback(this.deleteSelectedItems.bind(this));
    }

    private deleteSelectedItems() {
        const selectedItems: SettingsViewItem[] = [...getCurrentItems()];

        const projectItems: ProjectViewItem[] = selectedItems.filter((item: SettingsViewItem) => {
            return ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem);
        }) as ProjectViewItem[];

        this.deleteSelectedProjectItems(projectItems);
    }

    private deleteSelectedProjectItems(projectItems: ProjectViewItem[]) {
        projectItems.forEach((item: ProjectViewItem) => {
            new ProjectDeleteRequest(item.getName()).sendAndParse().then(() => {
                showFeedback(i18n('notify.settings.project.deleted', item.getName()));
            }).catch(DefaultErrorHandler.handle);
        });
    }
}
