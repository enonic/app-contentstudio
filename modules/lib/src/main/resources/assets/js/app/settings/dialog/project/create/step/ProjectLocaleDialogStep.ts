import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {TextInput} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {LocaleComboBox} from '../../../../../locale/LocaleComboBox';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectDialogStep} from './ProjectDialogStep';
import {LocaleFormItem} from '../../../../wizard/panel/form/element/LocaleFormItem';
import {Project} from '../../../../data/project/Project';
import {ProjectLocaleDialogStepData} from '../data/ProjectLocaleDialogStepData';
import {ProjectFormItem, ProjectFormItemBuilder} from '../../../../wizard/panel/form/element/ProjectFormItem';

export class ProjectLocaleDialogStep
    extends ProjectDialogStep {

    private timeZoneInput: TextInput;

    protected createFormItems(): FormItem[] {
        return [new LocaleFormItem(), this.createTimeZoneFormItem()];
    }

    isOptional(): boolean {
        return true;
    }

    protected initEventListeners(): void {
        super.initEventListeners();

        this.getLocaleCombobox().onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    private createTimeZoneFormItem(): FormItem {
        this.timeZoneInput = new TextInput();

        return <ProjectFormItem>new ProjectFormItemBuilder(this.timeZoneInput).setLabel(i18n('field.timezone')).build();
    }

    setParentProject(value: Project) {
        this.getFormItem().setParentProject(value);
    }

    getData(): ProjectLocaleDialogStepData {
        return new ProjectLocaleDialogStepData().setLocale(this.getLocaleCombobox().getSelectedDisplayValues()[0]).setTimeZone(
            this.timeZoneInput.getValue().trim());
    }

    hasData(): boolean {
        return !!this.getLocaleCombobox().getValue();
    }

    protected getFormClass(): string {
        return 'project-language-step';
    }

    getName(): string {
        return 'projectLanguage';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.language.description');
    }

    private getLocaleCombobox(): LocaleComboBox {
        return this.getFormItem().getLocaleCombobox();
    }

    private getFormItem(): LocaleFormItem {
        return <LocaleFormItem>this.formItems[0];
    }
}
