import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {SelectableListBoxNavigator} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxNavigator';
import {TreeListElement} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';

export class ContentTreeSelectionWrapper
    extends SelectableListBoxWrapper<ContentTreeSelectorItem> {

    private clickOutsideHandler: () => boolean;

    private enterKeyHandler: () => boolean;

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

        this.addKeyNavigation();
    }

    protected createSelectionNavigator(): SelectableListBoxNavigator<ContentTreeSelectorItem> {
        return super.createSelectionNavigator()
            .setClickOutsideHandler(this.handleClickOutside.bind(this))
            .setEnterKeyHandler(this.handlerEnterPressed.bind(this))
            .setLeftKeyHandler(this.handleLeftKey.bind(this))
            .setRightKeyHandler(this.handleRightKey.bind(this));
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
        const focusedItem = this.selectionNavigator.getFocusedItem();

        if (focusedItem) {
            const view = this.listBox.getItemView(focusedItem);

            if (view instanceof TreeListElement) {
                view.collapse();
            }
        }

        return true;
    }

    protected handleRightKey(): boolean {
        const focusedItem = this.selectionNavigator.getFocusedItem();

        if (focusedItem) {
            const view = this.listBox.getItemView(focusedItem);

            if (view instanceof TreeListElement) {
                view.expand();
            }
        }
        return true;
    }

    getNavigator(): SelectableListBoxNavigator<ContentTreeSelectorItem> {
        return this.selectionNavigator;
    }

    unSelectAllExcept(ids: string[]): void {
        this.getSelectedItems().find((selectedItem) => {
            if (!ids.some((id) => id === selectedItem.getId())) {
                this.deselect(selectedItem, true);
            }
        });
    }
}
