import {ProjectFormItem, ProjectFormItemBuilder} from '../wizard/panel/form/element/ProjectFormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {TextInput} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {ProjectDialogStep} from './ProjectDialogStep';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import * as Q from 'q';
import {ValidationError, ValidationResult} from '@enonic/lib-admin-ui/ui/form/ValidationResult';
import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ProjectList} from '../../project/list/ProjectList';
import {ProjectListRequest} from '../resource/ProjectListRequest';
import {Project} from '../data/project/Project';
import {ProjectContext} from '../../project/ProjectContext';
import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';

export interface ProjectIdStepData {
    name: string;
    displayName: string;
    description: string;
}

export class ProjectIdDialogStep
    extends ProjectDialogStep {

    private static PROJECT_NAME_CHARS: RegExp = /^([a-z0-9-])([a-z0-9_-])*$/;

    private displayNameInput: TextInput;

    private displayNameFormItem: FormItem;

    private nameInput: TextInput;

    private nameFormItem: FormItem;

    private descriptionInput: TextInput;

    private nameOccupied: boolean;

    setDisplayName(value: string, silent?: boolean): void {
        this.displayNameInput.setValue(value, silent);
    }

    setName(value: string, silent?: boolean): void {
        this.nameInput.setValue(value, silent);
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
        this.nameInput = new TextInput();

        this.nameFormItem = <ProjectFormItem>new ProjectFormItemBuilder(this.nameInput)
            .setHelpText(i18n('settings.projects.name.helptext'))
            .setValidator(this.validateProjectName.bind(this))
            .setLabel(i18n('settings.field.project.name'))
            .build();

        this.nameFormItem.getLabel().addClass('required');

        return this.nameFormItem;
    }

    private validateProjectName(): string {
        if (!this.isProjectNameValid()) {
            return i18n('field.value.invalid');
        }

        if (this.nameOccupied) {
            return i18n('dialog.project.wizard.step.id.exists');
        }

        return null;
    }

    private isProjectNameValid(): boolean {
        const projectNameRegExp: RegExp = ProjectIdDialogStep.PROJECT_NAME_CHARS;
        return projectNameRegExp.test(this.nameInput.getValue());
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

        this.nameInput.onValueChanged(() => {
            this.nameOccupied = false;
            this.nameFormItem.validate(new ValidationResult(), true);
            this.notifyDataChanged();
        });

        this.displayNameInput.onValueChanged(() => {
            this.displayNameFormItem.validate(new ValidationResult(), true);
            this.nameInput.setValue(this.prettify(this.displayNameInput.getValue()));
        });
    }

    private prettify(value: string): string {
        const prettified: string = NamePrettyfier.prettify(value)
            .replace(/^[^a-z0-9]+/ig, '')
            .replace(/[^a-z0-9]+$/ig, '')
            .replace(/\./g, '');

        return prettified;
    }

    protected getFormClass(): string {
        return 'project-id-step';
    }

    getData(): ProjectIdStepData {
        return {
            name: this.nameInput.getValue(),
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
            return projects.some((p: Project) => p.getName() === this.nameInput.getValue().trim());
        });
    }

    private isNameOrDisplayNameMissing(): boolean {
        return StringHelper.isBlank(this.displayNameInput.getValue()) || StringHelper.isBlank(this.nameInput.getValue());
    }

    getName(): string {
        return 'projectName';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.name.description');
    }
}
