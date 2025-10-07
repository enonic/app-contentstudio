import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import * as Q from 'q';
import {GetPrincipalsByKeysRequest} from '../../../../security/GetPrincipalsByKeysRequest';
import {WidgetItemView} from '../../WidgetItemView';
import {VersionHistoryList} from './VersionHistoryList';
import {ContentServerEventsHandler} from '../../../../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {ContentSummary} from '../../../../content/ContentSummary';
import {ContentVersionsLoader} from './ContentVersionsLoader';
import {VersionHistoryItem} from './VersionHistoryItem';
import {ContentId} from '../../../../content/ContentId';
import {ContentVersionsConverter} from './ContentVersionsConverter';
import {ContentVersions} from '../../../../ContentVersions';
import {VersionContext} from './VersionContext';

export class VersionHistoryView extends WidgetItemView {

    private versionListView: VersionHistoryList;

    private statusBlock: DivEl;

    private content: ContentSummaryAndCompareStatus;

    private readonly versionsLoader: ContentVersionsLoader;

    private creatorDisplayName: string;

    public static debug: boolean = false;

    constructor() {
        super('version-widget-item-view');

        this.versionsLoader = new ContentVersionsLoader();
        this.managePublishEvent();
    }

    public layout(): Q.Promise<void> {
        if (VersionHistoryView.debug) {
            console.debug('VersionsWidgetItemView.layout');
        }
        this.removeChildren();

        return super.layout().then(() => {
            this.versionListView = new VersionHistoryList();
            this.statusBlock = new DivEl('status');
            this.appendChildren(this.statusBlock, this.versionListView);
        });
    }

    private getContentStatus(content: ContentSummaryAndCompareStatus): string {
        const contentSummary: ContentSummary = content.getContentSummary();

        if (content.isScheduledPublishing()) {
            this.statusBlock.addClass('small');
            return i18n('widget.versionhistory.scheduled', DateHelper.formatDateTime(contentSummary.getPublishFromTime()));
        }

        if (content.isExpiredPublishing()) {
            this.statusBlock.addClass('small');
            return i18n('widget.versionhistory.expired', DateHelper.formatDateTime(contentSummary.getPublishToTime()));
        }

        if (content.isOnline() && !!contentSummary.getPublishToTime()) {
            this.statusBlock.addClass('small');
            return i18n('widget.versionhistory.publishedUntil', DateHelper.formatDateTime(contentSummary.getPublishToTime()));
        }

        return content.getStatusText();
    }

    public setContentAndUpdateView(content: ContentSummaryAndCompareStatus): Q.Promise<void> {
        if (VersionHistoryView.debug) {
            console.debug('VersionsWidgetItemView.setItem: ', content);
        }

        if (!this.versionListView) {
            return Q();
        }

        this.statusBlock.setClass(`status ${content.getStatusClass()}`);
        this.statusBlock.setHtml(this.getContentStatus(content));

        this.content = content;
        this.creatorDisplayName = null;

        return this.reloadActivePanel();
    }

    private managePublishEvent() {
        const serverEvents: ContentServerEventsHandler = ContentServerEventsHandler.getInstance();

        serverEvents.onContentPublished((contents: ContentSummaryAndCompareStatus[]) => {
            if (this.versionListView && this.content?.getContentId()) {
                // check for item because it can be null after publishing pending for delete item
                const itemId: ContentId = this.content.getContentId();
                const isPublished: boolean = contents.some((content: ContentSummaryAndCompareStatus) => {
                    return itemId.equals(content.getContentId());
                });

                if (isPublished) {
                    this.reloadActivePanel();
                }
            }
        });
    }

    private reloadActivePanel(): Q.Promise<void> {
        if (VersionHistoryView.debug) {
            console.debug('VersionsWidgetItemView.reloadActivePanel');
        }

        if (this.versionListView) {
            return this.fetchCreatorDisplayNameOnDemand().then(() => {
                return this.versionsLoader.load(this.content).then((versions: ContentVersions) => {
                    VersionContext.setActiveVersion(this.content.getId(), versions.getActiveVersionId());

                    const items: VersionHistoryItem[] = ContentVersionsConverter.create()
                        .setContent(this.content)
                        .setContentVersions(versions)
                        .setCreatorDisplayName(this.creatorDisplayName)
                        .build()
                        .toVersionHistoryItems();

                    this.versionListView.setContent(this.content);
                    this.versionListView.setItems(items);

                    return Q.resolve();
                });
            });
        }

        return Q.resolve();
    }

    private fetchCreatorDisplayNameOnDemand(): Q.Promise<void> {
        if (this.creatorDisplayName) {
            return Q();
        }

        const creatorKey = this.content.getContentSummary().getCreator();
        const creatorKeyAsString = creatorKey.toString();

        this.versionListView.getItems().some((item: VersionHistoryItem) => {
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
