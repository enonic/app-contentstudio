import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectAccessControlComboBox} from '../../../../wizard/panel/form/element/ProjectAccessControlComboBox';
import {ProjectDialogStep} from './ProjectDialogStep';
import {ProjectAccessControlEntry} from '../../../../access/ProjectAccessControlEntry';
import {ProjectAccess} from '../../../../access/ProjectAccess';
import {ProjectPermissionsDataBuilder, ProjectPermissionsDialogStepData} from '../data/ProjectPermissionsDialogStepData';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ProjectRolesFormItem} from '../../../../wizard/panel/form/element/ProjectRolesFormItem';
import {Project} from '../../../../data/project/Project';

export class ProjectPermissionsDialogStep
    extends ProjectDialogStep {

    protected createFormItems(): FormItem[] {
        return [new ProjectRolesFormItem()];
    }

    protected getFormClass(): string {
        return 'project-permissions-step';
    }

    isOptional(): boolean {
        return true;
    }

    setParentProject(value: Project) {
        this.getFormItem().setParentProject(value);
    }

    protected initEventListeners(): void {
        super.initEventListeners();

        this.getAccessComboBox().onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    getData(): ProjectPermissionsDialogStepData {
        const selectedAccessEntries: ProjectAccessControlEntry[] = this.getAccessComboBox().getSelectedDisplayValues();
        const items: Map<ProjectAccess, Principal[]> = new Map<ProjectAccess, Principal[]>;

        selectedAccessEntries.forEach((entry: ProjectAccessControlEntry) => {
            items.has(entry.getAccess()) ? items.get(entry.getAccess()).push(entry.getPrincipal()) : items.set(entry.getAccess(),
                [entry.getPrincipal()]);
        });

        return new ProjectPermissionsDataBuilder()
            .setOwners(items.get(ProjectAccess.OWNER))
            .setEditors(items.get(ProjectAccess.EDITOR))
            .setContributors(items.get(ProjectAccess.CONTRIBUTOR))
            .setAuthors(items.get(ProjectAccess.AUTHOR))
            .build();
    }

    hasData(): boolean {
        return !!this.getAccessComboBox().getValue();
    }

    getName(): string {
        return 'projectPermissions';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.permissions.description');
    }

    private getAccessComboBox(): ProjectAccessControlComboBox {
        return this.getFormItem().getAccessComboBox();
    }

    private getFormItem(): ProjectRolesFormItem {
        return <ProjectRolesFormItem>this.formItems[0];
    }
}
