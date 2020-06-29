import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ValidationResult} from 'lib-admin-ui/ui/form/ValidationResult';
import {ProjectViewItem} from '../../../view/ProjectViewItem';
import * as Q from 'q';
import {ValidationRecording} from 'lib-admin-ui/form/ValidationRecording';
import {ProjectFormItem, ProjectFormItemBuilder} from './element/ProjectFormItem';
import {ProjectsDropdown} from './element/ProjectsDropdown';
import {Project} from '../../../data/project/Project';
import {OptionSelectedEvent} from 'lib-admin-ui/ui/selector/OptionSelectedEvent';
import {ProjectWizardStepForm} from './ProjectWizardStepForm';

export class ProjectItemNameWizardStepForm
    extends ProjectWizardStepForm {

    private static PROJECT_NAME_CHARS: RegExp = /^([a-z0-9\\-])([a-z0-9_\\-])*$/;

    private projectNameInput: TextInput;

    private projectNameFormItem: ProjectFormItem;

    private descriptionInput: TextInput;

    private parentProjectDropdown: ProjectsDropdown;

    private parentProjectFormItem: ProjectFormItem;

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

    disableProjectNameHelpText() {
        this.projectNameFormItem.disableHelpText();
    }

    disableParentProjectHelpText() {
        this.parentProjectFormItem.disableHelpText();
    }

    disableParentProjectInput() {
        this.parentProjectDropdown.disable();
    }

    showProjectsChain(parentName?: string) {
        this.parentProjectDropdown.showProjectsChain(parentName);
    }

    getParentProject(): string {
        return this.parentProjectDropdown.getValue();
    }

    setParentProject(project: Project) {
        this.parentProjectDropdown.selectProject(project);
    }

    onParentProjectChanged(callback: (project: Project) => void) {
        this.parentProjectDropdown.onOptionSelected((event: OptionSelectedEvent<Project>) => {
            callback(event.getOption().displayValue);
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
        return this.isProjectNameValid();
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q(null);
        }

        this.descriptionInput.setValue(item.getDescription(), true);
        this.projectNameInput.setValue(item.getName(), true);
        this.showProjectsChain(item.getData().getParent());
        this.disableParentProjectInput();
        this.disableProjectNameHelpText();
        this.disableProjectNameInput();
        this.disableParentProjectHelpText();

        return Q(null);
    }

    public getName(): string {
        return i18n('settings.items.type.project');
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

    protected getFormItems(): FormItem[] {
        this.projectNameInput = new TextInput();
        this.projectNameFormItem = <ProjectFormItem>new ProjectFormItemBuilder(this.projectNameInput)
            .setHelpText(i18n('settings.projects.name.helptext'))
            .setValidator(this.validateProjectName.bind(this))
            .setLabel(i18n('settings.field.project.name'))
            .build();
        this.projectNameFormItem.getLabel().addClass('required');

        this.descriptionInput = new TextInput();
        const descriptionFormItem: FormItem = new FormItemBuilder(this.descriptionInput).setLabel(i18n('field.description')).build();

        this.parentProjectDropdown = new ProjectsDropdown();

        this.parentProjectFormItem = <ProjectFormItem>new ProjectFormItemBuilder(this.parentProjectDropdown)
            .setHelpText(i18n('settings.projects.parent.helptext'))
            .setLabel(i18n('settings.field.project.parent'))
            .build();

        return [this.projectNameFormItem, descriptionFormItem, this.parentProjectFormItem];
    }

    private validateProjectName(): string {
        return !this.isProjectNameValid() ? i18n('field.value.invalid') : undefined;
    }

    private isProjectNameValid(): boolean {
        const projectNameRegExp: RegExp = ProjectItemNameWizardStepForm.PROJECT_NAME_CHARS;
        return projectNameRegExp.test(this.projectNameInput.getValue());
    }
}
