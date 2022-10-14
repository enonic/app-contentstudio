import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SettingsItemsTreeGrid} from '../../grid/SettingsItemsTreeGrid';
import {Project} from '../../data/project/Project';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {ProjectWizardDialog} from '../../dialog/project/create/ProjectWizardDialog';
import {ProjectSteps} from '../../dialog/project/create/ProjectSteps';

export class NewSettingsItemAction
    extends Action {

    private grid: SettingsItemsTreeGrid;

    constructor(grid: SettingsItemsTreeGrid) {
        super(i18n('action.newMore'), 'alt+n');

        this.grid = grid;

        this.onExecuted(() => {
            new ProjectWizardDialog({
                steps: ProjectSteps.create(),
                title: i18n('dialog.project.wizard.title')
            }).open();
        });
    }
}
