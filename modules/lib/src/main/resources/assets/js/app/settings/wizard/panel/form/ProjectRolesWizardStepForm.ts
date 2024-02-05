import {ProjectViewItem} from '../../../view/ProjectViewItem';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectAccessControlComboBox} from './element/ProjectAccessControlComboBox';
import * as Q from 'q';
import {ProjectWizardStepForm} from './ProjectWizardStepForm';
import {ProjectRolesFormItem} from './element/ProjectRolesFormItem';
import {Project} from '../../../data/project/Project';
import {ProjectPermissions} from '../../../data/project/ProjectPermissions';

export class ProjectRolesWizardStepForm
    extends ProjectWizardStepForm {

    private rolesFormItem: ProjectRolesFormItem;

    protected createFormItems(): FormItem[] {
        this.rolesFormItem = new ProjectRolesFormItem();
        return [this.rolesFormItem];
    }

    setParentProjects(projects: Project[]): void {
        super.setParentProjects(projects);
        this.rolesFormItem.setParentProjects(projects);
    }

    getName(): string {
        return i18n('settings.items.wizard.step.roles');
    }

    protected initListeners() {
        this.getAccessComboBox().onSelectionChanged(() => {
            this.notifyDataChanged();
        });

        this.getAccessComboBox().onOptionValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q(null);
        }

        return this.rolesFormItem.layoutAccessCombobox(item.getPermissions());
    }

    getPermissions(): ProjectPermissions {
        return this.rolesFormItem?.getPermissions();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.rolesFormItem.addClass('project-access-control-form-item');

            return rendered;
        });
    }

    private getAccessComboBox(): ProjectAccessControlComboBox {
        return this.rolesFormItem.getAccessComboBox();
    }
}
