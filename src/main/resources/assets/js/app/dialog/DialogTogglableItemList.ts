import {DialogItemList} from './DependantItemsDialog';
import {StatusSelectionItem} from './StatusSelectionItem';
import ContentSummaryAndCompareStatusViewer = api.content.ContentSummaryAndCompareStatusViewer;
import BrowseItem = api.app.browse.BrowseItem;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import Tooltip = api.ui.Tooltip;
import i18n = api.util.i18n;

export class DialogTogglableItemList
    extends DialogItemList {

    private removeClickListeners: { (item: ContentSummaryAndCompareStatus): void }[] = [];

    private canBeEmpty: boolean = false;

    private togglerEnabled: boolean = false;

    private childrenListChangedListeners: { (): void }[] = [];

    protected debounceNotifyListChanged: Function;

    constructor(togglerEnabled?: boolean, className?: string) {
        super('dialog-togglable-item-list');

        if (className) {
            this.addClass(className);
        }

        this.togglerEnabled = !!togglerEnabled;

        this.onItemsAdded(this.itemChangedHandler.bind(this));
        this.onItemsRemoved(() => {
            this.itemChangedHandler();
            this.getItemViews().forEach(this.updateRemovableState.bind(this));
        });

        this.debounceNotifyListChanged = api.util.AppHelper.debounce(() => {
            this.notifyChildrenListChanged();
        }, 100, false);
    }

    public setContainsToggleable(value: boolean) {
        this.toggleClass('contains-toggleable', value);
    }

    public setCanBeEmpty(value: boolean) {
        this.canBeEmpty = value;
    }

    private itemChangedHandler() {
        this.toggleClass('contains-toggleable', this.getItemViews()
            .some(item => item.getBrowseItem().getModel().getContentSummary().hasChildren()));
    }

    createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): TogglableStatusSelectionItem {
        const itemView = <TogglableStatusSelectionItem>super.createItemView(item, readOnly);

        if (this.canBeEmpty) {
            itemView.setIsRemovableFn(() => true);
        }

        itemView.setRemoveHandlerFn(() => {
            this.removeItem(item);
            this.notifyItemRemoveClicked(item);
        });

        this.updateRemovableState(itemView);

        return itemView;
    }

    protected createSelectionItem(viewer: ContentSummaryAndCompareStatusViewer,
                                  browseItem: BrowseItem<ContentSummaryAndCompareStatus>): TogglableStatusSelectionItem {

        const item = new TogglableStatusSelectionItem(viewer, browseItem, this.togglerEnabled);
        item.onItemStateChanged(() => {
            this.debounceNotifyListChanged();
        });

        return item;
    }

    public childTogglersAvailable(): boolean {
        return this.getItemViews().some(
            itemView => !!itemView.getIncludeChildrenToggler()
        );
    }

    public setReadOnly(value: boolean) {
        this.toggleClass('readonly', value);
        this.getItemViews().forEach((item) => {
            item.setReadOnly(value);
        });
    }

    public getItemViews(): TogglableStatusSelectionItem[] {
        return <TogglableStatusSelectionItem[]>super.getItemViews();
    }

    public getItemViewById(contentId: ContentId): TogglableStatusSelectionItem {
        for (const view of <TogglableStatusSelectionItem[]>super.getItemViews()) {
            if (view.getContentId().equals(contentId)) {
                return view;
            }
        }
    }

    private updateRemovableState(view: TogglableStatusSelectionItem) {
        view.toggleClass('removable', view.isRemovable());
    }

    onItemRemoveClicked(listener: (item: ContentSummaryAndCompareStatus) => void) {
        this.removeClickListeners.push(listener);
    }

    unItemRemoveClicked(listener: (item: ContentSummaryAndCompareStatus) => void) {
        this.removeClickListeners = this.removeClickListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyItemRemoveClicked(item: ContentSummaryAndCompareStatus) {
        this.removeClickListeners.forEach(listener => {
            listener(item);
        });
    }

    public onChildrenListChanged(listener: () => void) {
        this.childrenListChangedListeners.push(listener);
    }

    public unChildrenListChanged(listener: () => void) {
        this.childrenListChangedListeners = this.childrenListChangedListeners.filter((current) => {
            return current !== listener;
        });
    }

    private notifyChildrenListChanged() {
        this.childrenListChangedListeners.forEach((listener) => {
            listener();
        });
    }
}

