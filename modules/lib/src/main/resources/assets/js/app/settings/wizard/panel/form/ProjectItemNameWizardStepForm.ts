import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Validators} from 'lib-admin-ui/ui/form/Validators';
import {ValidationResult} from 'lib-admin-ui/ui/form/ValidationResult';
import {ProjectViewItem} from '../../../view/ProjectViewItem';
import Q from 'q';
import {ValidationRecording} from 'lib-admin-ui/form/ValidationRecording';
import {ProjectFormItem, ProjectFormItemBuilder} from './element/ProjectFormItem';
import {ProjectsComboBox} from './element/ProjectsComboBox';
import {Project} from '../../../data/project/Project';
import {ProjectWizardStepForm} from './ProjectWizardStepForm';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {SettingsType} from '../../../dialog/SettingsType';

export class ProjectItemNameWizardStepForm
    extends ProjectWizardStepForm {

    private static PROJECT_NAME_CHARS: RegExp = /^([a-z0-9-])([a-z0-9_-])*$/;

    private projectNameInput: TextInput;

    private projectNameFormItem: ProjectFormItem;

    private descriptionInput: TextInput;

    private parentProjectDropdown: ProjectsComboBox;

    private parentProjectFormItem: ProjectFormItem;

    getProjectName(): string {
        return this.projectNameInput.getValue();
    }

    setProjectName(value: string) {
        this.projectNameInput.setValue(value);
    }

    disableProjectNameInput() {
        this.projectNameInput.whenRendered(() => this.projectNameInput.setEnabled(false));
    }

    getDescription(): string {
        return this.descriptionInput.getValue();
    }

    disableProjectNameHelpText() {
        this.projectNameFormItem.disableHelpText();
    }

    disableParentProjectHelpText() {
        this.parentProjectFormItem.disableHelpText();
    }

    disableParentProjectInput() {
        this.parentProjectDropdown.setEnabled(false);
    }

    showProjectsChain(parentName?: string) {
        if (!this.parentProjectDropdown) {
            return;
        }
        this.parentProjectDropdown.showProjectsChain(parentName);
    }

    getParentProject(): string {
        return this.parentProjectDropdown ? this.parentProjectDropdown.getValue() : undefined;
    }

    setParentProject(project: Project) {
        super.setParentProject(project);

        this.appendParentProjectDropdown();
        this.parentProjectDropdown.selectProject(project);
    }

    onParentProjectChanged(callback: (project: Project) => void) {
        this.parentProjectDropdown.onOptionSelected((event: SelectedOptionEvent<Project>) => {
            callback(event.getSelectedOption().getOption().getDisplayValue());
        });


        this.parentProjectDropdown.onOptionDeselected(() => {
           callback(null);
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('project-item-wizard-step-form');

            return rendered;
        });
    }

    public validate(): ValidationRecording {
        this.projectNameFormItem.validate(new ValidationResult(), true);

        return new ValidationRecording();
    }

    public isValid(): boolean {
        return this.isProjectNameValid() && this.isParentProjectSet();
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q(null);
        }

        this.descriptionInput.setValue(item.getDescription(), true);
        this.projectNameInput.setValue(item.getName(), true);
        this.disableProjectNameHelpText();
        this.disableProjectNameInput();

        return Q(null);
    }

    disableParentProjectElements(parentProject: string) {
        this.showProjectsChain(parentProject);
        this.disableParentProjectHelpText();
        this.disableParentProjectInput();
    }

    public getName(type: SettingsType): string {
        return type.getDisplayName();
    }

    protected initListeners() {
        this.descriptionInput.onValueChanged(() => {
            this.notifyDataChanged();
        });

        this.projectNameInput.onValueChanged(() => {
            this.projectNameFormItem.validate(new ValidationResult(), true);
            this.notifyDataChanged();
        });
    }

    private appendParentProjectDropdown() {
        if (!!this.parentProjectDropdown) {
            return;
        }

        this.parentProjectDropdown = new ProjectsComboBox();

        this.parentProjectFormItem = <ProjectFormItem>new ProjectFormItemBuilder(this.parentProjectDropdown)
            .setHelpText(i18n('settings.projects.parent.helptext'))
            .setLabel(i18n('settings.field.project.parent'))
            .setValidator(Validators.required)
            .build();

        this.parentProjectDropdown.onValueChanged(() => {
            this.parentProjectFormItem.validate(new ValidationResult(), true);
            this.notifyDataChanged();
        });

        this.addFormItem(this.parentProjectFormItem);
    }

    protected createFormItems(): FormItem[] {
        this.projectNameInput = new TextInput();
        this.projectNameFormItem = <ProjectFormItem>new ProjectFormItemBuilder(this.projectNameInput)
            .setHelpText(i18n('settings.projects.name.helptext'))
            .setValidator(this.validateProjectName.bind(this))
            .setLabel(i18n('settings.field.project.name'))
            .build();
        this.projectNameFormItem.getLabel().addClass('required');

        this.descriptionInput = new TextInput();
        const descriptionFormItem: FormItem = new FormItemBuilder(this.descriptionInput).setLabel(i18n('field.description')).build();

        return [this.projectNameFormItem, descriptionFormItem];
    }

    private validateProjectName(): string {
        return !this.isProjectNameValid() ? i18n('field.value.invalid') : undefined;
    }

    private isProjectNameValid(): boolean {
        const projectNameRegExp: RegExp = ProjectItemNameWizardStepForm.PROJECT_NAME_CHARS;
        return projectNameRegExp.test(this.projectNameInput.getValue());
    }

    private isParentProjectSet(): boolean {
        return !this.parentProjectDropdown || !!this.parentProjectDropdown.getValue();
    }
}
