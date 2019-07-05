import ComboBox = api.ui.selector.combobox.ComboBox;
import SelectedOptionsView = api.ui.selector.combobox.SelectedOptionsView;
import Option = api.ui.selector.Option;
import BaseSelectedOptionsView = api.ui.selector.combobox.BaseSelectedOptionsView;
import i18n = api.util.i18n;
import Element = api.dom.Element;
import DivEl = api.dom.DivEl;
import SpanEl = api.dom.SpanEl;
import DefaultOptionDisplayValueViewer = api.ui.selector.DefaultOptionDisplayValueViewer;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;
import SelectedOption = api.ui.selector.combobox.SelectedOption;

export class RowSelector
    extends DivEl {

    private comboBox: ComboBox<string>;

    private selectedOptionsView: SelectedOptionsView<string>;

    constructor(title?: string) {
        super();

        this.addClass('row-selector');

        this.initElements(title);
    }

    protected initElements(title?: string) {
        const titleEl = new SpanEl('title');
        titleEl.setHtml(title == null ? i18n('field.rowselector.title') : title);

        this.selectedOptionsView = new RowSelectedOptionsView();
        this.selectedOptionsView.setEditable(false);

        this.comboBox = new ComboBox<string>('rowSelector', {
            selectedOptionsView: this.selectedOptionsView,
            optionDisplayValueViewer: new RowOptionDisplayValueViewer(),
            hideComboBoxWhenMaxReached: true,
            maximumOccurrences: 1,
        });

        this.comboBox.onOptionDeselected(() => {
            const hasOptions = this.comboBox.getOptionCount() > 0;
            const hasSelectedOptions = this.comboBox.countSelectedOptions() > 0;
            if (hasOptions && !hasSelectedOptions) {
                this.comboBox.showDropdown();
                this.comboBox.giveFocus();
            }
        });

        this.appendChildren<Element>(titleEl, this.comboBox, this.selectedOptionsView);
    }

    setOptions(options: Option<string>[], saveSelection?: boolean) {
        this.comboBox.setOptions(options, saveSelection)
    }

    createOptions(options: string[]): Option<string>[] {
        return options.map((displayValue: string, index: number) => {
            return <Option<string>>{
                value: index.toString(),
                displayValue,
                indices: [displayValue],
                selectable: true,
                readOnly: false
            }
        });
    }

    clearSelection() {
        this.comboBox.clearSelection();
    }

    setSelection(option: Option<string>, select: boolean = true, silent?: boolean) {
        if (select) {
            this.comboBox.selectOption(option, silent)
        } else {
            this.comboBox.deselectOption(option, silent);
        }
    }

    updateOptionValue(option: Option<string>, value: string, selectable?: boolean): Option<string> {
        const newOption = <Option<string>>{
            value: option.value,
            displayValue: value,
            indices: [value],
            selectable: selectable != null ? selectable : option.selectable,
            readOnly: selectable != null ? !selectable : option.readOnly
        };

        this.comboBox.updateOption(option, newOption);

        return newOption;
    }

    onOptionSelected(listener: (event: SelectedOptionEvent<string>) => void) {
        this.comboBox.onOptionSelected(listener);
    }

    onOptionDeselected(listener: (event: SelectedOptionEvent<string>) => void) {
        this.comboBox.onOptionDeselected(listener);
    }
}

class RowSelectedOptionsView
    extends BaseSelectedOptionsView<string> {
    createSelectedOption(option: Option<string>): SelectedOption<string> {
        return super.createSelectedOption(option);
    }

    updateOption(optionToUpdate: Option<string>, newOption: Option<string>) {
        super.updateOption(optionToUpdate, newOption);
    }
}

class RowOptionDisplayValueViewer
    extends DefaultOptionDisplayValueViewer {
    setObject(displayName: string) {
        const withoutNumber = !(/\(\d+\)$/.test(displayName));
        this.toggleClass('without-number', withoutNumber);
        return super.setObject(displayName);
    }
}
