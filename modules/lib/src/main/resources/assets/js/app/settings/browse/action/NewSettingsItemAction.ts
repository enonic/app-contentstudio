import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SettingsItemsTreeGrid} from '../../grid/SettingsItemsTreeGrid';
import {Project} from '../../data/project/Project';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {ProjectWizardDialog} from '../../dialog/project/create/ProjectWizardDialog';
import {ProjectSteps} from '../../dialog/project/create/ProjectSteps';
import {ProjectConfigContext} from '../../data/project/ProjectConfigContext';

export class NewSettingsItemAction
    extends Action {

    private grid: SettingsItemsTreeGrid;

    constructor(grid: SettingsItemsTreeGrid) {
        super(i18n('action.newMore'), 'alt+n');

        this.grid = grid;

        this.onExecuted(() => {
            new ProjectWizardDialog({
                steps: ProjectSteps.create(),
                title: i18n('dialog.project.wizard.title'),
                parentProjects: this.getSelectedProjects()
            }).open();
        });
    }

    private getSelectedProjects(): Project[] {
        const isMultiInheritance: boolean = ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance();
        const selectedItems: SettingsViewItem[] = this.grid.getSelectedDataList();
        const selectedProjects = selectedItems
            .filter((item: SettingsViewItem) => ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem))
            .map((item: ProjectViewItem) => item.getData());

        if (!selectedProjects.length) {
            return null;
        }

        if (isMultiInheritance) {
            return selectedProjects;
        }

        return selectedProjects.slice(-1);
    }
}
