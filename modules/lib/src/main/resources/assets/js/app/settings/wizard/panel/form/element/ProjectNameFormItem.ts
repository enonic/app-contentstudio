import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {TextInput} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';

export class ProjectNameFormItem
    extends ProjectFormItem {

    private static PROJECT_NAME_CHARS: RegExp = /^([a-z0-9-])([a-z0-9_-])*$/;

    constructor() {
        super(<ProjectFormItemBuilder>new ProjectFormItemBuilder(new TextInput())
            .setHelpText(i18n('settings.projects.name.helptext'))
            .setValidator(Validators.required)
            .setLabel(i18n('settings.field.project.name')));

        this.setValidator(this.validateProjectName.bind(this));
        this.addClass('name-form-item');
    }

    private validateProjectName(): string {
        return !this.isProjectNameValid() ? i18n('field.value.invalid') : undefined;
    }

    isProjectNameValid(): boolean {
        const projectNameRegExp: RegExp = ProjectNameFormItem.PROJECT_NAME_CHARS;
        return projectNameRegExp.test(this.getProjectNameInput().getValue());
    }

    getProjectNameInput(): TextInput {
        return <TextInput>this.getInput();
    }

    getValue(): string {
        return this.getProjectNameInput().getValue();
    }

    setValue(value: string, silent?: boolean): void {
        this.getProjectNameInput().setValue(this.prettify(value), silent);
    }

    private prettify(value: string): string {
        const prettified: string = NamePrettyfier.prettify(value)
            .replace(/^[^a-z0-9]+/ig, '')
            .replace(/[^a-z0-9]+$/ig, '')
            .replace(/\./g, '');

        return prettified;
    }
}
