import {DialogDependantList} from '../dialog/DependantItemsDialog';
import {StatusSelectionItem} from '../dialog/StatusSelectionItem';
import {ContentIds} from '../ContentIds';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {CompareStatus, CompareStatusChecker} from '../content/CompareStatus';
import i18n = api.util.i18n;
import ContentId = api.content.ContentId;
import ContentServerChangeItem = api.content.event.ContentServerChangeItem;

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

    createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): api.dom.Element {
        const view = super.createItemView(item, readOnly);
        const isPendingDelete = CompareStatusChecker.isPendingDelete(item.getCompareStatus());
        const isRemovable = !this.requiredIds.contains(item.getContentId()) && !isPendingDelete;

        if (isRemovable) {
            view.addClass('removable');
        }

        const statusView = <StatusSelectionItem> view;

        statusView.setIsRemovableFn(() => !this.requiredIds.contains(item.getContentId()) && !isPendingDelete);
        statusView.setRemoveHandlerFn(() => this.notifyItemRemoveClicked(item));

        statusView.setRemoveButtonTooltip(i18n('dialog.publish.excludeFromPublishing'));
        statusView.setRemoveButtonClickTooltip(i18n('dialog.publish.itemRequired'));

        if (!this.isContentSummaryValid(item)) {
            view.addClass('invalid');
        }

        if (this.isContentSummaryReadOnly(item)) {
            view.addClass('readonly');
            view.getEl().setTitle(i18n('field.readOnly'));
        }

        this.initListItemListeners(item, view);

        return view;
    }

    setRequiredIds(value: ContentId[]) {
        this.requiredIds = ContentIds.from(value);
    }

    private initListItemListeners(item: ContentSummaryAndCompareStatus, view: api.dom.Element) {
        view.onClicked((event) => {
            if (!new api.dom.ElementHelper(<HTMLElement>event.target).hasClass('remove')) {
                this.notifyItemClicked(item);
            }
        });

        const serverEvents = ContentServerEventsHandler.getInstance();

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
        let status = item.getCompareStatus();
        let summary = item.getContentSummary();

        return status === CompareStatus.PENDING_DELETE ||
               (summary.isValid() && !api.util.StringHelper.isBlank(summary.getDisplayName()) && !summary.getName().isUnnamed());
    }

    private isContentSummaryReadOnly(item: ContentSummaryAndCompareStatus): boolean {
        return item.isReadOnly() === true; // can be undefined so thus to true
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
