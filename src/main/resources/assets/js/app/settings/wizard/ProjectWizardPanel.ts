import {ProjectItem} from '../data/ProjectItem';
import {SettingsItemWizardPanel} from './SettingsItemWizardPanel';
import {i18n} from 'lib-admin-ui/util/Messages';
import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import * as Q from 'q';
import {SettingItemWizardStepForm} from './SettingItemWizardStepForm';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ProjectCreateRequest} from '../resource/ProjectCreateRequest';
import {ProjectUpdateRequest} from '../resource/ProjectUpdateRequest';
import {ProjectDeleteRequest} from '../resource/ProjectDeleteRequest';
import {ValidationResult} from 'lib-admin-ui/ui/form/ValidationResult';
import {Name} from 'lib-admin-ui/Name';
import {WizardHeaderWithDisplayNameAndName} from 'lib-admin-ui/app/wizard/WizardHeaderWithDisplayNameAndName';
import {HelpTextContainer} from 'lib-admin-ui/form/HelpTextContainer';
import {WizardStep} from 'lib-admin-ui/app/wizard/WizardStep';
import {WizardStepForm} from 'lib-admin-ui/app/wizard/WizardStepForm';
import {Form} from 'lib-admin-ui/ui/form/Form';
import {Fieldset} from 'lib-admin-ui/ui/form/Fieldset';
import {ProjectAccessControlComboBox} from './ProjectAccessControlComboBox';
import {ProjectAccessControlEntry} from '../access/ProjectAccessControlEntry';
import {ProjectItemPermissions, ProjectItemPermissionsBuilder} from '../data/ProjectItemPermissions';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {ProjectAccess} from '../access/ProjectAccess';
import {GetPrincipalsByKeysRequest} from 'lib-admin-ui/security/GetPrincipalsByKeysRequest';
import {Principal} from 'lib-admin-ui/security/Principal';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';

export class ProjectWizardPanel
    extends SettingsItemWizardPanel<ProjectItem> {

    protected wizardStepForm: ProjectItemNameWizardStepForm;

    private accessStepForm: ProjectAccessWizardStepForm;

    protected createWizardStepForm(): ProjectItemNameWizardStepForm {
        return new ProjectItemNameWizardStepForm();
    }

    protected createSteps(): WizardStep[] {
        const steps: WizardStep[] = super.createSteps();

        this.accessStepForm = new ProjectAccessWizardStepForm();
        steps.push(new WizardStep(i18n('field.access'), this.accessStepForm));

        return steps;
    }

    protected getIconClass(): string {
        return 'icon-tree-2';
    }

    doLayout(project: ProjectItem): Q.Promise<void> {
        return super.doLayout(project).then(() => {
            if (!!project) {
                this.accessStepForm.layout(project);
            }

            this.accessStepForm.onSelectedAccessItemsChanged(() => {
                this.handleDataChanged();
            });

            return Q<void>(null);
        });
    }

    protected createWizardHeader(): WizardHeaderWithDisplayNameAndName {
        const header: WizardHeaderWithDisplayNameAndName = super.createWizardHeader();
        header.onPropertyChanged(() => {
            if (this.getPersistedItem()) {
                return;
            }

            this.wizardStepForm.setProjectName(header.getDisplayName()
                .trim()
                .replace(/\s+/g, '-')
                .toLowerCase()
                .replace(Name.FORBIDDEN_CHARS, ''));
        });

        return header;
    }

    protected isNewItemChanged(): boolean {
        return !StringHelper.isBlank(this.wizardStepForm.getProjectName()) || !this.accessStepForm.getPermissions().isEmpty()
               || super.isNewItemChanged();
    }

    protected isPersistedItemChanged(): boolean {
        const item: ProjectItem = this.getPersistedItem();

        if (!ObjectHelper.stringEquals(item.getName(), this.wizardStepForm.getProjectName())) {
            return true;
        }

        if (!item.getPermissions().equals(this.accessStepForm.getPermissions())) {
            return true;
        }

        return super.isPersistedItemChanged();
    }

    postPersistNewItem(item: ProjectItem): Q.Promise<ProjectItem> {
        return super.postPersistNewItem(item).then(() => {
            this.wizardStepForm.disableProjectNameInput();
            this.wizardStepForm.disableHelpText();

            return Q(item);
        });
    }

    protected createDeleteRequest(): ProjectDeleteRequest {
        return new ProjectDeleteRequest(this.getPersistedItem().getName());
    }

    protected getSuccessfulDeleteMessage(): string {
        return i18n('notify.settings.project.deleted', this.getPersistedItem().getName());
    }

    protected produceCreateItemRequest(): ProjectCreateRequest {
        const displayName: string = this.wizardHeader.getDisplayName();
        const thumbnail: File = this.getFormIcon().getThumbnailFile();

        return new ProjectCreateRequest()
            .setDescription(this.wizardStepForm.getDescription())
            .setName(this.wizardStepForm.getProjectName())
            .setDisplayName(displayName)
            .setPermissions(this.accessStepForm.getPermissions())
            .setThumbnail(thumbnail);
    }

    protected getSuccessfulCreateMessage(item: ProjectItem): string {
        return i18n('notify.settings.project.created', item.getName());
    }

    protected produceUpdateItemRequest(): ProjectUpdateRequest {
        const displayName: string = this.wizardHeader.getDisplayName();
        const thumbnail: File = this.getFormIcon().getThumbnailFile();

        return new ProjectUpdateRequest()
            .setDescription(this.wizardStepForm.getDescription())
            .setName(this.wizardStepForm.getProjectName())
            .setDisplayName(displayName)
            .setPermissions(this.accessStepForm.getPermissions())
            .setThumbnail(thumbnail);
    }

    protected getSuccessfulUpdateMessage(item: ProjectItem): string {
        return i18n('notify.settings.project.modified', item.getName());
    }
}

