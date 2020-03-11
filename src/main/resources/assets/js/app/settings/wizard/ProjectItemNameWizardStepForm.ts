import {SettingDataItemWizardStepForm} from './SettingDataItemWizardStepForm';
import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {HelpTextContainer} from 'lib-admin-ui/form/HelpTextContainer';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ValidationResult} from 'lib-admin-ui/ui/form/ValidationResult';
import {ProjectViewItem} from '../view/ProjectViewItem';
import {ProjectAccessControlComboBox} from './ProjectAccessControlComboBox';
import {ProjectAccessControlEntry} from '../access/ProjectAccessControlEntry';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {Principal} from 'lib-admin-ui/security/Principal';
import {ProjectItemPermissionsBuilder, ProjectPermissions} from '../data/project/ProjectPermissions';
import * as Q from 'q';
import {ProjectAccess} from '../access/ProjectAccess';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {GetPrincipalsByKeysRequest} from 'lib-admin-ui/security/GetPrincipalsByKeysRequest';

export class ProjectItemNameWizardStepForm
    extends SettingDataItemWizardStepForm<ProjectViewItem> {

    private static PROJECT_NAME_CHARS: RegExp = /^([a-z0-9\\-])([a-z0-9_\\-])*$/;

    private projectNameInput: TextInput;

    private projectNameFormItem: FormItem;

    private accessCombobox: ProjectAccessControlComboBox;

    private accessComboBoxFormItem: FormItem;

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

    disableHelpText() {
        this.helpText.toggleHelpText(false);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('project-item-wizard-step-form');
            this.projectNameFormItem.getParentElement().insertChild(this.helpText.getHelpText(), 1);
            this.accessComboBoxFormItem.addClass('project-access-control-form-item');

            return rendered;
        });
    }

    public isValid(): boolean {
        return this.isProjectNameValid();
    }

    layout(item: ProjectViewItem) {
        super.layout(item);

        this.projectNameInput.setValue(item.getName());
        this.disableHelpText();
        this.disableProjectNameInput();

        this.getPrincipalsFromPermissions(item.getPermissions()).then((principals: Principal[]) => {
            const itemsToSelect: ProjectAccessControlEntry[] = this.createItemsToSelect(item.getPermissions(), principals);
            itemsToSelect.forEach((selectedItem: ProjectAccessControlEntry) => {
                this.accessCombobox.select(selectedItem);
            });
        }).catch(DefaultErrorHandler.handle);
    }

    private getPrincipalsFromPermissions(permissions: ProjectPermissions): Q.Promise<Principal[]> {
        const principalKeys: PrincipalKey[] = [...permissions.getContributors(), ...permissions.getExperts(), ...permissions.getOwners()];
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
        permissions.getExperts().forEach((key: PrincipalKey) => {
            const experts: Principal[] = principals.filter((value: Principal) => value.getKey().equals(key));
            if (experts.length > 0) {
                itemsToSelect.push(new ProjectAccessControlEntry(experts[0], ProjectAccess.EDITOR));
            }
        });
        permissions.getContributors().forEach((key: PrincipalKey) => {
            const contributors: Principal[] = principals.filter((value: Principal) => value.getKey().equals(key));
            if (contributors.length > 0) {
                itemsToSelect.push(new ProjectAccessControlEntry(contributors[0], ProjectAccess.CONTRIBUTOR));
            }
        });

        return itemsToSelect;
    }

    getPermissions(): ProjectPermissions {
        const selectedAccessEntries: ProjectAccessControlEntry[] = this.accessCombobox.getSelectedDisplayValues();

        const owners: PrincipalKey[] = selectedAccessEntries
            .filter((entry: ProjectAccessControlEntry) => entry.getAccess() === ProjectAccess.OWNER)
            .map((ownerEntry: ProjectAccessControlEntry) => ownerEntry.getPrincipalKey());
        const experts: PrincipalKey[] = selectedAccessEntries
            .filter((entry: ProjectAccessControlEntry) => entry.getAccess() === ProjectAccess.EDITOR)
            .map((expertEntry: ProjectAccessControlEntry) => expertEntry.getPrincipalKey());
        const contributors: PrincipalKey[] = selectedAccessEntries
            .filter((entry: ProjectAccessControlEntry) => entry.getAccess() === ProjectAccess.CONTRIBUTOR)
            .map((contributorEntry: ProjectAccessControlEntry) => contributorEntry.getPrincipalKey());

        return new ProjectItemPermissionsBuilder().setOwners(owners).setExperts(experts).setContributors(contributors).build();
    }

    protected initListeners() {
        super.initListeners();
        this.projectNameInput.onValueChanged(() => {
            this.projectNameFormItem.validate(new ValidationResult(), true);
            this.notifyDataChanged();
        });

        this.accessCombobox.onValueChanged(this.notifyDataChanged.bind(this));
        this.accessCombobox.onOptionValueChanged(this.notifyDataChanged.bind(this));
    }

    protected getFormItems(): FormItem[] {
        this.projectNameInput = new TextInput();
        this.projectNameFormItem = new FormItemBuilder(this.projectNameInput)
            .setValidator(this.validateProjectName.bind(this))
            .setLabel(i18n('settings.field.project.name'))
            .build();
        this.projectNameFormItem.getLabel().addClass('required');

        this.accessCombobox = new ProjectAccessControlComboBox();

        this.accessComboBoxFormItem = new FormItemBuilder(this.accessCombobox)
            .setLabel(i18n('settings.field.project.access'))
            .build();

        return [this.projectNameFormItem, ...super.getFormItems(), this.accessComboBoxFormItem];
    }

    private validateProjectName(): string {
        return !this.isProjectNameValid() ? i18n('field.value.invalid') : undefined;
    }

    private isProjectNameValid(): boolean {
        const projectNameRegExp: RegExp = ProjectItemNameWizardStepForm.PROJECT_NAME_CHARS;
        return projectNameRegExp.test(this.projectNameInput.getValue());
    }
}
