import {ContentSelectorDropdown, ContentSelectorDropdownOptions} from './ContentSelectorDropdown';
import {ContentsTreeList} from '../../browse/ContentsTreeList';
import {ModeTogglerButton} from '../ui/selector/ModeTogglerButton';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import * as Q from 'q';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {ContentTreeSelectionWrapper} from './ContentTreeSelectionWrapper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export interface ContentTreeSelectorDropdownOptions
    extends ContentSelectorDropdownOptions {
    initialTreeMode?: boolean;
}

export class ContentTreeSelectorDropdown
    extends ContentSelectorDropdown {

    protected treeList: ContentsTreeList;

    protected treeSelectionWrapper: ContentTreeSelectionWrapper;

    protected isTreeMode: boolean;

    protected modeButton: ModeTogglerButton;

    protected options: ContentTreeSelectorDropdownOptions;

    private lastFlatSearchValue: string;

    private lastTreeSearchValue: string;

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

        this.isTreeMode = this.options.initialTreeMode || false;
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

            this.isTreeMode = active;

            this.handleModeChanged();

            if (ObjectHelper.bothDefined(this.lastTreeSearchValue, this.lastFlatSearchValue) &&
                !ObjectHelper.stringEquals(this.lastTreeSearchValue, this.lastFlatSearchValue)) {
                this.search(this.isTreeMode ? this.lastFlatSearchValue : this.lastTreeSearchValue);
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

        if (this.isTreeMode) {
            this.modeButton.setActive(true);
            this.hideDropdown();
        }
    }

    protected doShowDropdown() {
        this.handleModeChanged();
    }

    protected doHideDropdown() {
        this.treeSelectionWrapper.setVisible(false);
        this.treeList.setVisible(false);
        this.listBox.setVisible(false);
    }

    protected resetSelection(): void {
        this.selectionDelta.forEach((value: boolean, id: string) => {
            this.treeSelectionWrapper.toggleItemWrapperSelected(id, !value);
        });

        super.resetSelection();
    }

    protected handleModeChanged(): void {
        this.options.loader.setTreeLoadMode(this.isTreeMode);

        this.treeSelectionWrapper.setVisible(this.isTreeMode);
        this.treeList.setVisible(this.isTreeMode);
        this.listBox.setVisible(!this.isTreeMode);
    }

    protected applySelection() {
        super.applySelection();

        this.treeSelectionWrapper.setVisible(false);
        this.treeList.setVisible(false);
    }

    getItemById(id: string): ContentTreeSelectorItem {
        return this.isTreeMode ? this.treeList.getItem(id) : super.getItemById(id);
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

    protected handleClickOutside() {
        super.handleClickOutside();

        this.treeSelectionWrapper.setVisible(false);
        this.treeList.setVisible(false);
    }

    protected search(value?: string) {
        this.options.loader.setTreeFilterValue(value);

        if (this.isTreeMode) {
            this.lastTreeSearchValue = value;
            this.treeList.clearItems();
            this.treeList.load();
        } else {
            this.lastFlatSearchValue = value;
            super.search(value);
        }
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
