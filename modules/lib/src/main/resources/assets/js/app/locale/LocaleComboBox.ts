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

export interface LocaleComboBoxOptions {
    selectedOptionsView?: LocaleSelectedOptionsView;
    maxSelected?: number;
}

export class LocaleComboBox
    extends FilterableListBoxWrapperWithSelectedView<Locale> {

    private selectedLocale: Locale;

    private loader: LocaleLoader;

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

        this.loader = new LocaleLoader();
    }

    protected initListeners(): void {
        super.initListeners();

        this.loader.onLoadingData(() => {
           this.loadMask.show();
        });

        this.loader.onLoadedData((event: LoadedDataEvent<Locale>) => {
            if (this.listBox.getItemCount() === 0) {
                this.listBox.setItems(event.getData());
            }

            this.loadMask.hide();
            return null;
        });

        this.loader.onErrorOccurred(() => {
           this.loadMask.hide();
        });

        this.listBox.whenShown(() => {
            if (!this.loader.isLoaded() && !this.loader.isLoading()) {
                this.loader.load().catch(DefaultErrorHandler.handle);
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
            if (this.loader.isLoaded()) {
                this.selectLocaleById(locale);
            } else {
                this.loader.load().then(() => {
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
        return this.loader.getResults().find((locale: Locale) => locale.getId() === id);
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
               locale.getDisplayCountry().toLowerCase().indexOf(str) >= 0 ||
               LocaleViewer.makeDisplayName(locale).toLowerCase().indexOf(str) >= 0;

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
        super('div', 'locale-selector-wrapper');

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
