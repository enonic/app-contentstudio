import {SettingDataItemWizardStepForm} from './SettingDataItemWizardStepForm';
import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {HelpTextContainer} from 'lib-admin-ui/form/HelpTextContainer';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ValidationResult} from 'lib-admin-ui/ui/form/ValidationResult';
import {ProjectViewItem} from '../view/ProjectViewItem';

export class ProjectItemNameWizardStepForm
    extends SettingDataItemWizardStepForm<ProjectViewItem> {

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

    layout(item: ProjectViewItem) {
        super.layout(item);

        this.projectNameInput.setValue(item.getName());
        this.disableHelpText();
        this.disableProjectNameInput();
    }

    protected initListeners() {
        super.initListeners();
        this.projectNameInput.onValueChanged(() => {
            this.projectNameFormItem.validate(new ValidationResult(), true);
            this.notifyDataChanged();
        });
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
