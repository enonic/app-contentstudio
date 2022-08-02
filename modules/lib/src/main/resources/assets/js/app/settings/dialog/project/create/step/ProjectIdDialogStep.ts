import {ProjectFormItem, ProjectFormItemBuilder} from '../../../../wizard/panel/form/element/ProjectFormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {TextInput} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {ProjectDialogStep} from './ProjectDialogStep';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import * as Q from 'q';
import {ValidationResult} from '@enonic/lib-admin-ui/ui/form/ValidationResult';
import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ProjectListRequest} from '../../../../resource/ProjectListRequest';
import {Project} from '../../../../data/project/Project';
import {NameFormItem} from '../../../../wizard/panel/form/element/NameFormItem';

export interface ProjectIdStepData {
    name: string;
    displayName: string;
    description: string;
}

export class ProjectIdDialogStep
    extends ProjectDialogStep {

    private displayNameInput: TextInput;

    private displayNameFormItem: FormItem;

    private nameFormItem: NameFormItem;

    private descriptionInput: TextInput;

    private nameOccupied: boolean;

    setDisplayName(value: string, silent?: boolean): void {
        this.displayNameInput.setValue(value, silent);
    }

    setName(value: string, silent?: boolean): void {
        this.nameFormItem.setValue(value, silent);
    }

    setDescription(value: string, silent?: boolean): void {
        this.descriptionInput.setValue(value, silent);
    }

    protected createFormItems(): FormItem[] {
        return [this.createProjectDisplayNameFormItem(), this.createProjectNameFormItem(), this.createDescriptionFormItem()];
    }

    private createProjectDisplayNameFormItem(): FormItem {
        this.displayNameInput = new TextInput();

        this.displayNameFormItem = <ProjectFormItem>new ProjectFormItemBuilder(this.displayNameInput)
            .setLabel(i18n('field.displayName'))
            .setValidator(Validators.required)
            .build();

        return this.displayNameFormItem;
    }

    private createProjectNameFormItem(): FormItem {
        this.nameFormItem = new NameFormItem();
        return this.nameFormItem;
    }

    private createDescriptionFormItem(): FormItem {
        this.descriptionInput = new TextInput();

        return <ProjectFormItem>new ProjectFormItemBuilder(this.descriptionInput).setLabel(i18n('field.description')).build();
    }

    isOptional(): boolean {
        return false;
    }

    protected listenItemsEvents(): void {
        super.listenItemsEvents();

        this.nameFormItem.getProjectNameInput().onValueChanged(() => {
            this.nameOccupied = false;
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

    getData(): ProjectIdStepData {
        return {
            name: this.nameFormItem.getValue(),
            displayName: this.displayNameInput.getValue(),
            description: this.descriptionInput.getValue() || ''
        };
    }

    isValid(): Q.Promise<boolean> {
        if (this.isNameOrDisplayNameMissing() || this.displayNameFormItem.getError() || this.nameFormItem.getError()) {
            return Q.resolve(false);
        }

        return this.isNameOccupied().then((isOccupied: boolean) => {
            this.nameOccupied = isOccupied;
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
