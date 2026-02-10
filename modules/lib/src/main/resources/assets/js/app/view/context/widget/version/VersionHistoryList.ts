import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import Q from 'q';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {GetContentVersionsRequest} from '../../../../resource/GetContentVersionsRequest';
import {GetContentVersionsResult} from '../../../../resource/GetContentVersionsResult';
import {GetPrincipalsByKeysRequest} from '../../../../security/GetPrincipalsByKeysRequest';
import {BatchedContentVersionsConverter} from './BatchedContentVersionsConverter';
import {VersionHistoryItem} from './VersionHistoryItem';
import {VersionHistoryListItem} from './VersionHistoryListItem';

export class VersionHistoryList
    extends LazyListBox<VersionHistoryItem> {

    private static LOAD_SIZE: number = 20;

    private content: ContentSummaryAndCompareStatus;

    private cursor: string;

    private pendingLoadContent: ContentSummaryAndCompareStatus;

    private loading: boolean = false;

    private activeListItem: VersionHistoryListItem;

    private versionsConverter: BatchedContentVersionsConverter;

    private creatorDisplayName: string;

    constructor() {
        super('version-list');
    }

    setContent(content: ContentSummaryAndCompareStatus): void {
        if (this.loading) {
            this.pendingLoadContent = content;
            return;
        }

        this.content = content;
        this.creatorDisplayName = null;
        this.cursor = undefined;
        this.clearItems();
        this.versionsConverter = null;
        this.load();
        this.activeListItem = null;
    }

    createItemView(version: VersionHistoryItem): VersionHistoryListItem {
        return new VersionHistoryListItem(version, this.content).setActiveHandler(this.setActiveListItem.bind(this));
    }

    private setActiveListItem(item: VersionHistoryListItem): void {
        this.activeListItem?.setActive(false);

        if (item === this.activeListItem) {
            this.activeListItem = null;
        } else {
            this.activeListItem = item;
            this.activeListItem.setActive(true);
        }
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

        if (this.cursor != null) {
            this.load();
        }
    }

    private load(): void {
        this.loading = true;

        this.doLoad().then((result: GetContentVersionsResult) => {
            if (!this.versionsConverter) {
                this.versionsConverter = new BatchedContentVersionsConverter(this.content, this.creatorDisplayName);
            }

            this.cursor = result.getMetadata().cursor;
            const versionHistoryItems = this.versionsConverter.append(result.getContentVersions(), this.cursor != null);

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
        return this.fetchCreatorDisplayNameOnDemand().then(() => {
            return new GetContentVersionsRequest(this.content.getContentId())
                .setCursor(this.cursor)
                .setSize(VersionHistoryList.LOAD_SIZE)
                .sendAndParse();
        });
    }

    private fetchCreatorDisplayNameOnDemand(): Q.Promise<void> {
        if (this.creatorDisplayName) {
            return Q();
        }

        const creatorKey = this.content.getContentSummary().getCreator();
        const creatorKeyAsString = creatorKey.toString();

        this.getItems().some((item: VersionHistoryItem) => {
            if (item.getContentVersion().getModifier() === creatorKeyAsString)  {
                this.creatorDisplayName = item.getContentVersion().getModifierDisplayName();
                return true;
            }

            return false;
        });

        if (this.creatorDisplayName) {
            return Q();
        }

        return new GetPrincipalsByKeysRequest([creatorKey]).sendAndParse().then((principals) => {
            this.creatorDisplayName = principals.length > 0 ? principals[0].getDisplayName() : creatorKeyAsString;
            return Q();
        }).catch((e) => {
            this.creatorDisplayName = creatorKeyAsString;
            DefaultErrorHandler.handle(e)
        });
    }
}
