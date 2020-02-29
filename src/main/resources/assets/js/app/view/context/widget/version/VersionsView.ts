import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {LiEl} from 'lib-admin-ui/dom/LiEl';
import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersions} from '../../../../ContentVersions';
import {GetContentVersionsForViewRequest} from '../../../../resource/GetContentVersionsForViewRequest';
import {CompareStatus} from '../../../../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {Branch} from '../../../../versioning/Branch';
import {ContentVersionListItemView} from './ContentVersionListItemView';
import {ContentVersionListItem} from './ContentVersionListItem';

export class VersionsView
    extends ListBox<ContentVersionListItem> {

    private content: ContentSummaryAndCompareStatus;
    private loadedListeners: { (): void }[] = [];
    private activeVersionId: string;

    constructor() {
        super('all-content-versions');
    }

    setContentData(item: ContentSummaryAndCompareStatus) {
        this.content = item;
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

    createItemView(item: ContentVersionListItem, readOnly: boolean): Element {
        const itemContainer: LiEl = new ContentVersionListItemView(item, this.activeVersionId, this.content)
            .toggleClass('active', item.isActive());

        return itemContainer;
    }

    getItemId(item: ContentVersionListItem): string {
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

        return new GetContentVersionsForViewRequest(this.getContentId()).sendAndParse().then((contentVersions: ContentVersions) => {
            this.activeVersionId = contentVersions.getActiveVersion().getId();
            return contentVersions.getContentVersions();
        });
    }

    private updateView(contentVersions: ContentVersion[]) {
        this.clearItems();
        this.setItems(this.processContentVersions(contentVersions));
    }

    private processContentVersions(contentVersions: ContentVersion[]): ContentVersionListItem[] {
        const result: ContentVersionListItem[] = [];

        contentVersions.forEach((contentVersion: ContentVersion) => {
            const isActive: boolean = contentVersion.getId() === this.activeVersionId;

            const workspace: Branch = contentVersion.isInMaster() ? Branch.MASTER : Branch.DRAFT;
            result.push(new ContentVersionListItem(contentVersion, workspace, isActive));
        });

        return result;
    }

}
