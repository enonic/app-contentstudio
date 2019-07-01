import {DialogDependantList} from '../dialog/DependantItemsDialog';
import {StatusSelectionItem} from '../dialog/StatusSelectionItem';
import {ContentIds} from '../ContentIds';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {CompareStatus, CompareStatusChecker} from '../content/CompareStatus';
import i18n = api.util.i18n;
import ContentId = api.content.ContentId;
import ContentServerChangeItem = api.content.event.ContentServerChangeItem;
import Element = api.dom.Element;
import ContentSummary = api.content.ContentSummary;

export class PublishDialogDependantList
    extends DialogDependantList {

    private requiredIds: ContentIds;

    private removeClickListeners: { (item: ContentSummaryAndCompareStatus): void }[] = [];

    private listChangedListeners: { (): void }[] = [];

    constructor() {
        super();

        this.addClass('publish-dialog-dependant-list');
        this.requiredIds = ContentIds.empty();
    }

    refresh() {
        this.getItemViews().forEach((view: StatusSelectionItem) => {
            view.toggleClass('removable', this.isRemovable(view.getBrowseItem().getModel()));
        });
    }

    createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): Element {
        const statusView: StatusSelectionItem = <StatusSelectionItem>super.createItemView(item, readOnly);

        if (this.isRemovable(item)) {
            statusView.addClass('removable');
        }

        statusView.setIsRemovableFn(() => this.isRemovable(item));
        statusView.setRemoveHandlerFn(() => this.notifyItemRemoveClicked(item));

        statusView.setRemoveButtonTooltip(i18n('dialog.publish.excludeFromPublishing'));
        statusView.setRemoveButtonClickTooltip(i18n('dialog.publish.itemRequired'));

        if (!this.isContentSummaryValid(item)) {
            statusView.addClass('invalid');
        } else if (this.isContentReady(item)) {
            statusView.addClass('ready');
        } else if (this.isContentInProgress(item)) {
            statusView.addClass('in-progress');
        }

        if (this.isContentSummaryReadOnly(item)) {
            statusView.addClass('readonly');
            statusView.getEl().setTitle(i18n('field.readOnly'));
        }

        this.initListItemListeners(item, statusView);

        return statusView;
    }

    private isRemovable(item: ContentSummaryAndCompareStatus): boolean {
        const isPendingDelete: boolean = CompareStatusChecker.isPendingDelete(item.getCompareStatus());
        if (isPendingDelete) {
            return false;
        }

        return !this.requiredIds.contains(item.getContentId());
    }

    setRequiredIds(value: ContentId[]) {
        this.requiredIds = ContentIds.from(value);
    }

    private initListItemListeners(item: ContentSummaryAndCompareStatus, view: Element) {
        view.onClicked((event) => {
            if (!new api.dom.ElementHelper(<HTMLElement>event.target).hasClass('remove')) {
                this.notifyItemClicked(item);
            }
        });

        const serverEvents: ContentServerEventsHandler = ContentServerEventsHandler.getInstance();

        const updatedHandler = (data: ContentSummaryAndCompareStatus[]) => {
            if (data.some(updatedContent => updatedContent.getContentId().equals(item.getContentId()))) {
                this.notifyListChanged();
            }
        };
        const deletedHandler = (changedItems: ContentServerChangeItem[], pending?: boolean) => {
            if (changedItems.some(changedItem => changedItem.getContentId().equals(item.getContentId()))) {
                this.notifyListChanged();
            }
        };
        serverEvents.onContentUpdated(updatedHandler);
        serverEvents.onContentPermissionsUpdated(updatedHandler);
        serverEvents.onContentDeleted(deletedHandler);

        view.onRemoved(() => {
            serverEvents.unContentUpdated(updatedHandler);
            serverEvents.unContentPermissionsUpdated(updatedHandler);
            serverEvents.unContentDeleted(deletedHandler);
        });
    }

    private isContentSummaryValid(item: ContentSummaryAndCompareStatus): boolean {
        const status: CompareStatus = item.getCompareStatus();
        const summary: ContentSummary = item.getContentSummary();

        return status === CompareStatus.PENDING_DELETE ||
               (summary.isValid() && !api.util.StringHelper.isBlank(summary.getDisplayName()) && !summary.getName().isUnnamed());
    }

    private isContentSummaryReadOnly(item: ContentSummaryAndCompareStatus): boolean {
        return item.isReadOnly() === true; // can be undefined so thus to true
    }

    private isContentReady(item: ContentSummaryAndCompareStatus): boolean {
        return !item.isOnline() && item.getContentSummary().isReady();
    }

    private isContentInProgress(item: ContentSummaryAndCompareStatus): boolean {
        return !item.isOnline() && item.getContentSummary().isInProgress();
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
}
