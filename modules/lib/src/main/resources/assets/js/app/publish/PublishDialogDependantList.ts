import {ContentId} from '../content/ContentId';
import {ContentIds} from '../content/ContentIds';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {DialogDependantItemsList, ObserverConfig} from '../dialog/DialogDependantItemsList';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {CheckableListItemWithStatus} from '../ui2/list/CheckableListItemWithStatus';
import { ContentSummaryViewer } from '../content/ContentSummaryViewer';


export class PublishDialogDependantList extends DialogDependantItemsList {

    private requiredIds = ContentIds.empty();
    private visibleIds  = ContentIds.empty();

    private listChangedListeners: (() => void)[] = [];
    private visibleUpdatedListeners: (() => void)[] = [];

    constructor(observer: ObserverConfig) {
        super({className: 'publish-dialog-dependant-list', observer});
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

    refresh(): void {
        //
    }



    createItemView(content: ContentSummaryAndCompareStatus, readOnly: boolean): CheckableListItemWithStatus {
        const className = this.isItemHidden(content) ? 'hidden' : undefined;
        const viewer = new ContentSummaryViewer();
        const summary = content.getContentSummary();
        if (summary) viewer.setObject(summary);

        return new CheckableListItemWithStatus({
            content,
            contentViewer: viewer,
            className,
            readOnly: readOnly || !this.isItemExcludable(content),
            checked: this.mustSelectItem(content),
            onCheckedChange: () => this.handleSelectionChange(),
        });
    }

    protected initListeners(): void {
        super.initListeners();
        const serverEvents = ContentServerEventsHandler.getInstance();

        const permissionsUpdatedHandler = (updatedItems: ContentSummaryAndCompareStatus[]): void => {
            const updatedIds = updatedItems.map(item => item.getId());
            const touched = this.getItems().some(item => updatedIds.includes(item.getId()));
            if (touched) this.notifyListChanged();
        };

        const deletedHandler = (deletedItems: ContentServerChangeItem[]) => {
            const touched = deletedItems.some(del =>
                this.getItems().some(item => item.getContentId().equals(del.getContentId()))
            );
            if (touched) this.notifyListChanged();
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

    onListChanged(listener: () => void) {
        this.listChangedListeners.push(listener);
    }

    onVisibleUpdated(listener: () => void) {
        this.visibleUpdatedListeners.push(listener);
    }
}
