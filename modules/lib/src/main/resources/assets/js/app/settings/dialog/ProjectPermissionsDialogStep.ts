import {ProjectFormItemBuilder} from '../wizard/panel/form/element/ProjectFormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectAccessControlComboBox, ProjectAccessControlComboBoxBuilder} from '../wizard/panel/form/element/ProjectAccessControlComboBox';
import {PrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {ProjectDialogStep} from './ProjectDialogStep';
import {ProjectItemPermissionsBuilder, ProjectPermissions} from '../data/project/ProjectPermissions';
import {ProjectAccessControlEntry} from '../access/ProjectAccessControlEntry';
import {ProjectAccess} from '../access/ProjectAccess';

export class ProjectPermissionsDialogStep
    extends ProjectDialogStep {

    private accessCombobox: ProjectAccessControlComboBox;

    protected createFormItems(): FormItem[] {
        return [this.createAccessFormItem()];
    }

    private createAccessCombobox(): void {
        this.accessCombobox = new ProjectAccessControlComboBoxBuilder().build();

        const loader: PrincipalLoader = <PrincipalLoader>this.accessCombobox.getLoader();
        loader.setAllowedTypes([PrincipalType.USER, PrincipalType.GROUP]);
        loader.skipPrincipal(PrincipalKey.ofAnonymous());
    }

    private createAccessFormItem(): FormItem {
        this.createAccessCombobox();

        return new ProjectFormItemBuilder(this.accessCombobox)
            .setHelpText(i18n('settings.projects.roles.helptext'))
            .setLabel(i18n('field.permissions'))
            .build();
    }

    protected getFormClass(): string {
        return 'project-permissions-step';
    }

    isOptional(): boolean {
        return true;
    }

    protected listenItemsEvents(): void {
        super.listenItemsEvents();

        this.accessCombobox.onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    private getPermissions(): ProjectPermissions {
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

    hasData(): boolean {
        return !!this.accessCombobox.getValue();
    }

    getData(): Object {
        return {
            permissions: this.getPermissions().toJson()
        }
    }
}
