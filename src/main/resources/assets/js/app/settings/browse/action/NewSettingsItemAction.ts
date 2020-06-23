import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';
import {SettingsItemsTreeGrid} from '../../grid/SettingsItemsTreeGrid';
import {NewSettingsItemDialog} from '../../dialog/NewSettingsItemDialog';
import {Project} from '../../data/project/Project';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ProjectViewItem} from '../../view/ProjectViewItem';

export class NewSettingsItemAction
    extends Action {

    private newSettingsItemDialog: NewSettingsItemDialog;

    private grid: SettingsItemsTreeGrid;

    constructor(grid: SettingsItemsTreeGrid) {
        super(i18n('action.newMore'), 'alt+n');

        this.newSettingsItemDialog = new NewSettingsItemDialog();
        this.grid = grid;

        this.onExecuted(() => {
            this.newSettingsItemDialog.setProjectsChain(this.getProjectsChain());
            this.newSettingsItemDialog.open();
        });
    }

    private getProjectsChain(): Project[] {
        const selectedItems: SettingsViewItem[] = this.grid.getSelectedDataList();

        if (selectedItems.length === 1) {
            const selectedItem: SettingsViewItem = selectedItems[0];
            if (ObjectHelper.iFrameSafeInstanceOf(selectedItem, ProjectViewItem)) {
               return this.buildProjectsChain((<ProjectViewItem>selectedItem).getData());
            }
        }

        return [];
    }

    private buildProjectsChain(selectedProject: Project): Project[] {
        const parentProjects: Project[] = [];

        parentProjects.push(selectedProject);

        let parentProjectName: string = selectedProject.getParent();

        while (parentProjectName) {
            const parentItem: SettingsViewItem = this.grid.getItemById(parentProjectName);

            if (parentItem && ObjectHelper.iFrameSafeInstanceOf(parentItem, ProjectViewItem)) {
                const parentProject: Project = (<ProjectViewItem>parentItem).getData();
                parentProjects.unshift(parentProject);
                parentProjectName = parentProject.getParent();
            }
        }

        return parentProjects;
    }
}
