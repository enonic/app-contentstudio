import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {type ProjectAccessControlComboBox} from '../../../../wizard/panel/form/element/ProjectAccessControlComboBox';
import {ProjectDialogStep} from './ProjectDialogStep';
import {type ProjectAccessControlEntry} from '../../../../access/ProjectAccessControlEntry';
import {ProjectAccess} from '../../../../access/ProjectAccess';
import {ProjectPermissionsDataBuilder, type ProjectPermissionsDialogStepData} from '../data/ProjectPermissionsDialogStepData';
import {type Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ProjectRolesFormItem} from '../../../../wizard/panel/form/element/ProjectRolesFormItem';

export class ProjectPermissionsDialogStep
    extends ProjectDialogStep {

    private projectRolesFormFormItem: ProjectRolesFormItem;

    createFormItems(): FormItem[] {
        this.projectRolesFormFormItem = new ProjectRolesFormItem();
        if (this.hasParentProjects()) {
            this.projectRolesFormFormItem.setParentProjects(this.getParentProjects());
        }
        return [this.projectRolesFormFormItem];
    }

    protected getFormClass(): string {
        return 'project-permissions-step';
    }

    isOptional(): boolean {
        return true;
    }

    protected initEventListeners(): void {
        super.initEventListeners();

        this.getAccessComboBox().onOptionValueChanged(() => {
            this.notifyDataChanged();
        });

        this.getAccessComboBox().onSelectionChanged(() => {
            this.notifyDataChanged();
        });
    }

    getData(): ProjectPermissionsDialogStepData {
        const selectedAccessEntries: ProjectAccessControlEntry[] = this.getAccessComboBox()?.getSelectedItems() || [];
        const items: Map<ProjectAccess, Principal[]> = new Map<ProjectAccess, Principal[]>;

        selectedAccessEntries.forEach((entry: ProjectAccessControlEntry) => {
            const projectAccess: ProjectAccess = entry.getAccess();
            if (items.has(projectAccess)) {
                items.get(projectAccess).push(entry.getPrincipal())
            } else {
                items.set(projectAccess, [entry.getPrincipal()]);
            };
        });

        return new ProjectPermissionsDataBuilder()
            .setOwners(items.get(ProjectAccess.OWNER))
            .setEditors(items.get(ProjectAccess.EDITOR))
            .setContributors(items.get(ProjectAccess.CONTRIBUTOR))
            .setAuthors(items.get(ProjectAccess.AUTHOR))
            .build();
    }

    hasData(): boolean {
        return this.getAccessComboBox()?.getSelectedItems()?.length > 0;
    }

    getName(): string {
        return 'projectPermissions';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.permissions.description');
    }

    private getAccessComboBox(): ProjectAccessControlComboBox {
        return this.projectRolesFormFormItem?.getAccessComboBox();
    }
}
