import {Option} from 'lib-admin-ui/ui/selector/Option';
import {Locale} from 'lib-admin-ui/locale/Locale';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {RichComboBox, RichComboBoxBuilder} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';
import {SelectedOptionView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionView';
import {BaseSelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {LocaleViewer} from './LocaleViewer';
import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {SelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {LocaleLoader} from './LocaleLoader';

export class LocaleComboBox
    extends RichComboBox<Locale> {
    constructor(builder: LocaleComboBoxBuilder = new LocaleComboBoxBuilder()) {
        super(builder);
        this.addClass('locale-combobox');
    }

    static create(): LocaleComboBoxBuilder {
        return new LocaleComboBoxBuilder();
    }

    clearSelection(forceClear: boolean = false) {
        this.getLoader().search('');
        super.clearSelection(forceClear);
    }
}

class LocaleSelectedOptionView
    extends LocaleViewer
    implements SelectedOptionView<Locale> {

    private option: Option<Locale>;

    constructor(option: Option<Locale>) {
        super('selected-option locale-selected-option-view');
        this.setOption(option);
        this.appendRemoveButton();
    }

    setOption(option: Option<Locale>) {
        this.option = option;
        this.setObject(option.getDisplayValue());
    }

    getOption(): Option<Locale> {
        return this.option;
    }

}

class LocaleSelectedOptionsView
    extends BaseSelectedOptionsView<Locale> {

    constructor() {
        super('locale-selected-options-view');
    }

    createSelectedOption(option: Option<Locale>): SelectedOption<Locale> {
        let optionView = new LocaleSelectedOptionView(option);
        return new SelectedOption<Locale>(optionView, this.count());
    }

}

export class LocaleComboBoxBuilder
    extends RichComboBoxBuilder<Locale> {

    rowHeight: number = 30;

    comboBoxName: string = 'localeSelector';

    loader: LocaleLoader = new LocaleLoader();

    value: string;

    optionDisplayValueViewer: Viewer<Locale> = new LocaleViewer();

    delayedInputValueChangedHandling: number = 500;

    selectedOptionsView: SelectedOptionsView<Locale> = new LocaleSelectedOptionsView();

    build(): LocaleComboBox {
        return new LocaleComboBox(this);
    }

}
