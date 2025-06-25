import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type Project} from '../../data/project/Project';
import {type SettingsViewItem} from '../../view/SettingsViewItem';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {ProjectConfigContext} from '../../data/project/ProjectConfigContext';
import {getCurrentItems} from '../../../../v6/features/store/settingsTreeSelection.store';
import {openNewProjectDialog} from '../../../../v6/features/store/dialogs/newProjectDialog.store';
import {type SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';

export class NewSettingsItemTreeAction extends Action {
    constructor() {
        super(i18n('action.new'), 'alt+n');

        this.onExecuted(() => {
            openNewProjectDialog(this.getSelectedProjects());
        });
    }

    private getSelectedProjects(): Project[] {
        const isMultiInheritance: boolean = ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance();
        const selectedItems: SettingsViewItem[] = [...getCurrentItems()];
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
