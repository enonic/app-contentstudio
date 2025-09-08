import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import Q from 'q';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {GetContentVersionsRequest} from '../../../../resource/GetContentVersionsRequest';
import {GetContentVersionsResult} from '../../../../resource/GetContentVersionsResult';
import {BatchedContentVersionsConverter} from './BatchedContentVersionsConverter';
import {VersionHistoryItem} from './VersionHistoryItem';
import {VersionHistoryListItem} from './VersionHistoryListItem';

export class VersionHistoryList
    extends LazyListBox<VersionHistoryItem> {

    private static LOAD_SIZE: number = 20;

    private content: ContentSummaryAndCompareStatus;

    private totalCount: number = -1;

    private loadedCount: number = 0;

    private pendingLoadContent: ContentSummaryAndCompareStatus;

    private loading: boolean = false;

    private versionsConverter: BatchedContentVersionsConverter;

    constructor() {
        super('version-list');
    }

    setContent(content: ContentSummaryAndCompareStatus): void {
        if (this.loading) {
            this.pendingLoadContent = content;
            return;
        }

        this.content = content;
        this.loadedCount = 0;
        this.clearItems();
        this.versionsConverter = null;
        this.load();
    }

    createItemView(version: VersionHistoryItem): VersionHistoryListItem {
        return new VersionHistoryListItem(version, this.content);
    }

    getItemId(item: VersionHistoryItem): string {
        return item.getId();
    }

    protected handleLazyLoad(): void {
        if (this.pendingLoadContent) {
            const itemToLoad = this.pendingLoadContent;
            this.pendingLoadContent = null;
            this.setContent(itemToLoad);
            return;
        }

        super.handleLazyLoad();

        if (this.loadedCount !== this.totalCount) {
            this.load();
        }
    }

    private load(): void {
        this.loading = true;

        this.doLoad().then((result: GetContentVersionsResult) => {
            if (!this.versionsConverter) {
                this.versionsConverter = new BatchedContentVersionsConverter(this.content);
                this.totalCount = result.getMetadata().totalHits;
            }

            this.loadedCount += result.getMetadata().hits;

            const versionHistoryItems = this.versionsConverter.append(result.getContentVersions(), this.loadedCount < this.totalCount);

            this.addItems(versionHistoryItems.slice(this.getItemCount(), versionHistoryItems.length));
            this.addMissingCompareButtons();
        }).catch(DefaultErrorHandler.handle).finally(() => {
            this.loading = false;

            if (this.pendingLoadContent) {
                const itemToLoad = this.pendingLoadContent;
                this.pendingLoadContent = null;
                this.setContent(itemToLoad);
            }
        });
    }

    private doLoad(): Q.Promise<GetContentVersionsResult> {
        return new GetContentVersionsRequest(this.content.getContentId())
            .setFrom(this.loadedCount)
            .setSize(VersionHistoryList.LOAD_SIZE)
            .sendAndParse();
    }

    private addMissingCompareButtons(): void {
        this.getItemViews().forEach((view: VersionHistoryListItem, index) => {
            if (!view.hasCompareButton() && view.isComparableItem()) {
                if (this.getItemViews().slice(index + 1).some((itemView: VersionHistoryListItem) => itemView.isComparableItem())) {
                    view.addCompareButton();
                }
            }
        });
    }
}