class ProjectItemNameWizardStepForm
    extends SettingItemWizardStepForm {

    private static PROJECT_NAME_CHARS: RegExp = /^([a-z0-9\\-])([a-z0-9_\\-])*$/;

    private projectNameInput: TextInput;
    private projectNameFormItem: FormItem;
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

    protected initListeners() {
        super.initListeners();
        this.projectNameInput.onValueChanged(() => {
            this.projectNameFormItem.validate(new ValidationResult(), true);
            this.notifyDataChanged();
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('project-item-wizard-step-form');
            this.projectNameFormItem.getParentElement().insertChild(this.helpText.getHelpText(), 1);

            return rendered;
        });
    }

    public isValid(): boolean {
        return this.isProjectNameValid();
    }

    layout(item: ProjectItem) {
        super.layout(item);

        this.projectNameInput.setValue(item.getName());
        this.disableHelpText();
        this.disableProjectNameInput();
    }

    protected getFormItems(): FormItem[] {
        this.projectNameInput = new TextInput();
        this.projectNameFormItem = new FormItemBuilder(this.projectNameInput)
            .setValidator(this.validateProjectName.bind(this))
            .setLabel(i18n('settings.field.project.name'))
            .build();
        this.projectNameFormItem.getLabel().addClass('required');

        return [this.projectNameFormItem];
    }

    private validateProjectName(): string {
        return !this.isProjectNameValid() ? i18n('field.value.invalid') : undefined;
    }

    private isProjectNameValid(): boolean {
        const projectNameRegExp: RegExp = ProjectItemNameWizardStepForm.PROJECT_NAME_CHARS;
        return projectNameRegExp.test(this.projectNameInput.getValue());
    }
}

class ProjectAccessWizardStepForm
    extends WizardStepForm {

    private form: Form;

    private accessCombobox: ProjectAccessControlComboBox;

    constructor() {
        super('project-access-wizard-step-form');

        this.form = new Form();
        this.addFormItems();
    }

    private addFormItems() {
        this.accessCombobox = new ProjectAccessControlComboBox();

        const accessComboBoxFormItem: FormItem = new FormItemBuilder(this.accessCombobox)
            .setLabel(i18n('field.permissions'))
            .build();
        const fieldSet: Fieldset = new Fieldset();
        fieldSet.add(accessComboBoxFormItem);

        this.form.add(fieldSet);
    }

    layout(item: ProjectItem) {
        this.accessCombobox.clearSelection();
        this.getPrincipalsFromPermissions(item.getPermissions()).then((principals: Principal[]) => {
            const itemsToSelect: ProjectAccessControlEntry[] = this.createItemsToSelect(item.getPermissions(), principals);
            itemsToSelect.forEach((selectedItem: ProjectAccessControlEntry) => {
                this.accessCombobox.select(selectedItem);
            });
        }).catch(DefaultErrorHandler.handle);
    }

    private getPrincipalsFromPermissions(permissions: ProjectItemPermissions): Q.Promise<Principal[]> {
        const principalKeys: PrincipalKey[] = [...permissions.getContributors(), ...permissions.getExperts(), ...permissions.getOwners()];
        return new GetPrincipalsByKeysRequest(principalKeys).sendAndParse();
    }

    private createItemsToSelect(permissions: ProjectItemPermissions, principals: Principal[]): ProjectAccessControlEntry[] {
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
                itemsToSelect.push(new ProjectAccessControlEntry(experts[0], ProjectAccess.EXPERT));
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

    getPermissions(): ProjectItemPermissions {
        const selectedAccessEntries: ProjectAccessControlEntry[] = this.accessCombobox.getSelectedDisplayValues();

        const owners: PrincipalKey[] = selectedAccessEntries
            .filter((entry: ProjectAccessControlEntry) => entry.getAccess() === ProjectAccess.OWNER)
            .map((ownerEntry: ProjectAccessControlEntry) => ownerEntry.getPrincipalKey());
        const experts: PrincipalKey[] = selectedAccessEntries
            .filter((entry: ProjectAccessControlEntry) => entry.getAccess() === ProjectAccess.EXPERT)
            .map((expertEntry: ProjectAccessControlEntry) => expertEntry.getPrincipalKey());
        const contributors: PrincipalKey[] = selectedAccessEntries
            .filter((entry: ProjectAccessControlEntry) => entry.getAccess() === ProjectAccess.CONTRIBUTOR)
            .map((contributorEntry: ProjectAccessControlEntry) => contributorEntry.getPrincipalKey());

        return new ProjectItemPermissionsBuilder().setOwners(owners).setExperts(experts).setContributors(contributors).build();
    }

    onSelectedAccessItemsChanged(handler: () => void) {
        this.accessCombobox.onValueChanged(handler);
        this.accessCombobox.onSelectedItemValueChanged(handler);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.form);

            return rendered;
        });
    }
}
