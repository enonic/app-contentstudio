import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import Q from 'q';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersionPublishInfo} from '../../../../ContentVersionPublishInfo';
import {GetContentVersionsRequest} from '../../../../resource/GetContentVersionsRequest';
import {GetContentVersionsResult} from '../../../../resource/GetContentVersionsResult';
import {VersionHistoryItem, VersionHistoryItemBuilder} from './VersionHistoryItem';
import {VersionHistoryListHelper} from './VersionHistoryListHelper';
import {VersionHistoryListItem} from './VersionHistoryListItem';

export class VersionHistoryList
    extends LazyListBox<VersionHistoryItem> {

    private static LOAD_SIZE: number = 20;

    private content: ContentSummaryAndCompareStatus;

    private totalCount: number = -1;

    private lastDate: string;

    private loadedItems: ContentVersion[] = [];

    private pendingLoadContent: ContentSummaryAndCompareStatus;

    private loading: boolean = false;

    constructor() {
        super('version-list');
    }

    setContent(content: ContentSummaryAndCompareStatus): void {
        if (this.loading) {
            this.pendingLoadContent = content;
            return;
        }

        this.content = content;
        this.loadedItems = [];
        this.clearItems();
        this.load();
        this.lastDate = null;
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

        if (this.loadedItems.length !== this.totalCount) {
            this.load();
        }
    }

    private load(): void {
        this.loading = true;

        this.doLoad().then((result: GetContentVersionsResult) => {
            const versions = result.getContentVersions();

            this.loadedItems.push(...versions);
            this.totalCount = result.getMetadata().totalHits;

            const versionHistoryItems = this.makeVersionHistoryItems(this.loadedItems);

            this.addItems(versionHistoryItems.slice(this.getItemCount(), versionHistoryItems.length));
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
            .setFrom(this.loadedItems.length)
            .setSize(VersionHistoryList.LOAD_SIZE)
            .sendAndParse();
    }

    private makeVersionHistoryItems(loadedBatch: ContentVersion[]): VersionHistoryItem[] {
        const result: VersionHistoryItem[] = [];

        loadedBatch.forEach((version: ContentVersion, index: number) => {
            const previousVersion = loadedBatch[index + 1];

            // can't compare last version in the batch with the next one until the next batch is loaded
            if (!previousVersion && !this.isFirstVersion(version, loadedBatch)) {
                return;
            }

            const item = version.hasPublishInfo() ? this.createHistoryItemFromPublishInfo(version, index)
                                                  : this.createHistoryItemFromVersion(version, previousVersion);
            result.push(item);

            if (this.isSameVersionForDraftAndMaster(version, previousVersion)) {
                result.push(this.createHistoryItemFromVersion(version, previousVersion));
            }
        });

        return result;
    }

    private createHistoryItemFromPublishInfo(version: ContentVersion, index: number): VersionHistoryItem {
        const publishDateAsString: string = DateHelper.formatDate(version.getDisplayDate());
        const publishInfo: ContentVersionPublishInfo = version.getPublishInfo();

        const builder: VersionHistoryItemBuilder = new VersionHistoryItemBuilder()
            .setStatus(VersionHistoryListHelper.getPublishVersionItemStatus(version))
            .setVersion(version)
            .setDateTime(publishInfo.getTimestamp())
            .setUser(publishInfo.getPublisherDisplayName() || publishInfo.getPublisher())
            .setSkipDate(publishDateAsString === this.lastDate)
            .setRepublished(this.isRepublished(version, index))
            .setMessage(publishInfo.getMessage())
            .setContentId(this.content.getContentId());

        if (publishInfo.isPublished()) {
            builder.setActiveTo(publishInfo.getPublishedTo());

            if (!publishInfo.isScheduled()) {
                builder.setActiveFrom(publishInfo.getPublishedFrom());
            }
        }

        this.lastDate = publishDateAsString;

        return builder.build();
    }

    private isRepublished(version: ContentVersion, index: number): boolean {
        if (!version.isPublished()) {
            return false;
        }

        const publishedFrom: string = DateHelper.formatDateTime(version.getPublishInfo().getPublishedFrom());
        const items = this.getItems().map(item => item.getContentVersion());

        return items.some((v: ContentVersion, i: number) => {
            if (i <= index || !v.isPublished()) {
                return false;
            }

            const vPublishedFrom: string = DateHelper.formatDateTime(v.getPublishInfo().getPublishedFrom());
            return publishedFrom === vPublishedFrom;
        });
    }

    private isSameVersionForDraftAndMaster(publishedVersion: ContentVersion, previousVersion?: ContentVersion): boolean {
        const publishInfo: ContentVersionPublishInfo = publishedVersion.getPublishInfo();

        if (publishInfo?.isPublished() || publishInfo?.isScheduled()) {
            return previousVersion?.hasPublishInfo() || publishedVersion.getTimestamp().getTime() -
                   publishedVersion.getModified().getTime() < VersionHistoryListHelper.FILTER_STEP_MS;
        }

        return false;
    }

    private createHistoryItemFromVersion(version: ContentVersion, previousVersion?: ContentVersion): VersionHistoryItem {
        const isFirstVersion = !previousVersion;
        const timestamp: Date = isFirstVersion ? this.content.getContentSummary().getCreatedTime() : version.getTimestamp();
        const timestampAsString: string = DateHelper.formatDate(timestamp);

        const item: VersionHistoryItem = new VersionHistoryItemBuilder()
            .setStatus(VersionHistoryListHelper.getRegularVersionItemStatus(version, previousVersion))
            .setDateTime(timestamp)
            .setVersion(version)
            .setUser(version.getModifierDisplayName() || version.getModifier())
            .setSkipDate(timestampAsString === this.lastDate)
            .setContentId(this.content.getContentId())
            .build();

        this.lastDate = timestampAsString;

        return item;
    }

    private isFirstVersion(version: ContentVersion, loadedBatch: ContentVersion[]): boolean {
        return this.loadedItems.length >= this.totalCount && version.getId() === loadedBatch.slice().pop()?.getId();
    }

}
