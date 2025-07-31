import * as $ from 'jquery';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectionToolbar} from './SelectionToolbar';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {BaseGallerySelectedOptionView} from './BaseGallerySelectedOptionView';

export interface SelectedOptionsViewConfig {
    editable?: boolean;
    readonly?: boolean;
}

export abstract class BaseGallerySelectedOptionsView<T> extends BaseSelectedOptionsView<T> {
    protected activeOption: SelectedOption<T>;
    protected selection: SelectedOption<T>[] = [];
    protected toolbar: SelectionToolbar;
    private mouseClickListener: (event: MouseEvent) => void;

    constructor(config: SelectedOptionsViewConfig) {
        super();

        this.readonly = config.readonly || false;
        if (!config.readonly) {
            this.initAndAppendSelectionToolbar(config.editable);
            this.addOptionMovedEventHandler();
        }
    }

    private initAndAppendSelectionToolbar(editable: boolean) {
        this.toolbar = new SelectionToolbar({editable});
        this.toolbar.hide();

        this.toolbar.onRemoveClicked(() => this.removeSelectedOptions(this.selection));

        this.onRendered(() => {
            this.toolbar.insertAfterEl(this);

            const scrollableParentEl = $(this.getHTMLElement()).scrollParent()[0];
            const scrollableParent = Element.fromHtmlElement(scrollableParentEl);
            scrollableParent.onScroll(() => this.toolbar.update());
        });
    }

    private addOptionMovedEventHandler() {
        this.onOptionMoved((moved: SelectedOption<T>, fromIndex: number) => {
            const selectedOptionMoved = moved.getOptionView() as BaseGallerySelectedOptionView<T>;
            if (selectedOptionMoved.hasClass('editing')) {
                selectedOptionMoved.getCheckbox().giveFocus();
            }
        });
    }

    private handleOptionViewChecked(checked: boolean, option: SelectedOption<T>,
                                    optionView: BaseGallerySelectedOptionView<T>) {
        if (checked) {
            if (this.selection.indexOf(option) < 0) {
                this.selection.push(option);
            }
        } else {
            let index = this.selection.indexOf(option);
            if (index > -1) {
                this.selection.splice(index, 1);
            }
        }
        optionView.getCheckbox().giveFocus();
        this.updateSelectionToolbarLayout();
    }

    addOption(option: Option<T>, silent: boolean = false, keyCode: number): boolean {
        if (!super.addOption(option, silent, keyCode)) {
            return false;
        }

        const selectedOption = this.getByOption(option);
        const selectedOptionView = this.getByOption(option).getOptionView() as BaseGallerySelectedOptionView<T>;
        selectedOptionView.onChecked((_view: BaseGallerySelectedOptionView<T>, checked: boolean) => {
            this.handleOptionViewChecked(checked, selectedOption, selectedOptionView);
        });

        if (this.readonly) {
            option.setReadOnly(true);
            selectedOptionView.setReadonly(true);
        }

        return true;
    }

    removeOption(optionToRemove: Option<T>, silent: boolean = false) {
        const selectedOption = this.getByOption(optionToRemove);

        this.selection = this.selection.filter(
            (option: SelectedOption<T>) => option.getOption().getValue() !== selectedOption.getOption().getValue()
        );

        super.removeOption(optionToRemove, silent);
    }

    removeSelectedOptions(options: SelectedOption<T>[]) {
        options
            .map((option: SelectedOption<T>) => option.getOption())
            .forEach((option) => this.removeOption(option));
        this.selection.length = 0;
        this.updateSelectionToolbarLayout();
        this.resetActiveOption();
    }

    protected resetActiveOption() {
        if (this.activeOption) {
            const activeOptionView = this.activeOption.getOptionView() as BaseGallerySelectedOptionView<T>;
            activeOptionView.removeClass('editing first-in-row last-in-row');
            this.activeOption = null;
        }
        Body.get().unClicked(this.mouseClickListener);
    }

    protected updateSelectionToolbarLayout() {
        const showToolbar = this.selection.length > 0;
        this.toolbar.setVisible(showToolbar);
        if (showToolbar) {
            this.toolbar.setSelectionCount(this.selection.length, this.getNumberOfEditableOptions());
        }
    }

    protected abstract getNumberOfEditableOptions(): number;
}
