import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersions} from '../../../../ContentVersions';
import {GetContentVersionsRequest} from '../../../../resource/GetContentVersionsRequest';
import {CompareStatus} from '../../../../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {VersionHistoryListItem} from './VersionHistoryListItem';
import {VersionHistoryItem} from './VersionHistoryItem';

interface VersionDate {
    [date: number]: string;
}

export class VersionHistoryList
    extends ListBox<VersionHistoryItem> {

    private content: ContentSummaryAndCompareStatus;
    private loadedListeners: { (): void }[] = [];
    private versionDates: VersionDate = {};

    constructor() {
        super('version-list');
    }

    setContent(content: ContentSummaryAndCompareStatus) {
        this.content = content;
    }

    getContentId(): ContentId {
        return this.content ? this.content.getContentId() : null;
    }

    getCompareStatus(): CompareStatus {
        return this.content ? this.content.getCompareStatus() : null;
    }

    reload(): Q.Promise<void> {
        return this.loadData().then((contentVersions: ContentVersion[]) => {
            this.updateView(contentVersions);
            this.notifyLoaded();
        }).catch(DefaultErrorHandler.handle);
    }

    private versionsToHistoryItems(contentVersions: ContentVersion[]): VersionHistoryItem[] {
        const versionHistoryItems: VersionHistoryItem[] = [];
        let lastDate: string = null;
        const createdTime: number = Number(this.content.getContentSummary().getCreatedTime());

        contentVersions.forEach((version: ContentVersion) => {
            const skipDuplicateVersion: boolean = this.versionDates[Number(version.getModified())] !== version.getId();

            if (version.hasPublishInfo()) {
                const publishDate: string = DateHelper.formatDate(version.getPublishInfo().getTimestamp());
                versionHistoryItems.push(
                    VersionHistoryItem.fromPublishInfo(version.getPublishInfo()).setSkipDate(publishDate === lastDate)
                );
                lastDate = publishDate;
            }

            if (!skipDuplicateVersion) {
                const isFirstVersion: boolean = createdTime === Number(version.getModified());
                const modifiedDate: string = DateHelper.formatDate(version.getModified());

                if (!version.isUnpublished()) {
                    versionHistoryItems.push(
                        VersionHistoryItem.fromContentVersion(version, isFirstVersion).setSkipDate(modifiedDate === lastDate)
                    );
                }

                lastDate = modifiedDate;
            }
        });

        return versionHistoryItems;
    }

    createItemView(version: VersionHistoryItem): Element {
        return new VersionHistoryListItem(version, this.content);
    }

    getItemId(item: VersionHistoryItem): string {
        return item.getId();
    }

    onLoaded(listener: () => void) {
        this.loadedListeners.push(listener);
    }

    unLoaded(listener: () => void) {
        this.loadedListeners = this.loadedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyLoaded() {
        this.loadedListeners.forEach((listener) => {
            listener();
        });
    }

    private loadData(): Q.Promise<ContentVersion[]> {
        if (!this.getContentId()) {
            throw new Error('Required contentId not set for ActiveContentVersionsTreeGrid');
        }

        return new GetContentVersionsRequest(this.getContentId()).sendAndParse().then((contentVersions: ContentVersions) => {
            contentVersions.getContentVersions().forEach((version: ContentVersion) => {
                this.versionDates[Number(version.getModified())] = version.getId();
            });
            return contentVersions.getContentVersions();
        });
    }

    private updateView(contentVersions: ContentVersion[]) {
        this.clearItems();
        this.setItems(this.versionsToHistoryItems(contentVersions));
    }

}
