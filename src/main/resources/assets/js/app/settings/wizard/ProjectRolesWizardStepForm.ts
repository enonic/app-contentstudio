import {SettingDataItemWizardStepForm} from "./SettingDataItemWizardStepForm";
import {ProjectViewItem} from "../view/ProjectViewItem";
import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ProjectAccessControlComboBox} from "./ProjectAccessControlComboBox";
import * as Q from "q";
import {ProjectItemPermissionsBuilder, ProjectPermissions} from "../data/project/ProjectPermissions";
import {ProjectAccessControlEntry} from "../access/ProjectAccessControlEntry";
import {ProjectAccess} from "../access/ProjectAccess";
import {Principal} from 'lib-admin-ui/security/Principal';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {PrincipalType} from 'lib-admin-ui/security/PrincipalType';
import {PrincipalLoader} from 'lib-admin-ui/security/PrincipalLoader';
import {GetPrincipalsByKeysRequest} from 'lib-admin-ui/security/GetPrincipalsByKeysRequest';

export class ProjectRolesWizardStepForm extends SettingDataItemWizardStepForm<ProjectViewItem> {

    private accessCombobox: ProjectAccessControlComboBox;

    private accessComboBoxFormItem: FormItem;

    protected getFormItems(item?: ProjectViewItem): FormItem[] {
        this.accessCombobox = new ProjectAccessControlComboBox();
        const loader: PrincipalLoader = <PrincipalLoader>this.accessCombobox.getLoader();
        loader.setAllowedTypes([PrincipalType.USER, PrincipalType.GROUP]);
        loader.skipPrincipal(PrincipalKey.ofAnonymous());

        this.accessComboBoxFormItem = new FormItemBuilder(this.accessCombobox)
            .setLabel(i18n('settings.field.project.access'))
            .build();

        return [this.accessComboBoxFormItem];
    }

    getName(): string {
        return i18n('settings.items.wizard.step.roles');
    }

    protected initListeners() {
        this.accessCombobox.onValueChanged(this.notifyDataChanged.bind(this));
        this.accessCombobox.onOptionValueChanged(this.notifyDataChanged.bind(this));
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        return this.getPrincipalsFromPermissions(item.getPermissions()).then((principals: Principal[]) => {
            this.accessCombobox.clearSelection(true);

            const itemsToSelect: ProjectAccessControlEntry[] = this.createItemsToSelect(item.getPermissions(), principals);
            itemsToSelect.forEach((selectedItem: ProjectAccessControlEntry) => {
                this.accessCombobox.select(selectedItem, false, true);
            });

            return Q(null);
        });
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
        const selectedAccessEntries: ProjectAccessControlEntry[] = this.accessCombobox.getSelectedDisplayValues();

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

    onAccessComboboxValueChanged(handler: (permissions: ProjectPermissions) => void) {
        this.accessCombobox.onValueChanged(() => {
            handler(this.getPermissions());
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('project-item-wizard-step-form');
            this.accessComboBoxFormItem.addClass('project-access-control-form-item');

            return rendered;
        });
    }
}
