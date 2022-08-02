import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SettingsItemsTreeGrid} from '../../grid/SettingsItemsTreeGrid';
import {Project} from '../../data/project/Project';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {ProjectWizardDialog} from '../../dialog/project/create/ProjectWizardDialog';
import {ProjectContext} from '../../../project/ProjectContext';
import {ProjectParentDialogStep} from '../../dialog/project/create/step/ProjectParentDialogStep';
import {ProjectLocaleDialogStep} from '../../dialog/project/create/step/ProjectLocaleDialogStep';
import {ProjectAccessDialogStep} from '../../dialog/project/create/step/ProjectAccessDialogStep';
import {ProjectPermissionsDialogStep} from '../../dialog/project/create/step/ProjectPermissionsDialogStep';
import {ProjectIdDialogStep} from '../../dialog/project/create/step/ProjectIdDialogStep';
import {ProjectSummaryStep} from '../../dialog/project/create/step/ProjectSummaryStep';
import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {ProjectSteps} from '../../dialog/project/create/ProjectSteps';

export class NewSettingsItemAction
    extends Action {

    private grid: SettingsItemsTreeGrid;

    constructor(grid: SettingsItemsTreeGrid) {
        super(i18n('action.newMore'), 'alt+n');

        this.grid = grid;

        this.onExecuted(() => {
            new ProjectWizardDialog(ProjectSteps.create(), this.getSelectedProject()).open();
        });
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
