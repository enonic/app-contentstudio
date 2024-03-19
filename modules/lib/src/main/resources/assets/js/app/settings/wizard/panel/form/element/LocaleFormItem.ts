import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {LocaleComboBox, LocaleFormInputElWrapper, LocaleSelectedOptionsView} from '../../../../../locale/LocaleComboBox';
import {ProjectFormItemBuilder} from './ProjectFormItem';
import {Flag} from '../../../../../locale/Flag';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {CopyFromParentFormItem} from './CopyFromParentFormItem';

export class LocaleFormItem
    extends CopyFromParentFormItem {

    constructor() {
        super(
            new ProjectFormItemBuilder(
                new LocaleFormInputElWrapper(new LocaleComboBox({selectedOptionsView: new LocaleWithFlagSelectedOptionsView()})))
                .setHelpText(i18n('settings.projects.language.helptext'))
                .setLabel(i18n('settings.projects.language.label')) as ProjectFormItemBuilder
        );

        this.addClass('locale-form-item');

        this.initListeners();
    }

    protected initListeners(): void {
        this.getLocaleCombobox().onSelectionChanged(() => {
            this.updateCopyButtonState();
        });
    }

    getLocaleCombobox(): LocaleComboBox {
        return (this.getInput() as LocaleFormInputElWrapper).getComboBox();
    }

    protected doCopyFromParent(): void {
        const parentProject = this.parentProjects?.[0];
        const parentLanguage: string = parentProject?.getLanguage() ?? '';
        const combobox: LocaleComboBox = this.getLocaleCombobox();

        combobox.setSelectedLocale(parentLanguage || '');

        if (combobox.countSelected() === 0) {
            combobox.openForTyping();
            combobox.setEnabled(true);
        }

        NotifyManager.get().showSuccess(
            i18n('settings.wizard.project.copy.success', i18n('field.lang'), parentProject?.getDisplayName()));
    }

    updateCopyButtonState(): void {
        const parentProject = this.parentProjects?.[0];
        const canCopy = !!parentProject && !ObjectHelper.stringEquals(parentProject?.getLanguage(), this.getLocaleCombobox().getValue());
        this.copyFromParentButton?.setEnabled(canCopy);
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
