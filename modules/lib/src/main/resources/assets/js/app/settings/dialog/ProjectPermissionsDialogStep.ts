import {ProjectFormItemBuilder} from '../wizard/panel/form/element/ProjectFormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectAccessControlComboBox, ProjectAccessControlComboBoxBuilder} from '../wizard/panel/form/element/ProjectAccessControlComboBox';
import {PrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {ProjectDialogStep} from './ProjectDialogStep';
import {ProjectAccessControlEntry} from '../access/ProjectAccessControlEntry';
import {ProjectAccess} from '../access/ProjectAccess';
import {ProjectPermissionsData, ProjectPermissionsDataBuilder} from './ProjectPermissionsData';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';

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

    getPermissions(): ProjectPermissionsData {
        const selectedAccessEntries: ProjectAccessControlEntry[] = this.accessCombobox.getSelectedDisplayValues();

        const owners: Principal[] = selectedAccessEntries
            .filter((entry: ProjectAccessControlEntry) => entry.getAccess() === ProjectAccess.OWNER)
            .map((ownerEntry: ProjectAccessControlEntry) => ownerEntry.getPrincipal());
        const editors: Principal[] = selectedAccessEntries
            .filter((entry: ProjectAccessControlEntry) => entry.getAccess() === ProjectAccess.EDITOR)
            .map((editorEntry: ProjectAccessControlEntry) => editorEntry.getPrincipal());
        const contributors: Principal[] = selectedAccessEntries
            .filter((entry: ProjectAccessControlEntry) => entry.getAccess() === ProjectAccess.CONTRIBUTOR)
            .map((contributorEntry: ProjectAccessControlEntry) => contributorEntry.getPrincipal());
        const authors: Principal[] = selectedAccessEntries
            .filter((entry: ProjectAccessControlEntry) => entry.getAccess() === ProjectAccess.AUTHOR)
            .map((contributorEntry: ProjectAccessControlEntry) => contributorEntry.getPrincipal());

        return new ProjectPermissionsDataBuilder()
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
        const data: ProjectPermissionsData = this.getPermissions();

        return {
            permissions: {
                contributor: data.getContributors().map((p: Principal) => p.getKey().toString()),
                author: data.getAuthors().map((p: Principal) => p.getKey().toString()),
                owner: data.getOwners().map((p: Principal) => p.getKey().toString()),
                editor: data.getEditors().map((p: Principal) => p.getKey().toString())
            }
        }
    }
}
