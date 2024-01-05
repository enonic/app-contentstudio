import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {RichComboBox, RichComboBoxBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichComboBox';
import {MacrosLoader} from './resource/MacrosLoader';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {RichSelectedOptionView, RichSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichSelectedOptionView';
import {MacroDescriptor} from '@enonic/lib-admin-ui/macro/MacroDescriptor';
import {MacroViewer} from './MacroViewer';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {SelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {FilterableListBoxWrapperWithSelectedView} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapperWithSelectedView';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {MacroListBox} from './MacroListBox';
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {LocaleComboBox} from '../locale/LocaleComboBox';

export class MacroComboBox
    extends FilterableListBoxWrapperWithSelectedView<MacroDescriptor> {

    private loader: MacrosLoader;

    private selectedMacro: MacroDescriptor;

    constructor() {
        super(new MacroListBox(), {
            selectedOptionsView: new MacroSelectedOptionsView(),
            className: 'macro-combobox',
            maxSelected: 1,
            filter: MacroComboBox.filter,
        });
    }

    protected initElements(): void {
        super.initElements();

        this.loader = new MacrosLoader();
    }

    protected initListeners(): void {
        super.initListeners();

        this.loader.onLoadedData((event: LoadedDataEvent<MacroDescriptor>) => {
            if (this.listBox.getItemCount() === 0) {
                this.listBox.setItems(event.getData());
            }
            return null;
        });

        this.listBox.whenShown(() => {
            if (!this.loader.isLoaded() && !this.loader.isLoading()) {
                this.loader.load().catch(DefaultErrorHandler.handle);
            }
        });

        this.onSelectionChanged((selection: SelectionChange<MacroDescriptor>) => {
            this.selectedMacro = selection.selected?.length > 0 ? selection.selected[0] : null;
        });
    }

    getLoader(): MacrosLoader {
        return this.loader;
    }

    setSelectedMacro(macro?: MacroDescriptor): void {
        if (!macro) {
            if (this.selectedMacro) {
                this.deselect(this.selectedMacro);
            }
        } else {
            this.select(macro);
        }
    }

    getValue(): string {
        return this.selectedMacro?.getKey().getRefString() || null;
    }

    createSelectedOption(item: MacroDescriptor): Option<MacroDescriptor> {
        return Option.create<MacroDescriptor>()
            .setValue(item.getKey().getRefString())
            .setDisplayValue(item)
            .build();
    }

    private static filter(macro: MacroDescriptor, searchString: string): boolean {
        const str = searchString.trim().toLowerCase();

        return macro.getDisplayName().toLowerCase().indexOf(str.toLowerCase()) >= 0;
    }
}

export class MacroSelectedOptionsView
    extends BaseSelectedOptionsView<MacroDescriptor> {

    createSelectedOption(option: Option<MacroDescriptor>): SelectedOption<MacroDescriptor> {
        let optionView = new MacroSelectedOptionView(option);
        return new SelectedOption<MacroDescriptor>(optionView, this.count());
    }
}

export class MacroSelectedOptionView
    extends RichSelectedOptionView<MacroDescriptor> {

    constructor(option: Option<MacroDescriptor>) {
        super(new RichSelectedOptionViewBuilder<MacroDescriptor>().setOption(option) as RichSelectedOptionViewBuilder<MacroDescriptor>);
    }

    resolveIconUrl(macroDescriptor: MacroDescriptor): string {
        return macroDescriptor.getIconUrl();
    }

    resolveTitle(macroDescriptor: MacroDescriptor): string {
        return macroDescriptor.getDisplayName();
    }

    resolveSubTitle(macroDescriptor: MacroDescriptor): string {
        return macroDescriptor.getDescription();
    }
}

export class MacroFormInputElWrapper
    extends FormInputEl {

    private readonly selector: MacroComboBox;

    constructor(selector: MacroComboBox) {
        super('div', 'macro-selector-wrapper');

        this.selector = selector;
        this.appendChild(this.selector);
    }

    getComboBox(): MacroComboBox {
        return this.selector;
    }

    getValue(): string {
        return this.selector.getValue();
    }
}
