import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SettingsItemsTreeGrid} from '../../grid/SettingsItemsTreeGrid';
import {NewSettingsItemDialog} from '../../dialog/NewSettingsItemDialog';
import {Project} from '../../data/project/Project';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {ProjectWizardDialog} from '../../dialog/ProjectWizardDialog';
import {DialogStep} from '../../dialog/DialogStep';
import {ProjectContext} from '../../../project/ProjectContext';
import {ProjectParentDialogStep} from '../../dialog/ProjectParentDialogStep';
import {ProjectLocaleDialogStep} from '../../dialog/ProjectLocaleDialogStep';
import {ProjectAccessDialogStep} from '../../dialog/ProjectAccessDialogStep';
import {ProjectPermissionsDialogStep} from '../../dialog/ProjectPermissionsDialogStep';
import {ProjectIdDialogStep} from '../../dialog/ProjectIdDialogStep';
import {ProjectSummaryStep} from '../../dialog/ProjectSummaryStep';

export class NewSettingsItemAction2
    extends Action {

    private newSettingsItemDialog: NewSettingsItemDialog;

    private grid: SettingsItemsTreeGrid;

    constructor(grid: SettingsItemsTreeGrid) {
        super(i18n('action.newMore'), 'alt+n');

        this.newSettingsItemDialog = new NewSettingsItemDialog();
        this.grid = grid;

        this.onExecuted(() => {
            new ProjectWizardDialog(this.createSteps(), this.getSelectedProject()).open();
        });
    }

    private createSteps(): DialogStep[] {
        const result: DialogStep[] = [];

        if (ProjectContext.get().isInitialized()) {
            result.push(new ProjectParentDialogStep());
        }

        result.push(new ProjectLocaleDialogStep(), new ProjectAccessDialogStep(), new ProjectPermissionsDialogStep(),
            new ProjectIdDialogStep(), new ProjectSummaryStep());

        return result;
    }

    private getSelectedProject(): Project {
        const selectedItems: SettingsViewItem[] = this.grid.getSelectedDataList();

        if (selectedItems.length === 1) {
            const selectedItem: SettingsViewItem = selectedItems[0];

            if (ObjectHelper.iFrameSafeInstanceOf(selectedItem, ProjectViewItem)) {
               return (<ProjectViewItem>selectedItem).getData();
            }
        }

        return null;
    }
}
