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
import {VersionListItem} from './VersionListItem';

interface VersionDate {
    [date: number]: string;
}

export class VersionList
    extends ListBox<ContentVersion> {

    private content: ContentSummaryAndCompareStatus;
    private loadedListeners: { (): void }[] = [];
    private lastDate: string;
    private versionDates: VersionDate = {};

    constructor() {
        super('version-list');
    }

    setContent(content: ContentSummaryAndCompareStatus) {
        this.content = content;
        this.lastDate = null;
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

    createItemView(version: ContentVersion): Element {
        const skipDuplicateVersion = this.versionDates[Number(version.getModified())] !== version.getId();

        const actionDate = version.hasPublishInfo() ? version.getPublishInfo().getTimestamp() : version.getModified();
        const thisDate = DateHelper.formatDate(actionDate);

        const versionListItem = new VersionListItem(version, this.content, skipDuplicateVersion);
        if (thisDate === this.lastDate) {
            versionListItem.addClass('hide-date');
        }

        if (version.isPublished() && !skipDuplicateVersion) {
            this.lastDate = DateHelper.formatDate(version.getModified());
        } else {
            this.lastDate = thisDate;
        }

        return versionListItem;
    }

    getItemId(item: ContentVersion): string {
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
        this.setItems(contentVersions);
    }

}
