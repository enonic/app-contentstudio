import {ElementHelper} from '@enonic/lib-admin-ui/dom/ElementHelper';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {StatusSelectionItem} from './StatusSelectionItem';

export type ItemEventListener = (item: ContentSummaryAndCompareStatus) => void;

export class DialogMainItemsList
    extends ListBox<ContentSummaryAndCompareStatus> {

    private itemClickListeners: ItemEventListener[] = [];

    private removeClickListeners: ItemEventListener[] = [];

    constructor(className?: string) {
        super(className);

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        // empty
    }

    protected initListeners(): void {
        // empty
    }

    protected createItemViewer(): ContentSummaryAndCompareStatusViewer {
        return new ContentSummaryAndCompareStatusViewer();
    }

    createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): StatusSelectionItem {
        const itemViewer = this.createItemViewer();

        itemViewer.setObject(item);

        const statusItem = this.createSelectionItem(itemViewer, item);

        statusItem.setIsRemovableFn(() => this.isItemRemovable(statusItem));
        statusItem.setRemoveHandlerFn(() => {
            this.removeItems(item);
            this.notifyItemRemoveClicked(item);
        });

        itemViewer.onClicked((event) => {
            if (item.isPendingDelete()) {
                return;
            }
            const el = new ElementHelper(event.target as HTMLElement);
            if (!(el.hasClass('remove') || el.hasClass('include-children-toggler'))) {
                this.notifyItemClicked(item);
            }
        });

        return statusItem;
    }

    protected createSelectionItem(viewer: ContentSummaryAndCompareStatusViewer,
                                  browseItem: ContentSummaryAndCompareStatus): StatusSelectionItem {
        return new StatusSelectionItem(viewer, browseItem);
    }

    protected isItemRemovable(item: StatusSelectionItem): boolean {
        return this.getItemCount() > 1;
    }

    getItemView(item: ContentSummaryAndCompareStatus): StatusSelectionItem {
        return super.getItemView(item) as StatusSelectionItem;
    }

    getItemViews(): StatusSelectionItem[] {
        return super.getItemViews() as StatusSelectionItem[];
    }

    getItemId(item: ContentSummaryAndCompareStatus): string {
        return item.getContentSummary().getId();
    }

    getItemsIds(): ContentId[] {
        return this.getItems().map(item => item.getContentId());
    }


    onItemClicked(listener: ItemEventListener) {
        this.itemClickListeners.push(listener);
    }

    unItemClicked(listener: ItemEventListener) {
        this.itemClickListeners = this.itemClickListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    protected notifyItemClicked(item: ContentSummaryAndCompareStatus) {
        this.itemClickListeners.forEach(listener => {
            listener(item);
        });
    }

    onItemRemoveClicked(listener: ItemEventListener): void {
        this.removeClickListeners.push(listener);
    }

    unItemRemoveClicked(listener: ItemEventListener): void {
        this.removeClickListeners = this.removeClickListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    protected notifyItemRemoveClicked(item: ContentSummaryAndCompareStatus): void {
        this.removeClickListeners.forEach(listener => listener(item));
    }
}
