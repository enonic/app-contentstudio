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

    private title: SpanEl;

    private comboBox: ComboBox<string>;

    private selectedOptionsView: SelectedOptionsView<string>;

    constructor(title?: string) {
        super('row-selector');

        this.initElements(title);
    }

    protected initElements(title?: string) {
        this.title = new SpanEl('title');
        this.title.setHtml(title == null ? i18n('field.rowselector.title') : title);

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
    }

    setOptions(options: Option<string>[], saveSelection?: boolean) {
        this.comboBox.setOptions(options, saveSelection);
    }

    static createOptions(options: string[]): Option<string>[] {
        return options.map((displayValue: string, index: number) => {
            return <Option<string>>{
                value: index.toString(),
                displayValue,
                indices: [displayValue],
                selectable: true
            };
        });
    }

    clearSelection() {
        this.comboBox.clearSelection();
    }

    select(option: Option<string>) {
        this.comboBox.selectOption(option, true);
    }

    deselect(option: Option<string>) {
        this.comboBox.deselectOption(option, true);
    }

    setSelection(option: Option<string>, select: boolean = true) {
        if (select) {
            this.select(option);
        } else {
            this.deselect(option);
        }
    }

    updateOptionValue(option: Option<string>, value: string, selectable?: boolean): Option<string> {
        const newOption = <Option<string>>{
            value: option.value,
            displayValue: value,
            indices: [value],
            selectable: selectable != null ? selectable : option.selectable
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

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren<Element>(this.title, this.comboBox, this.selectedOptionsView);

            return rendered;
        });
    }
}

class RowSelectedOptionsView
    extends BaseSelectedOptionsView<string> {

    constructor() {
        super('row-selected-options-view');
    }

    createSelectedOption(option: Option<string>): SelectedOption<string> {
        const selectedOption = super.createSelectedOption(option);

        const removeHandler = () => {
            this.removeOption(selectedOption.getOption());
        };

        selectedOption.getOptionView().onClicked(removeHandler);
        selectedOption.getOptionView().onRemoved(() => {
            selectedOption.getOptionView().unClicked(removeHandler);
        });

        return selectedOption;
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
