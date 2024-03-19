import {TextInput} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {FormItem, FormItemBuilder} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ValidationResult} from '@enonic/lib-admin-ui/ui/form/ValidationResult';
import {ProjectViewItem} from '../../../view/ProjectViewItem';
import * as Q from 'q';
import {ValidationRecording} from '@enonic/lib-admin-ui/form/ValidationRecording';
import {Project} from '../../../data/project/Project';
import {ProjectWizardStepForm} from './ProjectWizardStepForm';
import {SettingsType} from '../../../data/type/SettingsType';
import {ParentProjectFormItem} from './element/ParentProjectFormItem';
import {ProjectNameFormItem} from './element/ProjectNameFormItem';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';

export class ProjectItemNameWizardStepForm
    extends ProjectWizardStepForm {

    private nameFormItem: ProjectNameFormItem;

    private descriptionInput: TextInput;

    private parentProjectsFormItem: ParentProjectFormItem;

    getProjectName(): string {
        return this.nameFormItem.getValue();
    }

    setProjectName(value: string) {
        this.nameFormItem.setValue(value);
    }

    setDescription(value: string, silent?: boolean): void {
        this.descriptionInput.setValue(value, silent);
    }

    disableProjectNameInput() {
        this.getProjectNameInput().whenRendered(() => this.getProjectNameInput().setEnabled(false));
    }

    getDescription(): string {
        return this.descriptionInput.getValue().trim();
    }

    disableProjectNameHelpText() {
        this.nameFormItem.disableHelpText();
    }

    disableParentProjectHelpText() {
        this.parentProjectsFormItem.disableHelpText();
    }

    disableParentProjectsInput() {
        this.getProjectsComboBox().setEnabled(false);
    }

    getParentProjectsNames(): string[] {
        return this.getParentProjects()?.map((project: Project) => project.getName());
    }

    getParentProjects(): Project[] | undefined {
        return this.parentProjectsFormItem ? this.getProjectsComboBox().getSelector().getSelectedItems() : undefined;
    }

    setParentProjects(projects: Project[]) {
        super.setParentProjects(projects);

        this.appendParentProjectDropdown();
        this.getProjectsComboBox().getSelector().updateAndSelectProjects(projects);
    }

    onParentProjectChanged(callback: (project: Project) => void) {
        this.getProjectsComboBox().getSelector().onSelectionChanged((selectionChange: SelectionChange<Project>) => {
            if (selectionChange.selected?.length > 0) {
                callback(selectionChange.selected[0]);
            }

            if (selectionChange.deselected?.length > 0) {
                callback(null);
            }
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
        return this.nameFormItem.isProjectNameValid() && this.isParentProjectsSet();
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q(null);
        }

        this.descriptionInput.setValue(item.getDescription(), true);
        this.nameFormItem.setValue(item.getName(), true);
        this.disableProjectNameHelpText();
        this.disableProjectNameInput();

        return Q(null);
    }

    disableParentProjectElements() {
        this.disableParentProjectHelpText();
        this.disableParentProjectsInput();
    }

    public getName(type: SettingsType): string {
        return type.getDisplayName();
    }

    protected initListeners() {
        this.descriptionInput.onValueChanged(() => {
            this.notifyDataChanged();
        });

        this.getProjectNameInput().onValueChanged(() => {
            this.nameFormItem.validate(new ValidationResult(), true);
            this.notifyDataChanged();
        });
    }

    private appendParentProjectDropdown() {
        if (this.parentProjectsFormItem) {
            return;
        }

        this.parentProjectsFormItem = new ParentProjectFormItem();

        this.addFormItem(this.parentProjectsFormItem);
    }

    protected createFormItems(): FormItem[] {
        this.nameFormItem = new ProjectNameFormItem();

        this.descriptionInput = new TextInput();
        const descriptionFormItem: FormItem = new FormItemBuilder(this.descriptionInput).setLabel(i18n('field.description')).build();

        return [this.nameFormItem, descriptionFormItem];
    }

    private isParentProjectsSet(): boolean {
        return !this.parentProjectsFormItem || this.getProjectsComboBox().getSelector().getSelectedItems()?.length > 0;
    }

    private getProjectsComboBox() {
        return this.parentProjectsFormItem.getProjectsSelector();
    }

    private getProjectNameInput(): TextInput {
        return this.nameFormItem.getProjectNameInput();
    }
}
