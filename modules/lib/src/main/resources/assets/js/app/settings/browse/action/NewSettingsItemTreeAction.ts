import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type Project} from '../../data/project/Project';
import {type SettingsViewItem} from '../../view/SettingsViewItem';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {ProjectWizardDialog} from '../../dialog/project/create/ProjectWizardDialog';
import {ProjectSteps} from '../../dialog/project/create/ProjectSteps';
import {ProjectConfigContext} from '../../data/project/ProjectConfigContext';
import {type SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';

export class NewSettingsItemTreeAction
    extends Action {

    private tree: SelectableListBoxWrapper<SettingsViewItem>;

    constructor(tree: SelectableListBoxWrapper<SettingsViewItem>) {
        super(i18n('action.newMore'), 'alt+n');

        this.tree = tree;

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
        const selectedItems: SettingsViewItem[] = this.tree.getSelectedItems();
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
