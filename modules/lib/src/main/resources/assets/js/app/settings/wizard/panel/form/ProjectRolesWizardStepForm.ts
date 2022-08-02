import {ProjectViewItem} from '../../../view/ProjectViewItem';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectAccessControlComboBox, ProjectAccessControlComboBoxBuilder} from './element/ProjectAccessControlComboBox';
import * as Q from 'q';
import {ProjectItemPermissionsBuilder, ProjectPermissions} from '../../../data/project/ProjectPermissions';
import {ProjectAccessControlEntry} from '../../../access/ProjectAccessControlEntry';
import {ProjectAccess} from '../../../access/ProjectAccess';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {PrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {GetPrincipalsByKeysRequest} from '../../../../security/GetPrincipalsByKeysRequest';
import {ProjectFormItemBuilder} from './element/ProjectFormItem';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectWizardStepForm} from './ProjectWizardStepForm';
import {Project} from '../../../data/project/Project';
import {RolesFormItem} from './element/RolesFormItem';

export class ProjectRolesWizardStepForm extends ProjectWizardStepForm {

    private rolesFormItem: RolesFormItem;

    private copyParentRolesButton?: Button;

    protected createFormItems(): FormItem[] {
        this.rolesFormItem = new RolesFormItem();
        return [this.rolesFormItem];
    }

    setParentProject(project: Project) {
        super.setParentProject(project);

        if (project) {
            if (!this.copyParentRolesButton) {
                this.copyParentRolesButton = this.createCopyParentRolesButton();
            }
            this.rolesFormItem.appendChild(this.copyParentRolesButton);
            this.updateCopyParentRolesButtonState();
        } else if (this.copyParentRolesButton) {
            this.rolesFormItem.removeChild(this.copyParentRolesButton);
        }
    }

    private createCopyParentRolesButton(): Button {
        const button: Button = new Button(i18n('settings.wizard.project.copy')).setEnabled(false);
        button.addClass('copy-parent-button');

        button.onClicked(() => {
            this.layoutAccessCombobox(this.parentProject.getPermissions(), false).then(() => {
                NotifyManager.get().showSuccess(
                    i18n('settings.wizard.project.copy.success', i18n('settings.items.wizard.step.roles'),
                        this.parentProject.getDisplayName()));
            });
        });

        return button;
    }

    private updateCopyParentRolesButtonState() {
        if (!this.copyParentRolesButton) {
            return;
        }

        this.copyParentRolesButton.setEnabled(
            this.parentProject && !ObjectHelper.equals(this.parentProject.getPermissions(), this.getPermissions()));
    }

    getName(): string {
        return i18n('settings.items.wizard.step.roles');
    }

    protected initListeners() {
        this.getAccessComboBox().onValueChanged(() => {
            this.notifyDataChanged();
            this.updateCopyParentRolesButtonState();
        });

        this.getAccessComboBox().onOptionValueChanged(() => {
            this.notifyDataChanged();
            this.updateCopyParentRolesButtonState();
        });
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q(null);
        }

        return this.layoutAccessCombobox(item.getPermissions());
    }

    private layoutAccessCombobox(permissions: ProjectPermissions, silent: boolean = true): Q.Promise<void> {
        return this.getPrincipalsFromPermissions(permissions).then((principals: Principal[]) => {
            this.getAccessComboBox().clearSelection(true, false, false, false);

            const itemsToSelect: ProjectAccessControlEntry[] = this.createItemsToSelect(permissions, principals);

            if (itemsToSelect.length > 0) {
                itemsToSelect.forEach((selectedItem: ProjectAccessControlEntry) => {
                    this.getAccessComboBox().select(selectedItem, false, silent);
                    this.getAccessComboBox().resetBaseValues();
                });
            } else {
                this.notifyDataChanged();
                this.updateCopyParentRolesButtonState();
            }


            return Q(null);
        }).catch(DefaultErrorHandler.handle);
    }

    private getPrincipalsFromPermissions(permissions: ProjectPermissions): Q.Promise<Principal[]> {
        const principalKeys: PrincipalKey[] = [
            ...permissions.getContributors(),
            ...permissions.getEditors(),
            ...permissions.getOwners(),
            ...permissions.getAuthors()
        ];
        return new GetPrincipalsByKeysRequest(principalKeys).sendAndParse();
    }

    private createItemsToSelect(permissions: ProjectPermissions, principals: Principal[]): ProjectAccessControlEntry[] {
        const itemsToSelect: ProjectAccessControlEntry[] = [];

        permissions.getOwners().forEach((key: PrincipalKey) => {
            const owners: Principal[] = principals.filter((value: Principal) => value.getKey().equals(key));
            if (owners.length > 0) {
                itemsToSelect.push(new ProjectAccessControlEntry(owners[0], ProjectAccess.OWNER));
            }
        });

        permissions.getEditors().forEach((key: PrincipalKey) => {
            const editors: Principal[] = principals.filter((value: Principal) => value.getKey().equals(key));
            if (editors.length > 0) {
                itemsToSelect.push(new ProjectAccessControlEntry(editors[0], ProjectAccess.EDITOR));
            }
        });

        permissions.getContributors().forEach((key: PrincipalKey) => {
            const contributors: Principal[] = principals.filter((value: Principal) => value.getKey().equals(key));
            if (contributors.length > 0) {
                itemsToSelect.push(new ProjectAccessControlEntry(contributors[0], ProjectAccess.CONTRIBUTOR));
            }
        });

        permissions.getAuthors().forEach((key: PrincipalKey) => {
            const authors: Principal[] = principals.filter((value: Principal) => value.getKey().equals(key));
            if (authors.length > 0) {
                itemsToSelect.push(new ProjectAccessControlEntry(authors[0], ProjectAccess.AUTHOR));
            }
        });

        return itemsToSelect;
    }

    getPermissions(): ProjectPermissions {
        const selectedAccessEntries: ProjectAccessControlEntry[] = this.getAccessComboBox().getSelectedDisplayValues();

        const owners: PrincipalKey[] = selectedAccessEntries
            .filter((entry: ProjectAccessControlEntry) => entry.getAccess() === ProjectAccess.OWNER)
            .map((ownerEntry: ProjectAccessControlEntry) => ownerEntry.getPrincipalKey());
        const editors: PrincipalKey[] = selectedAccessEntries
            .filter((entry: ProjectAccessControlEntry) => entry.getAccess() === ProjectAccess.EDITOR)
            .map((editorEntry: ProjectAccessControlEntry) => editorEntry.getPrincipalKey());
        const contributors: PrincipalKey[] = selectedAccessEntries
            .filter((entry: ProjectAccessControlEntry) => entry.getAccess() === ProjectAccess.CONTRIBUTOR)
            .map((contributorEntry: ProjectAccessControlEntry) => contributorEntry.getPrincipalKey());
        const authors: PrincipalKey[] = selectedAccessEntries
            .filter((entry: ProjectAccessControlEntry) => entry.getAccess() === ProjectAccess.AUTHOR)
            .map((contributorEntry: ProjectAccessControlEntry) => contributorEntry.getPrincipalKey());

        return new ProjectItemPermissionsBuilder()
            .setOwners(owners)
            .setEditors(editors)
            .setContributors(contributors)
            .setAuthors(authors)
            .build();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.rolesFormItem.addClass('project-access-control-form-item');

            return rendered;
        });
    }

    private getAccessComboBox(): ProjectAccessControlComboBox {
        return this.rolesFormItem.getAccessCombobox();
    }
}
