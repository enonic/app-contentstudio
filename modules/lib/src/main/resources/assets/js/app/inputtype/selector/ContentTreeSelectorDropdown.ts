import {ContentSelectorDropdown, ContentSelectorDropdownOptions} from './ContentSelectorDropdown';
import {ContentsTreeList} from '../../browse/ContentsTreeList';
import {ModeTogglerButton} from '../ui/selector/ModeTogglerButton';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import * as Q from 'q';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {ContentTreeSelectionWrapper} from './ContentTreeSelectionWrapper';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SelectionDeltaItem} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapper';

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

    protected loadTreeListOnShow: boolean;

    protected options: ContentTreeSelectorDropdownOptions;

    constructor(listBox, options: ContentSelectorDropdownOptions) {
        super(listBox, options);
    }

    protected initElements(): void {
        super.initElements();

        this.modeButton = new ModeTogglerButton();
        this.modeButton.setActive(false);
        this.treeList = new ContentsTreeList({loader: this.options.loader});
        this.treeList.setEmptyText(i18n('field.option.noitems'));
        this.treeSelectionWrapper = new ContentTreeSelectionWrapper(this.treeList, {
            maxSelected: this.options.maxSelected,
            checkboxPosition: this.options.checkboxPosition,
            className: 'content-tree-selector',
        });

        this.treeSelectionWrapper.hide();

        this.treeSelectionWrapper
            .setClickOutsideHandler(this.handleClickOutside.bind(this))
            .setEnterKeyHandler(this.handlerEnterPressedInTree.bind(this));

        this.treeMode = !!this.options.treeMode || false;
        this.loadTreeListOnShow = true;
    }

    protected initListeners(): void {
        super.initListeners();

        this.treeList.onItemsAdded((items: ContentTreeSelectorItem[]) => {
            this.selectLoadedTreeListItems(items);
        });

        this.modeButton.onActiveChanged((active: boolean) => {
            const searchValue = this.optionFilterInput.getValue();
            const hasSearchText = !StringHelper.isBlank(searchValue);
            this.treeMode = active;
            this.applyButton.hide();

            if (hasSearchText) {
                this.loadTreeListOnShow = false; // will be loaded by search
            }

            this.handleModeChanged();

            if (hasSearchText) {
                this.search(searchValue);
            }
        });

        this.treeList.onShown(() => {
            if (this.loadTreeListOnShow) {
                this.treeList.clearItems();
                this.treeList.load();
            }

            this.dropdownHandle.down();
            this.loadTreeListOnShow = false;
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

            this.treeSelectionWrapper.unSelectAllExcept(this.getSelectedItems().map(item => item.getId()));
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
        // doing in specific order so key listeners first detached from hidden list and then attached to the shown one
        if (this.treeMode) {
            this.setVisibleOnDemand(this.listBox, !this.treeMode);
            this.setVisibleOnDemand(this.treeSelectionWrapper, this.treeMode);
        } else {
            this.setVisibleOnDemand(this.treeSelectionWrapper, this.treeMode);
            this.setVisibleOnDemand(this.listBox, !this.treeMode);

            if (this.loadWhenListShown) {
                this.loadListOnShown();
            }
        }
    }

    protected doHideDropdown() {
        this.treeSelectionWrapper.setVisible(false);
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
        this.selectionDelta.forEach((value: SelectionDeltaItem<ContentTreeSelectorItem>, id: string) => {
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
                this.treeSelectionWrapper.select(item, true);
                this.select(item, true);
            }
        });
    }

    protected handleDebouncedSearchValueChange(searchValue: string): void {
        const hasSearchText = !StringHelper.isBlank(searchValue);

        if (hasSearchText) {
            if (this.treeMode) {
                this.modeButton.setActive(false);
            } else {
                super.handleDebouncedSearchValueChange(searchValue);
            }
        } else {
            // switching do default mode if search is empty
            if (this.treeMode !== !!this.options.treeMode) {
                this.modeButton.setActive(!this.treeMode);
            }

            super.handleDebouncedSearchValueChange(searchValue);
        }

    }

    protected search(value?: string): void {
        this.options.loader.setTreeFilterValue(value);

        if (this.treeMode) {
            this.loadTreeListOnShow = false;
            this.treeList.clearItems();
            this.treeList.load();
        } else {
            super.search(value);
        }
    }

    setLoadWhenListShown(): void {
        super.setLoadWhenListShown();
        this.loadTreeListOnShow = true;
    }

    load(): void {
        this.search(this.optionFilterInput.getValue());
    }

    getTreeList(): ContentsTreeList {
        return this.treeList;
    }

    protected loadListOnShown(): void {
        if (StringHelper.isBlank(this.optionFilterInput.getValue())) {
            this.search(this.optionFilterInput.getValue());
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.modeButton.insertBeforeEl(this.optionFilterInput);
            this.treeSelectionWrapper.addClass('filterable-listbox');
            this.modeButton.insertBeforeEl(this.optionFilterInput);
            this.treeSelectionWrapper.insertBeforeEl(this.selectedOptionsView);

            this.preSelectItems();

            return rendered;
        });
    }

    protected handlerEnterPressedInTree(): boolean {
        if (this.applyButton.hasFocus()) {
            this.applySelection();
            return true;
        }

        const focusedItem = this.treeSelectionWrapper.getNavigator().getFocusedItem();

        if (focusedItem) {
            if (this.selectionDelta.size === 0) {
                this.handleUserToggleAction(focusedItem);
            }

            if (this.selectionDelta.size !== 0) {
                this.applySelection();
            }
        }

        return true;
    }
}
