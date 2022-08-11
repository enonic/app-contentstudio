import {ProjectFormItemBuilder} from './ProjectFormItem';
import {ProjectAccessControlComboBox, ProjectAccessControlComboBoxBuilder} from './ProjectAccessControlComboBox';
import {PrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectItemPermissionsBuilder, ProjectPermissions} from '../../../../data/project/ProjectPermissions';
import * as Q from 'q';
import {ProjectAccessControlEntry} from '../../../../access/ProjectAccessControlEntry';
import {GetPrincipalsByKeysRequest} from '../../../../../security/GetPrincipalsByKeysRequest';
import {ProjectAccess} from '../../../../access/ProjectAccess';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {CopyFromParentFormItem} from './CopyFromParentFormItem';

export class ProjectRolesFormItem
    extends CopyFromParentFormItem {

    constructor() {
        const accessCombobox: ProjectAccessControlComboBox = new ProjectAccessControlComboBoxBuilder().build();

        const loader: PrincipalLoader = <PrincipalLoader>accessCombobox.getLoader();
        loader.setAllowedTypes([PrincipalType.USER, PrincipalType.GROUP]);
        loader.skipPrincipal(PrincipalKey.ofAnonymous());

        super(new ProjectFormItemBuilder(accessCombobox)
            .setHelpText(i18n('settings.projects.roles.helptext')));

        this.addClass('project-roles-form-item');

        this.initListeners();
    }

    protected initListeners() {
        this.getAccessComboBox().onValueChanged(() => {
            this.updateCopyButtonState();
        });

        this.getAccessComboBox().onOptionValueChanged(() => {
            this.updateCopyButtonState();
        });
    }

    layoutAccessCombobox(permissions: ProjectPermissions, silent: boolean = true): Q.Promise<void> {
        return this.getPrincipalsFromPermissions(permissions).then((principals: Principal[]) => {
            this.getAccessComboBox().clearSelection(true, false, false, false);

            const itemsToSelect: ProjectAccessControlEntry[] = this.createItemsToSelect(permissions, principals);

            if (itemsToSelect.length > 0) {
                itemsToSelect.forEach((selectedItem: ProjectAccessControlEntry) => {
                    this.getAccessComboBox().select(selectedItem, false, silent);
                    this.getAccessComboBox().resetBaseValues();
                });
            } else {
                this.updateCopyButtonState();
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

    getAccessComboBox(): ProjectAccessControlComboBox {
        return <ProjectAccessControlComboBox>this.getInput();
    }

    protected doCopyFromParent(): void {
        this.layoutAccessCombobox(this.parentProject.getPermissions(), false).then(() => {
            NotifyManager.get().showSuccess(
                i18n('settings.wizard.project.copy.success', i18n('settings.items.wizard.step.roles'),
                    this.parentProject.getDisplayName()));
        });
    }

    updateCopyButtonState(): void {
        this.copyFromParentButton?.setEnabled(
            this.parentProject && !ObjectHelper.equals(this.parentProject.getPermissions(), this.getPermissions()));
    }
}
