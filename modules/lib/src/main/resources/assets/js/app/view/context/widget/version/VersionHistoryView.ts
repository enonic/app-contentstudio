import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {ContentSummary} from '../../../../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentVersionHelper} from '../../../../ContentVersionHelper';
import {WidgetItemView} from '../../WidgetItemView';
import {VersionHistoryList} from './VersionHistoryList';

export class VersionHistoryView extends WidgetItemView {

    private versionListView: VersionHistoryList;

    private statusBlock: DivEl;

    private content: ContentSummaryAndCompareStatus;

    public static debug: boolean = false;

    constructor() {
        super('version-widget-item-view');
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

        this.content = content;
        this.statusBlock.setClass(`status ${content.getStatusClass()}`).setHtml(this.getContentStatus(content));

        return this.reloadActivePanel();
    }

    private reloadActivePanel(): Q.Promise<void> {
        if (VersionHistoryView.debug) {
            console.debug('VersionsWidgetItemView.reloadActivePanel');
        }

        if (this.versionListView && this.content) {
            ContentVersionHelper.fetchAndSetActiveVersion(this.content.getContentId()).then(() => {
                this.versionListView.setContent(this.content);
            });
        }

        return Q();
    }
}
