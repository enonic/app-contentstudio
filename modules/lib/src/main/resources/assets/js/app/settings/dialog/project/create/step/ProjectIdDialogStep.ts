import {ProjectFormItem, ProjectFormItemBuilder} from '../../../../wizard/panel/form/element/ProjectFormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {TextInput} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {ProjectDialogStep} from './ProjectDialogStep';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import Q from 'q';
import {ValidationResult} from '@enonic/lib-admin-ui/ui/form/ValidationResult';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ProjectListRequest} from '../../../../resource/ProjectListRequest';
import {Project} from '../../../../data/project/Project';
import {ProjectNameFormItem} from '../../../../wizard/panel/form/element/ProjectNameFormItem';
import {ProjectIdDialogStepData} from '../data/ProjectIdDialogStepData';

export class ProjectIdDialogStep
    extends ProjectDialogStep {

    private displayNameInput: TextInput;

    private displayNameFormItem: FormItem;

    private nameFormItem: ProjectNameFormItem;

    private descriptionInput: TextInput;

    createFormItems(): FormItem[] {
        return [this.createProjectDisplayNameFormItem(), this.createProjectNameFormItem(), this.createDescriptionFormItem()];
    }

    setDisplayName(value: string, silent?: boolean): void {
        this.displayNameInput.setValue(value, silent);
    }

    setName(value: string, silent?: boolean): void {
        this.nameFormItem.setValue(value, silent);
    }

    setDescription(value: string, silent?: boolean): void {
        this.descriptionInput.setValue(value, silent);
    }

    private createProjectDisplayNameFormItem(): FormItem {
        this.displayNameInput = new TextInput();

        this.displayNameFormItem = new ProjectFormItemBuilder(this.displayNameInput)
            .setLabel(i18n('field.displayName'))
            .setValidator(Validators.required)
            .build() as ProjectFormItem;

        return this.displayNameFormItem;
    }

    private createProjectNameFormItem(): FormItem {
        this.nameFormItem = new ProjectNameFormItem();
        return this.nameFormItem;
    }

    private createDescriptionFormItem(): FormItem {
        this.descriptionInput = new TextInput();

        return new ProjectFormItemBuilder(this.descriptionInput).setLabel(i18n('field.description')).build() as ProjectFormItem;
    }

    isOptional(): boolean {
        return false;
    }

    protected initEventListeners(): void {
        super.initEventListeners();

        this.nameFormItem.getProjectNameInput().onValueChanged(() => {
            this.nameFormItem.setNameIsOccupied(false);
            this.nameFormItem.validate(new ValidationResult(), true);
            this.notifyDataChanged();
        });

        this.displayNameInput.onValueChanged(() => {
            this.displayNameFormItem.validate(new ValidationResult(), true);
            this.nameFormItem.setValue(this.displayNameInput.getValue());
        });
    }

    protected getFormClass(): string {
        return 'project-id-step';
    }

    getData(): ProjectIdDialogStepData {
        return new ProjectIdDialogStepData()
            .setName(this.nameFormItem.getValue())
            .setDisplayName(this.displayNameInput.getValue().trim())
            .setDescription(this.descriptionInput.getValue().trim());
    }

    hasData(): boolean {
        if (!this.formItems) {
            return false;
        }

        const data: ProjectIdDialogStepData = this.getData();

        return !StringHelper.isBlank(data.getName()) ||
               !StringHelper.isBlank(data.getDisplayName()) ||
               !StringHelper.isBlank(data.getDescription());
    }

    isValid(): Q.Promise<boolean> {
        if (this.isNameOrDisplayNameMissing() || this.displayNameFormItem.getError() || this.nameFormItem.getError()) {
            return Q.resolve(false);
        }

        return this.isNameOccupied().then((isOccupied: boolean) => {
            this.nameFormItem.setNameIsOccupied(isOccupied);
            this.nameFormItem.validate(new ValidationResult(), true);

            return !isOccupied;
        });
    }

    private isNameOccupied(): Q.Promise<boolean> {
        return new ProjectListRequest().sendAndParse().then((projects: Project[]) => {
            return projects.some((p: Project) => p.getName() === this.nameFormItem.getValue().trim());
        });
    }

    private isNameOrDisplayNameMissing(): boolean {
        return StringHelper.isBlank(this.displayNameInput.getValue()) || StringHelper.isBlank(this.nameFormItem.getValue());
    }

    getName(): string {
        return 'projectName';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.name.description');
    }
}