export class TogglableStatusSelectionItem
    extends StatusSelectionItem {

    private itemStateChangedListeners: { (itemId: ContentId, enabled: boolean): void }[] = [];

    private id: ContentId;

    private toggler: IncludeChildrenToggler;

    constructor(viewer: api.ui.Viewer<ContentSummaryAndCompareStatus>,
                item: BrowseItem<ContentSummaryAndCompareStatus>,
                toggleEnabled: boolean) {
        super(viewer, item);

        if (item.getModel().getContentSummary().hasChildren()) {
            this.toggler = new IncludeChildrenToggler(toggleEnabled);
            this.addClass('toggleable');

            this.toggler.onStateChanged((enabled: boolean) => {
                this.notifyItemStateChanged(this.getBrowseItem().getModel().getContentId(), enabled);
            });
        }

        this.id = item.getModel().getContentSummary().getContentId();
    }

    public doRender(): wemQ.Promise<boolean> {

        return super.doRender().then((rendered) => {

            if (this.toggler) {
                this.toggler.insertAfterEl(this.removeEl);
            }

            return rendered;
        });
    }

    public setReadOnly(value: boolean) {
        if (this.toggler) {
            this.toggler.setReadOnly(value);
        }
    }

    getIncludeChildrenToggler(): IncludeChildrenToggler {
        return this.toggler;
    }

    getContentId(): ContentId {
        return this.id;
    }

    setTogglerActive(value: boolean) {
        this.toggleClass('toggleable', value);
    }

    withChildren(): boolean {
        return !this.toggler || this.toggler.isEnabled();
    }

    public onItemStateChanged(listener: (item: ContentId, enabled: boolean) => void) {
        this.itemStateChangedListeners.push(listener);
    }

    public unItemStateChanged(listener: (item: ContentId, enabled: boolean) => void) {
        this.itemStateChangedListeners = this.itemStateChangedListeners.filter((current) => {
            return current !== listener;
        });
    }

    private notifyItemStateChanged(item: ContentId, enabled: boolean) {
        this.itemStateChangedListeners.forEach((listener) => {
            listener(item, enabled);
        });
    }
}

class IncludeChildrenToggler
    extends api.dom.DivEl {

    private stateChangedListeners: { (enabled: boolean): void }[] = [];

    private tooltip: Tooltip;

    private readOnly: boolean;

    constructor(enabled: boolean) {
        super('icon icon-tree');
        this.addClass('include-children-toggler');

        this.tooltip = new Tooltip(this, i18n('dialog.showChildren'), 1000);

        this.onClicked(() => {
            this.toggle();
        });

        this.toggle(enabled, true);
    }

    toggle(condition?: boolean, silent?: boolean): boolean {
        if (!this.readOnly && this.isEnabled() !== condition) {
            this.toggleClass('on', condition);

            this.tooltip.setText(this.isEnabled() ? i18n('dialog.excludeChildren') : i18n('dialog.includeChildren'));

            if (!silent) {
                this.notifyStateChanged(this.isEnabled());
            }
            return true;
        }
        return false;
    }

    setReadOnly(value: boolean) {
        this.readOnly = value;
        this.tooltip.setActive(!value);

        this.toggleClass('readonly', this.readOnly);
    }

    isEnabled(): boolean {
        return this.hasClass('on');
    }

    public onStateChanged(listener: (enabled: boolean) => void) {
        this.stateChangedListeners.push(listener);
    }

    public unStateChanged(listener: (enabled: boolean) => void) {
        this.stateChangedListeners = this.stateChangedListeners.filter((current) => {
            return current !== listener;
        });
    }

    private notifyStateChanged(enabled: boolean) {
        this.stateChangedListeners.forEach((listener) => {
            listener(enabled);
        });
    }
}
