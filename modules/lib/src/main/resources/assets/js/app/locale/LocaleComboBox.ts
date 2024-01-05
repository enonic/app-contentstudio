import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionView';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {LocaleViewer} from './LocaleViewer';
import {FilterableListBoxWrapperWithSelectedView} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapperWithSelectedView';
import {LocaleListBox} from './LocaleListBox';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {LocaleLoader} from './LocaleLoader';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export interface LocaleComboBoxOptions {
    selectedOptionsView?: LocaleSelectedOptionsView;
    maxSelected?: number;
}

export class LocaleComboBox
    extends FilterableListBoxWrapperWithSelectedView<Locale> {

    private selectedLocale: Locale;

    private localeLoader: LocaleLoader;

    constructor(options?: LocaleComboBoxOptions) {
        super(new LocaleListBox(), {
            selectedOptionsView: options?.selectedOptionsView || new LocaleSelectedOptionsView(),
            maxSelected:  options?.maxSelected ?? 1,
            className: 'locale-combobox',
            filter: LocaleComboBox.filter
        });
    }

    protected initElements(): void {
        super.initElements();

        this.localeLoader = new LocaleLoader();
    }

    protected initListeners(): void {
        super.initListeners();

        this.localeLoader.onLoadedData((event: LoadedDataEvent<Locale>) => {
            if (this.listBox.getItemCount() === 0) {
                this.listBox.setItems(event.getData());
            }
            return null;
        });

        this.listBox.whenShown(() => {
            if (!this.localeLoader.isLoaded() && !this.localeLoader.isLoading()) {
                this.localeLoader.load().catch(DefaultErrorHandler.handle);
            }
        });

        this.onSelectionChanged((selection: SelectionChange<Locale>) => {
            this.selectedLocale = selection.selected?.length > 0 ? selection.selected[0] : null;
        });
    }

    createSelectedOption(item: Locale): Option<Locale> {
        return Option.create<Locale>()
            .setValue(item.getId())
            .setDisplayValue(item)
            .build();
    }

    setSelectedLocale(locale: string | Locale): void {
        if (!locale) {
            if (this.selectedLocale) {
                this.deselect(this.selectedLocale);
            }
        } else if (locale instanceof Locale) {
            this.select(locale);
        } else {
            if (this.localeLoader.isLoaded()) {
                this.selectLocaleById(locale);
            } else {
                this.localeLoader.load().then(() => {
                    this.selectLocaleById(locale);
                }).catch(DefaultErrorHandler.handle);
            }
        }
    }

    getSelectedLocate(): Locale {
        return this.selectedLocale;
    }

    openForTyping(): void {
        this.optionFilterInput.openForTyping();
    }

    getValue(): string {
        return this.selectedLocale?.getId() || null;
    }

    private selectLocaleById(id: string): void {
        const locale: Locale = this.getLocaleById(id);

        if (locale) {
            this.select(locale);
        }
    }

    private getLocaleById(id: string): Locale {
        return this.localeLoader.getResults().find((locale: Locale) => locale.getId() === id);
    }

    private static filter(locale: Locale, searchString: string): boolean {
        const str = searchString.trim().toLowerCase();

        return locale.getTag().toLowerCase().indexOf(str) >= 0 ||
               locale.getDisplayName().toLowerCase().indexOf(str) >= 0 ||
               locale.getLanguage().toLowerCase().indexOf(str) >= 0 ||
               locale.getDisplayLanguage().toLowerCase().indexOf(str) >= 0 ||
               locale.getVariant().toLowerCase().indexOf(str) >= 0 ||
               locale.getDisplayVariant().toLowerCase().indexOf(str) >= 0 ||
               locale.getCountry().toLowerCase().indexOf(str) >= 0 ||
               locale.getDisplayCountry().toLowerCase().indexOf(str) >= 0;
    }
}

export class LocaleSelectedOptionView
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

export class LocaleSelectedOptionsView
    extends BaseSelectedOptionsView<Locale> {

    constructor() {
        super('locale-selected-options-view');
    }

    createSelectedOption(option: Option<Locale>): SelectedOption<Locale> {
        const optionView = new LocaleSelectedOptionView(option);
        return new SelectedOption<Locale>(optionView, this.count());
    }
}

export class LocaleFormInputElWrapper
    extends FormInputEl {

    private readonly selector: LocaleComboBox;

    constructor(selector: LocaleComboBox) {
        super('div', 'content-selector-wrapper');

        this.selector = selector;
        this.appendChild(this.selector);
    }

    getComboBox(): LocaleComboBox {
        return this.selector;
    }

    getValue(): string {
        return this.selector.getValue();
    }
}
