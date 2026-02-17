import {type ContentId} from '../content/ContentId';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentIds} from '../content/ContentIds';
import {DependantItemViewer} from '../dialog/DependantItemViewer';
import {DialogDependantItemsList, type ObserverConfig} from '../dialog/DialogDependantItemsList';
import {StatusCheckableItem} from '../dialog/StatusCheckableItem';
import {type ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';

export class PublishDialogDependantList
    extends DialogDependantItemsList {

    private requiredIds: ContentIds;

    private visibleIds: ContentIds;

    private listChangedListeners: (() => void)[] = [];

    private visibleUpdatedListeners: (() => void)[] = [];

    constructor(observer: ObserverConfig) {
        super({
            className: 'publish-dialog-dependant-list',
            observer,
            createViewer: () => new DependantItemViewer(),
            createItem: (viewer, item) => {
                return new StatusCheckableItem({
                    viewer,
                    item,
                    checkbox: {
                        nonSelectableTooltip: i18n('dialog.publish.itemRequired'),
                        checked: () => this.mustSelectItem(item),
                        enabled: () => this.isItemExcludable(item),
                    },
                    hidden: () => this.isItemHidden(item),
                });
            },

        });

        this.requiredIds = ContentIds.empty();
        this.visibleIds = ContentIds.empty();
    }

    hasExcluded(): boolean {
        return this.excludedIds.some(id => this.isIdExcludable(id));
    }

    setRequiredIds(value: ContentId[]) {
        this.requiredIds = ContentIds.from(value);
    }

    updateVisibleIds(value: ContentId[]) {
        this.visibleIds = ContentIds.from(value);
        this.notifyVisibleUpdated();
    }

    onListChanged(listener: () => void) {
        this.listChangedListeners.push(listener);
    }

    onVisibleUpdated(listener: () => void) {
        this.visibleUpdatedListeners.push(listener);
    }

    refresh(): void {
        //
    }

    protected initListeners(): void {
        super.initListeners();

        const serverEvents = ContentServerEventsHandler.getInstance();

        const permissionsUpdatedHandler = (updatedItems: ContentSummaryAndCompareStatus[]): void => {
            const updatedIds = updatedItems.map(item => item.getId());
            const isItemsPermissionsUpdated = this.getItems().some(
                item => updatedIds.findIndex(updatedId => updatedId === item.getId()) > -1);
            if (isItemsPermissionsUpdated) {
                this.notifyListChanged();
            }
        };

        const deletedHandler = (deletedItems: ContentServerChangeItem[]) => {
            const isItemsDeleted = deletedItems.some(deletedItem => {
                return this.getItems().forEach(item => item.getContentId().equals(deletedItem.getContentId()));
            });

            if (isItemsDeleted) {
                this.notifyListChanged();
            }
        };

        const updatedHandler = (updatedItems: ContentSummaryAndCompareStatus[]) => {
            permissionsUpdatedHandler(updatedItems);
        };

        this.onAdded(() => {
            serverEvents.onContentPermissionsUpdated(permissionsUpdatedHandler);
            serverEvents.onContentUpdated(updatedHandler);
            serverEvents.onContentDeleted(deletedHandler);
        });

        this.onRemoved(() => {
            serverEvents.unContentPermissionsUpdated(permissionsUpdatedHandler);
            serverEvents.unContentUpdated(updatedHandler);
            serverEvents.unContentDeleted(deletedHandler);
        });
    }

    protected isIdExcludable(id: ContentId): boolean {
        return !this.requiredIds.contains(id) && this.visibleIds.contains(id);
    }

    protected isItemExcludable(item: ContentSummaryAndCompareStatus): boolean {
        const isHidden = this.isItemHidden(item);
        if (isHidden) {
            return true;
        }

        return this.isIdExcludable(item.getContentId());
    }

    protected mustSelectItem(item: ContentSummaryAndCompareStatus): boolean {
        return !this.isItemHidden(item) && super.mustSelectItem(item);
    }

    protected isItemHidden(item: ContentSummaryAndCompareStatus): boolean {
        return !this.visibleIds.contains(item.getContentId());
    }

    private notifyListChanged() {
        this.listChangedListeners.forEach(listener => {
            listener();
        });
    }

    protected notifyVisibleUpdated(): void {
        this.visibleUpdatedListeners.forEach(listener => {
            listener();
        });
    }
}
