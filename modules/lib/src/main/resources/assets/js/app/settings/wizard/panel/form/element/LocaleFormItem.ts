import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {LocaleComboBox, LocaleSelectedOptionsView} from '../../../../../locale/LocaleComboBox';
import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {Flag} from '../../../../../locale/Flag';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';

export class LocaleFormItem
    extends ProjectFormItem {

    constructor() {
        super(<ProjectFormItemBuilder>new ProjectFormItemBuilder(
            LocaleComboBox.create().setSelectedOptionsView(new LocaleWithFlagSelectedOptionsView()).setMaximumOccurrences(1).build())
            .setHelpText(i18n('settings.projects.language.helptext'))
            .setLabel(i18n('field.lang')));

        this.addClass('locale-form-item');
    }

    getLocaleCombobox(): LocaleComboBox {
        return <LocaleComboBox>this.getInput()
    }
}

class LocaleWithFlagSelectedOptionsView
    extends LocaleSelectedOptionsView {

    createSelectedOption(option: Option<Locale>): SelectedOption<Locale> {
        const selectedOption: SelectedOption<Locale> = super.createSelectedOption(option);

        selectedOption.getOptionView().prependChild(new Flag(option.getDisplayValue().getLanguage()));

        return selectedOption;
    }
}
