import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {DialogItemList} from './DependantItemsDialog';
import {StatusSelectionItem} from './StatusSelectionItem';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {Tooltip} from 'lib-admin-ui/ui/Tooltip';
import {ContentIds} from '../ContentIds';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';

export class DialogTogglableItemList
    extends DialogItemList {

    private removeClickListeners: { (item: ContentSummaryAndCompareStatus): void }[] = [];

    private canBeEmpty: boolean = false;

    private togglerEnabled: boolean = false;

    private childrenListChangedListeners: { (): void }[] = [];

    private listChangedListeners: { (): void }[] = [];

    protected debounceNotifyListChanged: Function;

    constructor(togglerEnabled?: boolean, className?: string) {
        super('dialog-togglable-item-list');

        if (className) {
            this.addClass(className);
        }

        this.togglerEnabled = !!togglerEnabled;

        const changeHandler = () => {
            this.itemChangedHandler();
        };
        this.onItemsAdded(changeHandler);
        this.onItemsRemoved(changeHandler);

        this.debounceNotifyListChanged = AppHelper.debounce(() => {
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
        const isTogglable = this.getItemViews().some(item => {
            return (<ContentSummaryAndCompareStatus>item.getBrowseItem()).getContentSummary().hasChildren();
        });
        this.toggleClass('contains-toggleable', isTogglable);

        this.getItemViews().forEach(view => {
            this.updateRemovableState(view);
        });
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

        this.initListItemListeners(item, itemView);

        return itemView;
    }

    protected updateItemView(itemView: Element, item: ContentSummaryAndCompareStatus) {
        const view = <TogglableStatusSelectionItem>itemView;
        view.setObject(item);
    }

    protected createSelectionItem(viewer: ContentSummaryAndCompareStatusViewer,
                                  browseItem: ContentSummaryAndCompareStatus): TogglableStatusSelectionItem {

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

    public hasActiveTogglers(): boolean {
        return this.getItemViews().some(
            itemView => !!itemView.includesChildren()
        );
    }

    public refreshList() {
        super.refreshList();
        this.debounceNotifyListChanged();
    }

    public setReadOnly(value: boolean) {
        super.setReadOnly(value);
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

    public onListItemsDataChanged(listener: () => void) {
        this.listChangedListeners.push(listener);
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

    public unListItemsDataChanged(listener: () => void) {
        this.listChangedListeners = this.listChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private initListItemListeners(item: ContentSummaryAndCompareStatus, view: StatusSelectionItem) {
        const serverEvents = ContentServerEventsHandler.getInstance();

        const permissionsUpdatedHandler = (contentIds: ContentIds) => {
            const itemContentId: ContentId = item.getContentId();
            if (contentIds.contains(itemContentId)) {
                this.notifyListItemsDataChanged();
            }
        };

        const updatedHandler = (data: ContentSummaryAndCompareStatus[]) => {
            permissionsUpdatedHandler(ContentIds.from(data.map((updated: ContentSummaryAndCompareStatus) => updated.getContentId())));
        };
        const deletedHandler = (changedItems: ContentServerChangeItem[], pending?: boolean) => {
            if (changedItems.some(changedItem => changedItem.getContentId().equals(item.getContentId()))) {
                this.notifyListItemsDataChanged();
            }
        };
        serverEvents.onContentUpdated(updatedHandler);
        serverEvents.onContentPermissionsUpdated(permissionsUpdatedHandler);
        serverEvents.onContentDeleted(deletedHandler);

        view.onRemoved(() => {
            serverEvents.unContentUpdated(updatedHandler);
            serverEvents.unContentPermissionsUpdated(permissionsUpdatedHandler);
            serverEvents.unContentDeleted(deletedHandler);
        });
    }

    private notifyListItemsDataChanged() {
        this.listChangedListeners.forEach(listener => {
            listener();
        });
    }
}

export class TogglableStatusSelectionItem
    extends StatusSelectionItem {

    private itemStateChangedListeners: { (itemId: ContentId, enabled: boolean): void }[] = [];

    private id: ContentId;

    private toggler: IncludeChildrenToggler;

    constructor(viewer: Viewer<ContentSummaryAndCompareStatus>,
                item: ContentSummaryAndCompareStatus,
                toggleEnabled: boolean) {
        super(viewer, item);

        if (item.getContentSummary().hasChildren()) {
            this.toggler = new IncludeChildrenToggler(toggleEnabled);
            this.addClass('toggleable');

            this.toggler.onStateChanged((enabled: boolean) => {
                this.notifyItemStateChanged((<ContentSummaryAndCompareStatus>this.getBrowseItem()).getContentId(), enabled);
            });
        }

        this.id = item.getContentSummary().getContentId();
    }

    public doRender(): Q.Promise<boolean> {

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

    includesChildren(): boolean {
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
    extends DivEl {

    private stateChangedListeners: { (enabled: boolean): void }[] = [];

    private tooltip: Tooltip;

    private readOnly: boolean;

    constructor(enabled: boolean) {
        super('icon icon-tree');
        this.addClass('include-children-toggler');

        this.tooltip = new Tooltip(this, i18n('dialog.includeChildren'), 1000);

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
