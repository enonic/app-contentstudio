import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {VersionHistoryItem} from './VersionHistoryItem';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';

export class VersionHistoryListItemViewer
    extends NamesAndIconViewer<VersionHistoryItem> {

    private namesAndIconViewWrapperDiv: DivEl;

    constructor() {
        super('version-viewer');

        this.namesAndIconViewWrapperDiv = new DivEl('wrapper');
    }

    resolveIconClass(version: VersionHistoryItem): string {
        return version.getIconCls() || '';
    }

    resolveDisplayName(version: VersionHistoryItem): string {
        const dateTimeToString = DateHelper.getFormattedTimeFromDate(version.getDateTime());

        return `${dateTimeToString} ${version.getStatus()}`;
    }

    resolveSubName(version: VersionHistoryItem): string {
        let publishedFrom = '';
        if (version.isPublishAction() && !version.isRepublished() && !version.isInstantlyPublished()) {
            publishedFrom = i18n('tooltip.from', DateHelper.formatDateTime(version.getActiveFrom(), false)) + ' ';
        }
        return publishedFrom + i18n('widget.versionhistory.byUser', version.getUser());
    }

    setObject(version: VersionHistoryItem) {
        this.toggleClass('publish-action', version.isPublishAction());
        this.toggleClass('active', version.isActive());
        return super.setObject(version);
    }

    doLayout(version: VersionHistoryItem): void {
        super.doLayout(version);

        this.namesAndIconView.wrapWithElement(this.namesAndIconViewWrapperDiv);
    }

    appendToNamesAndIconViewWrapper(el: Element) {
        this.namesAndIconViewWrapperDiv.appendChild(el);
    }
}
