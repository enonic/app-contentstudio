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

export class ProjectWizardPanel
    extends SettingsItemWizardPanel<ProjectItem> {

    protected wizardStepForm: ProjectItemNameWizardStepForm;

    protected createWizardStepForm(): ProjectItemNameWizardStepForm {
        return new ProjectItemNameWizardStepForm();
    }

    protected getIconClass(): string {
        return 'icon-tree-2';
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
        return !StringHelper.isBlank(this.wizardStepForm.getProjectName())
               || super.isNewItemChanged();
    }

    protected isPersistedItemChanged(): boolean {
        const item: ProjectItem = this.getPersistedItem();

        if (!ObjectHelper.stringEquals(item.getName(), this.wizardStepForm.getProjectName())) {
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
