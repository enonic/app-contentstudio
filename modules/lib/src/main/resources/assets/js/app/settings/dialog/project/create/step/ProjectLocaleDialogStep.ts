import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {LocaleComboBox} from '../../../../../locale/LocaleComboBox';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectDialogStep} from './ProjectDialogStep';
import {LocaleFormItem} from '../../../../wizard/panel/form/element/LocaleFormItem';
import {ProjectLocaleDialogStepData} from '../data/ProjectLocaleDialogStepData';

export class ProjectLocaleDialogStep
    extends ProjectDialogStep {

    private localeFormItem: LocaleFormItem;

    createFormItems(): FormItem[] {
        this.localeFormItem = new LocaleFormItem();
        this.hasParentProjects() && this.localeFormItem.setParentProjects(this.getParentProjects());
        return [this.localeFormItem];
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

    getData(): ProjectLocaleDialogStepData {
        return new ProjectLocaleDialogStepData().setLocale(this.getLocaleCombobox()?.getSelectedDisplayValues()[0]);
    }

    hasData(): boolean {
        return !!this.getLocaleCombobox()?.getValue();
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
        return this.localeFormItem.getLocaleCombobox();
    }
}
