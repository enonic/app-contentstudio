import {TextInput} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {FormItem, FormItemBuilder} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ValidationResult} from '@enonic/lib-admin-ui/ui/form/ValidationResult';
import {ProjectViewItem} from '../../../view/ProjectViewItem';
import * as Q from 'q';
import {ValidationRecording} from '@enonic/lib-admin-ui/form/ValidationRecording';
import {Project} from '../../../data/project/Project';
import {ProjectWizardStepForm} from './ProjectWizardStepForm';
import {SelectedOptionEvent} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {SettingsType} from '../../../data/type/SettingsType';
import {ParentProjectFormItem} from './element/ParentProjectFormItem';
import {ProjectNameFormItem} from './element/ProjectNameFormItem';

export class ProjectItemNameWizardStepForm
    extends ProjectWizardStepForm {

    private nameFormItem: ProjectNameFormItem;

    private descriptionInput: TextInput;

    private timeZoneInput: TextInput;

    private parentProjectFormItem: ParentProjectFormItem;

    getProjectName(): string {
        return this.nameFormItem.getValue();
    }

    setProjectName(value: string) {
        this.nameFormItem.setValue(value);
    }

    setDescription(value: string, silent?: boolean): void {
        this.descriptionInput.setValue(value, silent);
    }

    setTimeZone(value: string, silent?: boolean): void {
        this.timeZoneInput.setValue(value, silent);
    }

    disableProjectNameInput() {
        this.getProjectNameInput().whenRendered(() => this.getProjectNameInput().setEnabled(false));
    }

    getDescription(): string {
        return this.descriptionInput.getValue().trim();
    }

    getTimeZone(): string {
        return this.timeZoneInput.getValue().trim();
    }

    disableProjectNameHelpText() {
        this.nameFormItem.disableHelpText();
    }

    disableParentProjectHelpText() {
        this.parentProjectFormItem.disableHelpText();
    }

    disableParentProjectInput() {
        this.getProjectComboBox().setEnabled(false);
    }

    getParentProject(): string {
        return this.parentProjectFormItem ? this.getProjectComboBox().getValue() : undefined;
    }

    setParentProject(project: Project) {
        super.setParentProject(project);

        this.appendParentProjectDropdown();
        this.getProjectComboBox().selectProject(project);
    }

    onParentProjectChanged(callback: (project: Project) => void) {
        this.getProjectComboBox().onOptionSelected((event: SelectedOptionEvent<Project>) => {
            callback(event.getSelectedOption().getOption().getDisplayValue());
        });


        this.getProjectComboBox().onOptionDeselected(() => {
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
        this.nameFormItem.validate(new ValidationResult(), true);

        return new ValidationRecording();
    }

    public isValid(): boolean {
        return this.nameFormItem.isProjectNameValid() && this.isParentProjectSet();
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q(null);
        }

        this.descriptionInput.setValue(item.getDescription(), true);
        this.nameFormItem.setValue(item.getName(), true);
        this.timeZoneInput.setValue(item.getTimeZone(), true);
        this.disableProjectNameHelpText();
        this.disableProjectNameInput();

        return Q(null);
    }

    disableParentProjectElements(parentProject: string) {
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

        this.timeZoneInput.onValueChanged(() => {
            this.notifyDataChanged();
        });

        this.getProjectNameInput().onValueChanged(() => {
            this.nameFormItem.validate(new ValidationResult(), true);
            this.notifyDataChanged();
        });
    }

    private appendParentProjectDropdown() {
        if (!!this.parentProjectFormItem) {
            return;
        }

        this.parentProjectFormItem = new ParentProjectFormItem();

        this.addFormItem(this.parentProjectFormItem);
    }

    protected createFormItems(): FormItem[] {
        this.nameFormItem = new ProjectNameFormItem();

        this.descriptionInput = new TextInput();
        this.timeZoneInput = new TextInput();
        const descriptionFormItem: FormItem = new FormItemBuilder(this.descriptionInput).setLabel(i18n('field.description')).build();
        const timeZoneFormItem: FormItem = new FormItemBuilder(this.timeZoneInput).setLabel(i18n('field.timezone')).build();

        return [this.nameFormItem, descriptionFormItem, timeZoneFormItem];
    }

    private isParentProjectSet(): boolean {
        return !this.parentProjectFormItem || !!this.getProjectComboBox().getValue();
    }

    private getProjectComboBox() {
        return this.parentProjectFormItem.getProjectsComboBox();
    }

    private getProjectNameInput(): TextInput {
        return this.nameFormItem.getProjectNameInput();
    }
}
