import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectAccessControlComboBox} from '../../../../wizard/panel/form/element/ProjectAccessControlComboBox';
import {ProjectDialogStep} from './ProjectDialogStep';
import {ProjectAccessControlEntry} from '../../../../access/ProjectAccessControlEntry';
import {ProjectAccess} from '../../../../access/ProjectAccess';
import {ProjectPermissionsData, ProjectPermissionsDataBuilder} from '../data/ProjectPermissionsData';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {RolesFormItem} from '../../../../wizard/panel/form/element/RolesFormItem';

export class ProjectPermissionsDialogStep
    extends ProjectDialogStep {

    protected createFormItems(): FormItem[] {
        return [new RolesFormItem()];
    }

    protected getFormClass(): string {
        return 'project-permissions-step';
    }

    isOptional(): boolean {
        return true;
    }

    protected listenItemsEvents(): void {
        super.listenItemsEvents();

        this.getAccessComboBox().onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    getPermissions(): ProjectPermissionsData {
        const selectedAccessEntries: ProjectAccessControlEntry[] = this.getAccessComboBox().getSelectedDisplayValues();

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
        return !!this.getAccessComboBox().getValue();
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

    getName(): string {
        return 'projectPermissions';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.permissions.description');
    }

    private getAccessComboBox(): ProjectAccessControlComboBox {
        return (<RolesFormItem>this.formItems[0]).getAccessCombobox();
    }
}
