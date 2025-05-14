import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {SelectableListBoxNavigator} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxNavigator';
import {TreeListElement} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';
import {Element} from '@enonic/lib-admin-ui/dom/Element';

export class ContentTreeSelectionWrapper
    extends SelectableListBoxWrapper<ContentTreeSelectorItem> {

    private clickOutsideHandler: () => boolean;

    private enterKeyHandler: () => boolean;

    private keyNavigator: SelectableListBoxNavigator<ContentTreeSelectorItem>;

    toggleItemWrapperSelected(itemId: string, isSelected: boolean) {
        super.toggleItemWrapperSelected(itemId, isSelected);
    }

    protected handleUserToggleAction(item: ContentTreeSelectorItem) {
        if (item.isSelectable()) {
            super.handleUserToggleAction(item);
        }
    }

    protected initListeners(): void {
        super.initListeners();

        this.keyNavigator = new SelectableListBoxNavigator(this.listBox, this.itemsWrappers)
            .setClickOutsideHandler(this.handleClickOutside.bind(this))
            .setEnterKeyHandler(this.handlerEnterPressed.bind(this))
            .setSpaceHandler(this.handleSpacePressed.bind(this))
            .setLeftKeyHandler(this.handleLeftKey.bind(this))
            .setRightKeyHandler(this.handleRightKey.bind(this));
    }

    protected handleSpacePressed(): boolean {
        const focusedItem: ContentTreeSelectorItem = this.keyNavigator.getFocusedItem();

        if (focusedItem) {
            this.handleUserToggleAction(focusedItem);
            return false;
        }

        return true;
    }

    protected handleClickOutside(): boolean {
        return this.clickOutsideHandler ? this.clickOutsideHandler() : true;
    }

    protected handlerEnterPressed(): boolean {
        return this.enterKeyHandler ? this.enterKeyHandler(): true;
    }

    setClickOutsideHandler(handler: () => boolean): this {
        this.clickOutsideHandler = handler;
        return this;
    }

    setEnterKeyHandler(handler: () => boolean): this {
        this.enterKeyHandler = handler;
        return this;
    }

    protected handleLeftKey(): boolean {
        const focusedItem = this.keyNavigator.getFocusedItem();

        if (focusedItem) {
            const view = this.listBox.getItemView(focusedItem);

            if (view instanceof TreeListElement) {
                view.collapse();
            }
        }

        return true;
    }

    protected handleRightKey(): boolean {
        const focusedItem = this.keyNavigator.getFocusedItem();

        if (focusedItem) {
            const view = this.listBox.getItemView(focusedItem);

            if (view instanceof TreeListElement) {
                view.expand();
            }
        }
        return true;
    }

    getNavigator(): SelectableListBoxNavigator<ContentTreeSelectorItem> {
        return this.keyNavigator;
    }

    unSelectAllExcept(ids: string[]): void {
        this.getSelectedItems().find((selectedItem) => {
            if (!ids.some((id) => id === selectedItem.getId())) {
                this.deselect(selectedItem, true);
            }
        });
    }

    protected addItemWrapper(id: string, wrapper: Element): void {
        super.addItemWrapper(id, wrapper);

        // if list is already shown and new item added to it then add tabindex manually
        this.keyNavigator?.notifyItemWrapperAdded(wrapper);
    }
}
