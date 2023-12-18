import {ContentSelectorDropdown} from './ContentSelectorDropdown';
import {ContentsTreeList} from '../../browse/ContentsTreeList';
import {ModeTogglerButton} from '../ui/selector/ModeTogglerButton';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import * as Q from 'q';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {ContentTreeSelectionWrapper} from './ContentTreeSelectionWrapper';

export class ContentTreeSelectorDropdown
    extends ContentSelectorDropdown {

    protected treeList: ContentsTreeList;

    protected treeSelectionWrapper: ContentTreeSelectionWrapper;

    protected isTreeMode: boolean = false;

    protected modeButton: ModeTogglerButton;

    protected initElements() {
        super.initElements();

        this.modeButton = new ModeTogglerButton();
        this.modeButton.setActive(false);
        this.treeList = new ContentsTreeList();
        this.treeList.setLoader(this.options.loader);
        this.treeSelectionWrapper = new ContentTreeSelectionWrapper(this.treeList, {
            maxSelected: this.options.maxSelected,
            checkboxPosition: this.options.checkboxPosition,
            className: 'content-tree-selector',
        });
    }

    protected initListeners(): void {
        super.initListeners();

        this.treeList.onItemsAdded((items: ContentTreeSelectorItem[]) => {
            this.selectLoadedTreeListItems(items);
        });

        this.modeButton.onActiveChanged((active: boolean) => {
            if (!this.treeSelectionWrapper.isRendered()) {
                this.appendChild(this.treeSelectionWrapper);
            }

            this.isTreeMode = active;

            this.handleModeChanged();
        });

        this.treeList.onShown(() => {
            this.dropdownHandle.down();
        });

        const mouseClickListener: (event: MouseEvent) => void = (event: MouseEvent) => {
            for (let element = event.target; element; element = (element as HTMLElement).parentNode) {
                if (element === this.getHTMLElement()) {
                    return;
                }
            }
            this.handleClickOutside();
        };

        let isShown: boolean = false;

        this.treeList.onHidden(() => {
            if (isShown) {
                isShown = false;
                Body.get().unMouseDown(mouseClickListener);
            }
        });

        this.treeList.onShown(() => {
            if (!isShown) {
                isShown = true;
                Body.get().onMouseDown(mouseClickListener);
            }
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

    protected handleDropdownClicked(): void {
        if (this.dropdownHandle.isDown()) {
            this.handleModeChanged();
        } else {
            this.treeSelectionWrapper.setVisible(false);
            this.treeList.setVisible(false);
            this.listBox.setVisible(false);
        }
    }

    protected resetSelection(): void {
        this.selectionDelta.forEach((value: boolean, id: string) => {
            this.treeSelectionWrapper.toggleItemWrapperSelected(id, !value);
        });

        super.resetSelection();
    }

    protected handleModeChanged(): void {
        this.treeSelectionWrapper.setVisible(this.isTreeMode);
        this.treeList.setVisible(this.isTreeMode);
        this.listBox.setVisible(!this.isTreeMode);
    }

    protected applySelection() {
        super.applySelection();

        this.treeSelectionWrapper.setVisible(false);
        this.treeList.setVisible(false);
    }

    protected getItemById(id: string): ContentTreeSelectorItem {
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

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.modeButton.insertBeforeEl(this.optionFilterInput);
            this.treeSelectionWrapper.addClass('filterable-listbox');
            this.treeSelectionWrapper.appendChild(this.treeList);
            this.modeButton.insertBeforeEl(this.optionFilterInput);

            this.preSelectItems();

            return rendered;
        });
    }
}
