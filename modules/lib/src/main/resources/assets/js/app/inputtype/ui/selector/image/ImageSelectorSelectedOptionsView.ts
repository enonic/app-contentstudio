import * as $ from 'jquery';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionEvent} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {ImageSelectorSelectedOptionView} from './ImageSelectorSelectedOptionView';
import {SelectionToolbar} from './SelectionToolbar';
import {MediaTreeSelectorItem} from '../media/MediaTreeSelectorItem';
import {ContentSelectedOptionsView} from '../ContentComboBox';

export class ImageSelectorSelectedOptionsView
    extends ContentSelectedOptionsView {

    private activeOption: SelectedOption<MediaTreeSelectorItem>;

    private selection: SelectedOption<MediaTreeSelectorItem>[] = [];

    private toolbar: SelectionToolbar;

    private editSelectedOptionsListeners: ((option: SelectedOption<MediaTreeSelectorItem>[]) => void)[] = [];

    private removeSelectedOptionsListeners: ((option: SelectedOption<MediaTreeSelectorItem>[]) => void)[] = [];

    private mouseClickListener: (event: MouseEvent) => void;

    private clickDisabled: boolean = false;

    readonly stickyToolbarCls: string = 'image-selector-toolbar-sticky';

    constructor() {
        super('image-selector-selected-options-view');

        this.setOccurrencesSortable(true);

        this.initAndAppendSelectionToolbar();

        this.addOptionMovedEventHandler();
    }

    private initAndAppendSelectionToolbar() {
        this.toolbar = new SelectionToolbar();
        this.toolbar.hide();
        this.toolbar.onEditClicked(() => {
            this.notifyEditSelectedOptions(this.selection);
        });
        this.toolbar.onRemoveClicked(() => {
            this.removeSelectedOptions(this.selection);
        });
        this.toolbar.onShown(() => this.updateStickyToolbar());
        this.toolbar.onHidden(() => this.toolbar.removeClass(this.stickyToolbarCls));
        this.onRendered(() => {
            this.toolbar.insertAfterEl(this);

            const scrollableParentEl = $(this.getHTMLElement()).scrollParent()[0];
            const scrollableParent = Element.fromHtmlElement(scrollableParentEl);
            scrollableParent.onScroll(() => this.updateStickyToolbar());
        });
    }

    private addOptionMovedEventHandler() {
        //when dragging selected image in chrome it looses focus; bringing focus back
        this.onOptionMoved((moved: SelectedOption<MediaTreeSelectorItem>, fromIndex: number) => {
            let selectedOptionMoved: boolean = moved.getOptionView().hasClass('editing');

            if (selectedOptionMoved) {
                (moved.getOptionView() as ImageSelectorSelectedOptionView).getCheckbox().giveFocus();
            }
        });
    }

    protected resizeHandler(): void {
        this.updateStickyToolbar(true);
    }

    protected handleDnDStop(): void {
        this.temporarilyDisableClickEvent(); //FF triggers unwanted click event after dragging sortable
    }

    private temporarilyDisableClickEvent() {
        this.clickDisabled = true;
        setTimeout(() => this.clickDisabled = false, 50);
    }

    removeOption(optionToRemove: Option<MediaTreeSelectorItem>, silent: boolean = false) {
        const selectedOption = this.getByOption(optionToRemove);

        this.selection = this.selection.filter((option: SelectedOption<MediaTreeSelectorItem>) => {
            return option.getOption().getValue() !== selectedOption.getOption().getValue();
        });

        this.updateSelectionToolbarLayout();

        super.removeOption(optionToRemove, silent);
    }

    removeSelectedOptions(options: SelectedOption<MediaTreeSelectorItem>[]) {
        this.notifyRemoveSelectedOptions(options);
        // clear the selection;
        this.selection.length = 0;
        this.updateSelectionToolbarLayout();
        this.resetActiveOption();
    }

    createSelectedOption(option: Option<MediaTreeSelectorItem>): SelectedOption<MediaTreeSelectorItem> {
        return new SelectedOption<MediaTreeSelectorItem>(new ImageSelectorSelectedOptionView(option), this.count());
    }

    addOption(option: Option<MediaTreeSelectorItem>, silent: boolean = false, keyCode: number = -1): boolean {
        if (this.maximumOccurrencesReached()) {
            return false;
        }

        const selectedOption = this.getByOption(option);
        if (!selectedOption) {
            this.addNewOption(option, silent, keyCode);
            return true;
        }

        const displayValue: MediaTreeSelectorItem = selectedOption.getOption().getDisplayValue() as MediaTreeSelectorItem;
        if (displayValue.getContentSummary() == null && option.getDisplayValue().getContentSummary() != null) {
            this.updateUploadedOption(option);
            return true;
        }

        return false;
    }

    private addNewOption(option: Option<MediaTreeSelectorItem>, silent: boolean, keyCode: number = -1) {
        const selectedOption: SelectedOption<MediaTreeSelectorItem> = this.createSelectedOption(option);
        this.getSelectedOptions().push(selectedOption);

        const optionView: ImageSelectorSelectedOptionView = selectedOption.getOptionView() as ImageSelectorSelectedOptionView;

        optionView.onRendered(() => {
            this.handleOptionViewRendered(selectedOption, optionView);
            optionView.setOption(option);
        });

        // moved onChecked handler from handleOptionViewRendered because onChecked may be triggered before (on file upload for ex.)
        optionView.onChecked(
            (_view: ImageSelectorSelectedOptionView, checked: boolean) => this.handleOptionViewChecked(checked, selectedOption,
                optionView));

        this.appendChild(optionView);
        this.updateStickyToolbar();

        if (this.readonly) {
            option.setReadOnly(true);
            optionView.setReadonly(true);
        }

        if (!silent) {
            this.notifyOptionSelected(new SelectedOptionEvent(selectedOption, keyCode));
        }
    }

    updateUploadedOption(option: Option<MediaTreeSelectorItem>) {
        let selectedOption = this.getByOption(option);
        let content = option.getDisplayValue().getContentSummary();

        let newOption = Option.create<MediaTreeSelectorItem>()
                .setValue(content.getId())
                .setDisplayValue(new MediaTreeSelectorItem(content))
                .build();

        selectedOption.getOptionView().setOption(newOption);
    }

    protected getEmptyDisplayValue(id: string): MediaTreeSelectorItem {
        return new MediaTreeSelectorItem().setMissingItemId(id);
    }

    private uncheckOthers(option: SelectedOption<MediaTreeSelectorItem>) {
        let selectedOptions = this.getSelectedOptions();
        for (let i = 0; i < selectedOptions.length; i++) {
            let view = selectedOptions[i].getOptionView() as ImageSelectorSelectedOptionView;
            if (i !== option.getIndex()) {
                view.getCheckbox().setChecked(false);
            }
        }
    }

    private removeOptionViewAndRefocus(option: SelectedOption<MediaTreeSelectorItem>) {
        let index = this.isLast(option.getIndex()) ? (this.isFirst(option.getIndex()) ? -1 : option.getIndex() - 1) : option.getIndex();

        this.notifyRemoveSelectedOptions([option]);
        this.resetActiveOption();

        if (index > -1) {
            (this.getByIndex(index).getOptionView() as ImageSelectorSelectedOptionView).getCheckbox().giveFocus();
        }
    }

    private setActiveOption(option: SelectedOption<MediaTreeSelectorItem>) {

        if (this.activeOption) {
            this.activeOption.getOptionView().removeClass('editing');
        }
        this.activeOption = option;
        option.getOptionView().addClass('editing');

        this.setOutsideClickListener();
    }

    updateSelectionToolbarLayout() {
        let showToolbar = this.selection.length > 0;
        this.toolbar.setVisible(showToolbar);
        if (showToolbar) {
            this.toolbar.setSelectionCount(this.selection.length, this.getNumberOfEditableOptions());
        }
    }

    private getNumberOfEditableOptions(): number {
        let count = 0;
        this.selection.forEach(selectedOption => {
            if (!selectedOption.getOption().getDisplayValue().isEmptyContent()) {
                count++;
            }
        });
        return count;
    }

    private resetActiveOption() {
        if (this.activeOption) {
            this.activeOption.getOptionView().removeClass('editing first-in-row last-in-row');
            this.activeOption = null;
        }

        Body.get().unClicked(this.mouseClickListener);
    }

    private setOutsideClickListener() {
        this.mouseClickListener = (event: MouseEvent) => {
            for (let element: ParentNode = event.target as HTMLElement; element; element = element.parentNode) {
                if (element === this.getHTMLElement()) {
                    return;
                }
            }
            this.resetActiveOption();
        };

        Body.get().onClicked(this.mouseClickListener);
    }

    private handleOptionViewRendered(option: SelectedOption<MediaTreeSelectorItem>, optionView: ImageSelectorSelectedOptionView) {
        optionView.onClicked(() => this.handleOptionViewClicked(option, optionView));

        optionView.getCheckbox().onKeyDown((event: KeyboardEvent) => this.handleOptionViewKeyDownEvent(event, option, optionView));

        optionView.getCheckbox().onFocus(() => this.setActiveOption(option));

        optionView.getIcon().onLoaded(() => this.handleOptionViewImageLoaded(optionView));

        if (option.getOption().getDisplayValue().isEmptyContent()) {
            const missingItemId: string = option.getOption().getDisplayValue().getMissingItemId();
            optionView.showImageNotAvailable(missingItemId);
        }
    }

    private handleOptionViewClicked(option: SelectedOption<MediaTreeSelectorItem>, optionView: ImageSelectorSelectedOptionView) {
        if (this.clickDisabled) {
            return;
        }

        this.uncheckOthers(option);

        if (document.activeElement === optionView.getEl().getHTMLElement() || this.activeOption === option) {
            optionView.getCheckbox().toggleChecked();
        } else {
            optionView.getCheckbox().setChecked(true);
        }
        optionView.getCheckbox().giveFocus();
    }

    private handleOptionViewKeyDownEvent(event: KeyboardEvent, option: SelectedOption<MediaTreeSelectorItem>,
                                         optionView: ImageSelectorSelectedOptionView) {
        let checkbox = optionView.getCheckbox();

        switch (event.which) {
        case 32: // Spacebar
            checkbox.toggleChecked();
            event.stopPropagation();
            break;
        case 8: // Backspace
            checkbox.setChecked(false);
            this.removeOptionViewAndRefocus(option);
            event.preventDefault();
            event.stopPropagation();
            break;
        case 46: // Delete
            checkbox.setChecked(false);
            this.removeOptionViewAndRefocus(option);
            event.stopPropagation();
            break;
        case 13: // Enter
            this.notifyEditSelectedOptions([option]);
            event.stopPropagation();
            break;
        case 9: // tab
            this.resetActiveOption();
            event.stopPropagation();
            break;
        }
    }

    private handleOptionViewChecked(checked: boolean, option: SelectedOption<MediaTreeSelectorItem>,
                                    optionView: ImageSelectorSelectedOptionView) {
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

    private handleOptionViewImageLoaded(optionView: ImageSelectorSelectedOptionView) {
        let loadedListener = () => {
           // optionView.updateProportions();
            this.refreshSortable();
        };

        if (optionView.getIcon().isVisible()) {
            loadedListener();
        } else {
            // execute listener on shown in case it's hidden now to correctly calc proportions
            let shownListener = () => {
                loadedListener();
                optionView.getIcon().unShown(shownListener);
            };
            optionView.getIcon().onShown(shownListener);
        }
    }

    private isFirst(index: number): boolean {
        return index === 0;
    }

    private isLast(index: number): boolean {
        return index === this.getSelectedOptions().length - 1;
    }

    private unstickOtherToolbars() {
        $('.' + this.stickyToolbarCls).removeClass(this.stickyToolbarCls);
    }

    updateStickyToolbar(afterResize: boolean = false) {
        if (!this.toolbar.isVisible()) {
            return;
        }
        const selectedOptionsViewRect = this.getHTMLElement().getBoundingClientRect();
        const windowHeight = (window.innerHeight || document.documentElement.clientHeight);

        if (this.toolbar.hasClass(this.stickyToolbarCls)) {
            const toolbarHeight = this.toolbar.getEl().getHeightWithBorder();

            if (selectedOptionsViewRect.bottom + toolbarHeight <= windowHeight ||
                selectedOptionsViewRect.top + 10 >= windowHeight) {
                this.toolbar.removeClass(this.stickyToolbarCls);
                this.toolbar.getEl().setWidth('100%');
            } else if (afterResize) {
                this.toolbar.getEl().setWidthPx(this.getEl().getWidth());
            }
        } else {

            const toolbarRect = this.toolbar.getHTMLElement().getBoundingClientRect();

            if (toolbarRect.bottom > windowHeight &&
                selectedOptionsViewRect.top + 10 < windowHeight) {
                this.unstickOtherToolbars();
                this.toolbar.addClass(this.stickyToolbarCls);
                this.toolbar.getEl().setWidthPx(this.getEl().getWidth());
            }
        }
    }

    private notifyRemoveSelectedOptions(option: SelectedOption<MediaTreeSelectorItem>[]) {
        this.removeSelectedOptionsListeners.forEach((listener) => {
            listener(option);
        });
    }

    onRemoveSelectedOptions(listener: (option: SelectedOption<MediaTreeSelectorItem>[]) => void) {
        this.removeSelectedOptionsListeners.push(listener);
    }

    unRemoveSelectedOptions(listener: (option: SelectedOption<MediaTreeSelectorItem>[]) => void) {
        this.removeSelectedOptionsListeners = this.removeSelectedOptionsListeners
            .filter(function (curr: (option: SelectedOption<MediaTreeSelectorItem>[]) => void) {
                return curr !== listener;
            });
    }

    private notifyEditSelectedOptions(option: SelectedOption<MediaTreeSelectorItem>[]) {
        this.editSelectedOptionsListeners.forEach((listener) => {
            listener(option);
        });
    }

    onEditSelectedOptions(listener: (option: SelectedOption<MediaTreeSelectorItem>[]) => void) {
        this.editSelectedOptionsListeners.push(listener);
    }

    unEditSelectedOptions(listener: (option: SelectedOption<MediaTreeSelectorItem>[]) => void) {
        this.editSelectedOptionsListeners = this.editSelectedOptionsListeners
            .filter(function (curr: (option: SelectedOption<MediaTreeSelectorItem>[]) => void) {
                return curr !== listener;
            });
    }

}
