import {SettingDataItemWizardStepForm} from './SettingDataItemWizardStepForm';
import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {HelpTextContainer} from 'lib-admin-ui/form/HelpTextContainer';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ValidationResult} from 'lib-admin-ui/ui/form/ValidationResult';
import {ProjectViewItem} from '../view/ProjectViewItem';
import {ProjectAccessControlComboBox} from './ProjectAccessControlComboBox';
import {ProjectAccessControlEntry} from '../access/ProjectAccessControlEntry';
import {Principal} from 'lib-admin-ui/security/Principal';
import {ProjectItemPermissionsBuilder, ProjectPermissions} from '../data/project/ProjectPermissions';
import * as Q from 'q';
import {ProjectAccess} from '../access/ProjectAccess';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {GetPrincipalsByKeysRequest} from 'lib-admin-ui/security/GetPrincipalsByKeysRequest';
import {PrincipalType} from 'lib-admin-ui/security/PrincipalType';
import {PrincipalLoader} from 'lib-admin-ui/security/PrincipalLoader';
import {ValidationRecording} from 'lib-admin-ui/form/ValidationRecording';

export class ProjectItemNameWizardStepForm
    extends SettingDataItemWizardStepForm<ProjectViewItem> {

    private static PROJECT_NAME_CHARS: RegExp = /^([a-z0-9\\-])([a-z0-9_\\-])*$/;

    private projectNameInput: TextInput;

    private projectNameFormItem: FormItem;

    private descriptionInput: TextInput;

    private accessCombobox?: ProjectAccessControlComboBox;

    private accessComboBoxFormItem?: FormItem;

    private helpText: HelpTextContainer;

    constructor() {
        super();

        this.helpText = new HelpTextContainer(i18n('settings.projects.name.helptext'));
        this.helpText.toggleHelpText(true);
    }

    getProjectName(): string {
        return this.projectNameInput.getValue();
    }

    setProjectName(value: string) {
        this.projectNameInput.setValue(value);
    }

    disableProjectNameInput() {
        this.projectNameInput.getEl().setDisabled(true);
    }

    getDescription(): string {
        return this.descriptionInput.getValue();
    }

    disableHelpText() {
        this.helpText.toggleHelpText(false);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('project-item-wizard-step-form');
            this.projectNameFormItem.getParentElement().insertChild(this.helpText.getHelpText(), 1);

            if (this.accessComboBoxFormItem) {
                this.accessComboBoxFormItem.addClass('project-access-control-form-item');
            }

            return rendered;
        });
    }

    public validate(): ValidationRecording {
        this.projectNameFormItem.validate(new ValidationResult(), true);

        return new ValidationRecording();
    }

    public isValid(): boolean {
        return this.isProjectNameValid();
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q(null);
        }

        this.descriptionInput.setValue(item.getDescription(), true);
        this.projectNameInput.setValue(item.getName(), true);
        this.disableHelpText();
        this.disableProjectNameInput();

        if (item.isDefaultProject()) {
            return Q(null);
        }

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

    public getName(): string {
        return i18n('settings.items.type.project');
    }

    getPermissions(): ProjectPermissions {
        if (!this.accessCombobox) {
            return null;
        }

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

    protected initListeners() {
        this.descriptionInput.onValueChanged(() => {
            this.notifyDataChanged();
        });

        this.projectNameInput.onValueChanged(() => {
            this.projectNameFormItem.validate(new ValidationResult(), true);
            this.notifyDataChanged();
        });

        if (!!this.accessCombobox) {
            this.accessCombobox.onValueChanged(this.notifyDataChanged.bind(this));
            this.accessCombobox.onOptionValueChanged(this.notifyDataChanged.bind(this));
        }
    }

    protected getFormItems(item?: ProjectViewItem): FormItem[] {
        this.projectNameInput = new TextInput();
        this.projectNameFormItem = new FormItemBuilder(this.projectNameInput)
            .setValidator(this.validateProjectName.bind(this))
            .setLabel(i18n('settings.field.project.name'))
            .build();
        this.projectNameFormItem.getLabel().addClass('required');

        this.descriptionInput = new TextInput();
        const descriptionFormItem: FormItem = new FormItemBuilder(this.descriptionInput).setLabel(i18n('field.description')).build();

        if (!!item && item.isDefaultProject()) {
            return [this.projectNameFormItem, descriptionFormItem];
        }

        this.accessCombobox = new ProjectAccessControlComboBox();
        const loader: PrincipalLoader = <PrincipalLoader>this.accessCombobox.getLoader();
        loader.setAllowedTypes([PrincipalType.USER, PrincipalType.GROUP]);
        loader.skipPrincipal(PrincipalKey.ofAnonymous());

        this.accessComboBoxFormItem = new FormItemBuilder(this.accessCombobox)
            .setLabel(i18n('settings.field.project.access'))
            .build();

        return [this.projectNameFormItem, descriptionFormItem, this.accessComboBoxFormItem];
    }

    private validateProjectName(): string {
        return !this.isProjectNameValid() ? i18n('field.value.invalid') : undefined;
    }

    private isProjectNameValid(): boolean {
        const projectNameRegExp: RegExp = ProjectItemNameWizardStepForm.PROJECT_NAME_CHARS;
        return projectNameRegExp.test(this.projectNameInput.getValue());
    }
}
