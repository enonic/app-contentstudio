import {ProjectFormItemBuilder} from '../wizard/panel/form/element/ProjectFormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {LocaleComboBox, LocaleSelectedOptionsView} from '../../locale/LocaleComboBox';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectDialogStep} from './ProjectDialogStep';
import {Flag} from '../../locale/Flag';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';

export class ProjectLocaleDialogStep
    extends ProjectDialogStep {

    private localeCombobox: LocaleComboBox;

    protected createFormItems(): FormItem[] {
        return [this.createLocaleFormItem()];
    }

    private createLocaleFormItem(): FormItem {
        this.localeCombobox = <LocaleComboBox>LocaleComboBox.create()
            .setSelectedOptionsView(new LocaleWithFlagSelectedOptionsView())
            .setMaximumOccurrences(1)
            .build();

        return new ProjectFormItemBuilder(this.localeCombobox)
            .setHelpText(i18n('settings.projects.language.helptext'))
            .setLabel(i18n('field.lang'))
            .build();
    }

    isOptional(): boolean {
        return true;
    }

    protected listenItemsEvents(): void {
        super.listenItemsEvents();

        this.localeCombobox.onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    getData(): Object {
        return {
            locale: this.localeCombobox.getValue()
        };
    }

    hasData(): boolean {
        return !!this.localeCombobox.getValue();
    }

    getSelectedLocale(): Locale {
        return this.localeCombobox.getSelectedDisplayValues()[0];
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
}

class LocaleWithFlagSelectedOptionsView extends LocaleSelectedOptionsView {

    createSelectedOption(option: Option<Locale>): SelectedOption<Locale> {
        const selectedOption: SelectedOption<Locale> = super.createSelectedOption(option);

        selectedOption.getOptionView().prependChild(new Flag(option.getDisplayValue().getLanguage()));

        return selectedOption;
    }
}
