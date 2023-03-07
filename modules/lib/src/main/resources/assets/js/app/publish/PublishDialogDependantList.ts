import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {CompareStatusChecker} from '../content/CompareStatus';
import {ContentId} from '../content/ContentId';
import {ContentIds} from '../content/ContentIds';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {DependantItemViewer} from '../dialog/DependantItemViewer';
import {DialogDependantItemsList, ObserverConfig} from '../dialog/DialogDependantItemsList';
import {StatusCheckableItem} from '../dialog/StatusCheckableItem';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';

export class PublishDialogDependantList
    extends DialogDependantItemsList {

    private requiredIds: ContentIds;

    private listChangedListeners: (() => void)[] = [];

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
                });
            },

        });

        this.requiredIds = ContentIds.empty();
    }

    protected initListeners(): void {
        super.initListeners();

        const serverEvents = ContentServerEventsHandler.getInstance();

        const permissionsUpdatedHandler = (updatedIds: ContentIds): void => {
            const isItemsPermissionsUpdated = this.getItems().some(item => updatedIds.contains(item.getContentId()));
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
            permissionsUpdatedHandler(ContentIds.from(updatedItems.map(item => item.getContentId())));
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

    protected isItemExcludable(item: ContentSummaryAndCompareStatus): boolean {
        const isPendingDelete = CompareStatusChecker.isPendingDelete(item.getCompareStatus());
        if (isPendingDelete) {
            return false;
        }

        return !this.requiredIds.contains(item.getContentId());
    }

    hasExcluded(): boolean {
        return this.excludedIds.filter(id => !this.requiredIds.contains(id)).length > 0;
    }

    setRequiredIds(value: ContentId[]) {
        this.requiredIds = ContentIds.from(value);
    }

    onListChanged(listener: () => void) {
        this.listChangedListeners.push(listener);
    }

    unListChanged(listener: () => void) {
        this.listChangedListeners = this.listChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyListChanged() {
        this.listChangedListeners.forEach(listener => {
            listener();
        });
    }

    refresh(): void {
        //
    }
}
