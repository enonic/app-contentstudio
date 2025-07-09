import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import * as Q from 'q';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersionPublishInfo} from '../../../../ContentVersionPublishInfo';
import {GetContentVersionsRequest} from '../../../../resource/GetContentVersionsRequest';
import {GetContentVersionsResult} from '../../../../resource/GetContentVersionsResult';
import {VersionContext} from './VersionContext';
import {VersionHistoryItem, VersionHistoryItemBuilder} from './VersionHistoryItem';
import {VersionHistoryListHelper} from './VersionHistoryListHelper';
import {VersionHistoryListItem} from './VersionHistoryListItem';

export class VersionHistoryList
    extends LazyListBox<VersionHistoryItem> {

    private static LOAD_SIZE: number = 10;

    private content: ContentSummaryAndCompareStatus;

    private totalCount: number = -1;

    private lastDate: string;

    private loadedItems: ContentVersion[] = [];

    constructor() {
        super('version-list');
    }

    setContent(content: ContentSummaryAndCompareStatus): void {
        if (ObjectHelper.equals(this.content, content)) {
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
        super.handleLazyLoad();

        if (this.loadedItems.length !== this.totalCount) {
            this.load();
        }
    }

    private load(): void {
        this.doLoad().then((result: GetContentVersionsResult) => {
            const versions = result.getContentVersions();

            if (this.loadedItems.length === 0) {
                VersionContext.setActiveVersion(this.content.getId(), versions.getActiveVersionId());
            }

            this.loadedItems.push(...versions.get().slice());
            this.totalCount = result.getMetadata().totalHits;

            const filteredNoSameVersions = VersionHistoryListHelper.filterSameVersions(this.loadedItems);
            const versionHistoryItems = this.makeVersionHistoryItems(filteredNoSameVersions);

            this.addItems(versionHistoryItems.slice(this.getItemCount(), versionHistoryItems.length));
        }).catch(DefaultErrorHandler.handle);
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
