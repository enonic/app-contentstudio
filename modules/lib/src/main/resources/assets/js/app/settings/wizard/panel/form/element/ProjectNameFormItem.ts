import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {TextInput} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';

export class ProjectNameFormItem
    extends ProjectFormItem {

    private static PROJECT_NAME_CHARS: RegExp = /^([a-z0-9])([a-z0-9_-])*([a-z0-9])$/;

    private isNameOccupied: boolean;

    constructor() {
        super(<ProjectFormItemBuilder>new ProjectFormItemBuilder(new NameTextInput())
            .setHelpText(i18n('settings.projects.name.helptext'))
            .setValidator(Validators.required)
            .setLabel(i18n('settings.field.project.name')));

        this.setValidator(this.validateProjectName.bind(this));
        this.addClass('name-form-item');
    }

    private validateProjectName(): string {
        if (StringHelper.isBlank(this.getValue())) {
            return i18n('field.value.required');
        }

        if (!this.isProjectNameValid()) {
            return i18n('field.value.invalid');
        }

        if (this.isNameOccupied) {
            return i18n('settings.project.name.occupied');
        }

        return !this.isProjectNameValid() ? i18n('field.value.invalid') : undefined;
    }

    isProjectNameValid(): boolean {
        const projectNameRegExp: RegExp = ProjectNameFormItem.PROJECT_NAME_CHARS;
        return projectNameRegExp.test(this.getValue());
    }

    getProjectNameInput(): NameTextInput {
        return <NameTextInput>this.getInput();
    }

    getValue(): string {
        return this.getProjectNameInput().getValue();
    }

    setValue(value: string, silent?: boolean): void {
        this.getProjectNameInput().setValue(value, silent);
    }

    setNameIsOccupied(value: boolean): void {
        this.isNameOccupied = value;
    }
}

class NameTextInput extends TextInput {

    protected handleInput() {
        this.setValue(this.getValue(), false, true);
    }

    setValue(value: string, silent?: boolean, userInput?: boolean): FormInputEl {
        return super.setValue(this.prettify(value, userInput), silent, userInput);
    }

    private prettify(value: string, userInput?: boolean): string {
        if (userInput && value.endsWith('-')) { // allowing dash to be used
            return value;
        }

        const prettified: string = NamePrettyfier.prettify(value)
            .replace(/\./g, '');

        return prettified;
    }
}
