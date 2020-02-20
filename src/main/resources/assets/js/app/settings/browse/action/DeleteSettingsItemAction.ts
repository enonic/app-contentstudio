import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';
import {SettingsItemsTreeGrid} from '../../grid/SettingsItemsTreeGrid';
import {ConfirmationDialog} from 'lib-admin-ui/ui/dialog/ConfirmationDialog';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ProjectDeleteRequest} from '../../resource/ProjectDeleteRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {showFeedback} from 'lib-admin-ui/notify/MessageBus';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {ProjectViewItem} from '../../view/ProjectViewItem';

export class DeleteSettingsItemAction
    extends Action {

    private grid: SettingsItemsTreeGrid;

    private deleteConfirmationDialog: ConfirmationDialog;

    constructor(grid: SettingsItemsTreeGrid) {
        super(i18n('action.delete'), 'mod+del');
        this.setEnabled(false);

        this.grid = grid;
        this.deleteConfirmationDialog = this.initConfirmationDialog();
        this.onExecuted(this.handleExecuted.bind(this));
    }

    private initConfirmationDialog(): ConfirmationDialog {
        return new ConfirmationDialog()
            .setQuestion(i18n('settings.dialog.delete.question'))
            .setNoCallback(null)
            .setYesCallback(this.deleteSelectedItems.bind(this));
    }

    private deleteSelectedItems() {
        const selectedItems: SettingsViewItem[] = this.grid.getSelectedDataList();

        const projectItems: ProjectViewItem[] = <ProjectViewItem[]>selectedItems.filter((item: SettingsViewItem) => {
            return ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem);
        });

        projectItems.forEach((item: ProjectViewItem) => {
            new ProjectDeleteRequest(item.getName()).sendAndParse().then(() => {
                showFeedback(i18n('notify.settings.project.deleted', item.getName()));
            }).catch(DefaultErrorHandler.handle);
        });
    }

    private handleExecuted() {
        const multiple: boolean = this.grid.getSelectedDataList().length > 1;
        const question: string = multiple ? i18n('settings.dialog.delete.multiple.question')
                                          : i18n('settings.dialog.delete.question');
        this.deleteConfirmationDialog.setQuestion(question).open();
    }
}
