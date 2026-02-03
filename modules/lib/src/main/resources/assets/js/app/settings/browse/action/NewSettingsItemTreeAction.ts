import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Project} from '../../data/project/Project';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {ProjectConfigContext} from '../../data/project/ProjectConfigContext';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {openNewProjectDialog} from '../../../../v6/features/store/dialogs/newProjectDialog.store';

export class NewSettingsItemTreeAction extends Action {
    private tree: SelectableListBoxWrapper<SettingsViewItem>;

    constructor(tree: SelectableListBoxWrapper<SettingsViewItem>) {
        super(i18n('action.new'), 'alt+n');

        this.tree = tree;

        this.onExecuted(() => {
            openNewProjectDialog(this.getSelectedProjects());
        });
    }

    private getSelectedProjects(): Project[] {
        const isMultiInheritance: boolean = ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance();
        const selectedItems: SettingsViewItem[] = this.tree.getSelectedItems();
        const selectedProjects = selectedItems
            .filter((item: SettingsViewItem) => ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem))
            .map((item: ProjectViewItem) => item.getData());

        if (!selectedProjects.length) {
            return [];
        }

        if (isMultiInheritance) {
            return selectedProjects;
        }

        return selectedProjects.slice(-1);
    }
}
