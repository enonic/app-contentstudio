import {ContentSelectorDropdown, ContentSelectorDropdownOptions} from './ContentSelectorDropdown';
import {ContentsTreeList} from '../../browse/ContentsTreeList';
import {ModeTogglerButton} from '../ui/selector/ModeTogglerButton';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import * as Q from 'q';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {ContentTreeSelectionWrapper} from './ContentTreeSelectionWrapper';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {Element} from '@enonic/lib-admin-ui/dom/Element';

export interface ContentTreeSelectorDropdownOptions
    extends ContentSelectorDropdownOptions {
    treeMode?: boolean;
}

export class ContentTreeSelectorDropdown
    extends ContentSelectorDropdown {

    protected treeList: ContentsTreeList;

    protected treeSelectionWrapper: ContentTreeSelectionWrapper;

    protected treeMode: boolean;

    protected modeButton: ModeTogglerButton;

    protected options: ContentTreeSelectorDropdownOptions;

    constructor(listBox, options: ContentSelectorDropdownOptions) {
        super(listBox, options);
    }

    protected initElements(): void {
        super.initElements();

        this.modeButton = new ModeTogglerButton();
        this.modeButton.setActive(false);
        this.treeList = new ContentsTreeList({loader: this.options.loader});
        this.treeSelectionWrapper = new ContentTreeSelectionWrapper(this.treeList, {
            maxSelected: this.options.maxSelected,
            checkboxPosition: this.options.checkboxPosition,
            className: 'content-tree-selector',
        });

        this.treeMode = this.options.treeMode || false;
    }

    protected initListeners(): void {
        super.initListeners();

        this.listBox.whenShown(() => {
            // if not empty then search will be performed after finished typing
            if (StringHelper.isBlank(this.optionFilterInput.getValue())) {
                this.search(this.optionFilterInput.getValue());
            }
        });

        this.treeList.onItemsAdded((items: ContentTreeSelectorItem[]) => {
            this.selectLoadedTreeListItems(items);
        });

        this.modeButton.onActiveChanged((active: boolean) => {
            if (!this.treeSelectionWrapper.isRendered()) {
                this.appendChild(this.treeSelectionWrapper);
            }

            this.treeMode = active;

            this.applyButton.hide();
            this.handleModeChanged();

            if (!StringHelper.isBlank(this.optionFilterInput.getValue())) {
                this.search(this.optionFilterInput.getValue());
            }
        });

        this.treeList.onShown(() => {
            this.dropdownHandle.down();
        });

        this.treeSelectionWrapper.onSelectionChanged((selectionChange: SelectionChange<ContentTreeSelectorItem>) => {
            selectionChange.selected?.forEach((item: ContentTreeSelectorItem) => {
                this.handleUserToggleAction(item);
            });

            selectionChange.deselected?.forEach((item: ContentTreeSelectorItem) => {
                this.handleUserToggleAction(item);
            });
        });

        this.onSelectionChanged((selectionChange: SelectionChange<ContentTreeSelectorItem>) => {
            selectionChange.selected?.forEach((item: ContentTreeSelectorItem) => {
                this.treeSelectionWrapper.select(item, true);
            });

            selectionChange.deselected?.forEach((item: ContentTreeSelectorItem) => {
                this.treeSelectionWrapper.deselect(item, true);
            });
        });
    }

    protected postInitListeners(): void {
        super.postInitListeners();

        if (this.treeMode) {
            this.modeButton.setActive(true);
            this.hideDropdown();
        }
    }

    protected doShowDropdown(): void {
        this.setVisibleOnDemand(this.treeSelectionWrapper, this.treeMode);
        this.setVisibleOnDemand(this.treeList, this.treeMode);
        this.setVisibleOnDemand(this.listBox, !this.treeMode);
    }

    protected doHideDropdown() {
        this.treeSelectionWrapper.setVisible(false);
        this.treeList.setVisible(false);
        this.listBox.setVisible(false);
    }

    private setVisibleOnDemand(element: Element, value: boolean): void {
        if (value) {
            if (!element.isVisible()) {
                element.show();
            }
        } else {
            if (element.isVisible()) {
                element.hide();
            }
        }
    }

    protected resetSelection(): void {
        this.selectionDelta.forEach((value: boolean, id: string) => {
            this.treeSelectionWrapper.toggleItemWrapperSelected(id, !value);
        });

        super.resetSelection();
    }

    protected handleModeChanged(): void {
        this.options.loader.setTreeLoadMode(this.treeMode);
        this.showDropdown();
    }

    protected applySelection() {
        super.applySelection();

        this.hideDropdown();
    }

    getItemById(id: string): ContentTreeSelectorItem {
        return this.treeMode ? this.treeList.getItem(id) : super.getItemById(id);
    }

    protected selectLoadedTreeListItems(items: ContentTreeSelectorItem[]): void {
        const selectedItems: string[] = this.getSelectedItemsHandler();

        items.forEach((item: ContentTreeSelectorItem) => {
            const id = item.getId();

            if (selectedItems.indexOf(id) >= 0) {
                // Don't select item if it's unselected before loaded
                this.treeSelectionWrapper.select(item, true);
            }
        });
    }

    protected search(value?: string) {
        this.options.loader.setTreeFilterValue(value);

        if (this.treeMode) {
            this.treeList.clearItems();
            this.treeList.load();
        } else {
            super.search(value);
        }
    }

    getTreeList(): ContentsTreeList {
        return this.treeList;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.modeButton.insertBeforeEl(this.optionFilterInput);
            this.treeSelectionWrapper.addClass('filterable-listbox');
            this.modeButton.insertBeforeEl(this.optionFilterInput);

            this.preSelectItems();

            return rendered;
        });
    }
}
