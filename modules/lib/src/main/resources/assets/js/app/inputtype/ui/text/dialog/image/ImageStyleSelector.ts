import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ImageStyleOption, ImageStyleOptions} from './ImageStyleOptions';
import {Style} from '../../styles/Style';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {FilterableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapper';
import {WidgetView} from '../../../../../view/context/WidgetView';

export class ImageStyleSelector
    extends DivEl {

    private contentId: string;

    private styles: Map<string, Style> = new Map<string, Style>();

    private filterInput: StyleFilterInput;

    constructor(contentId: string) {
        super('imageSelector');

        this.contentId = contentId;

        this.addClass('image-style-selector');
        this.initDropdown();
    }

    private initDropdown(): void {
        this.filterInput = new StyleFilterInput();
        this.addOptions();
    }

    private addOptions() {
        ImageStyleOptions.getOptions(this.contentId).forEach((option: Option<ImageStyleOption>) => {
            this.styles.set(option.getValue(), option.getDisplayValue().getStyle());
            this.filterInput.getList().addItems(option.getDisplayValue().getStyle())
        });
    }

    getSelectedStyle(): Style {
        return this.filterInput.getSelectedItems()[0];
    }

    selectStyleByName(name: string): void {
        const style = this.filterInput.getList().getItem(name);

        if (style) {
            this.filterInput.select(style);
        }
    }

    onSelectionChanged(handler: () => void): void {
        this.filterInput.onSelectionChanged(handler);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.filterInput);

            return rendered;
        });
    }
}

class StyleListBox extends ListBox<Style> {

    constructor() {
        super('style-list-box');
    }

    protected createItemView(item: Style, readOnly: boolean): DivEl {
        const itemView = new DivEl('style-item');

        itemView.setHtml(item.getDisplayName());

        return itemView;
    }

    protected getItemId(item: Style): string {
        return item.getName();
    }
}

class StyleFilterInput extends FilterableListBoxWrapper<Style> {
    private selectedOptionView: DivEl;

    constructor() {
        super(new StyleListBox(), {
            className: 'image-style-selector-filter',
            maxSelected: 1,
            filter: (item: Style, filter: string) => {
                return item.getDisplayName().toLowerCase().indexOf(filter.toLowerCase()) >= 0 ||
                       item.getName().toLowerCase().indexOf(filter.toLowerCase()) >= 0;
            }
        });
    }

    protected initElements(): void {
        super.initElements();

        this.selectedOptionView = new DivEl('selected-item-view');
        this.selectedOptionView.hide();
    }

    protected initListeners(): void {
        super.initListeners();

        this.onSelectionChanged(() => {
            if (this.getSelectedItems()[0]?.getName() === 'none') {
                this.deselectAll();
                this.toggleSelectedOptionViewVisibility(false);
            } else if (this.getSelectedItems().length > 0) {
                this.selectedOptionView.setHtml(this.getSelectedItems()[0].getDisplayName());
                this.toggleSelectedOptionViewVisibility(true);
            }

            this.optionFilterInput.reset();
        });

        this.selectedOptionView.onClicked(() => {
           this.showDropdown();
        });

        this.onDropdownVisibilityChanged(isDropdownVisible => {
            this.toggleSelectedOptionViewVisibility(this.getSelectedItems().length > 0 && !isDropdownVisible);
        });

        this.listBox.onShown(() => {
            setTimeout(() => {
                this.optionFilterInput.giveFocus();
            }, 20);
        });
    }

    private toggleSelectedOptionViewVisibility(isVisible: boolean): void {
        this.optionFilterInput.setVisible(!isVisible);
        this.selectedOptionView.setVisible(isVisible);
    }

    protected handleUserToggleAction(item: Style): void {
        if (this.isItemSelected(item)) {
            return;
        }

        super.handleUserToggleAction(item);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.filterContainer.appendChild(this.selectedOptionView);

            return rendered;
        });
    }
}
