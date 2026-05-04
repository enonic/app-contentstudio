import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type Project} from '../../data/project/Project';
import {type SettingsViewItem} from '../../view/SettingsViewItem';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {ProjectConfigContext} from '../../data/project/ProjectConfigContext';
import {getCurrentItems} from '../../../../v6/features/store/settingsTreeSelection.store';
import {openCreateProjectDialog} from '../../../../v6/features/store/dialogs/projectDialog.store';

export class NewSettingsItemTreeAction extends Action {
    constructor() {
        super(i18n('action.new'), 'alt+n');

        this.onExecuted(() => {
            if (!AuthHelper.isContentAdmin()) {
                return;
            }

            openCreateProjectDialog(this.getSelectedProjects());
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
