import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {ContentId} from '../../../../content/ContentId';
import {ContentSummary} from '../../../../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentServerEventsHandler} from '../../../../event/ContentServerEventsHandler';
import {WidgetItemView} from '../../WidgetItemView';
import {VersionHistoryList} from './VersionHistoryList';

export class VersionHistoryView extends WidgetItemView {

    private versionListView: VersionHistoryList;

    private statusBlock: DivEl;

    private content: ContentSummaryAndCompareStatus;

    public static debug: boolean = false;

    constructor() {
        super('version-widget-item-view');

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

        this.versionListView?.setContent(this.content);

        return Q();
    }
}
