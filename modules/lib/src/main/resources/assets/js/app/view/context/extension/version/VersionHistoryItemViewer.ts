import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type VersionHistoryItem} from './VersionHistoryItem';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';

export class VersionHistoryItemViewer
    extends NamesAndIconViewer<VersionHistoryItem> {

    private readonly namesAndIconViewWrapperDiv: DivEl;

    constructor() {
        super('version-viewer', NamesAndIconViewSize.compact);

        this.namesAndIconViewWrapperDiv = new DivEl('wrapper');
    }

    resolveIconClass(version: VersionHistoryItem): string {
        return version.getIconCls() || '';
    }

    resolveDisplayName(version: VersionHistoryItem): string {
        const dateTimeToString = DateHelper.getFormattedTimeFromDate(version.getDateTime());
        return `${dateTimeToString} ${version.getStatusAsString()}`;
    }

    resolveSubName(version: VersionHistoryItem): string {
        const byUser: string = i18n('widget.versionhistory.byUser', version.getUser());

        if (this.isPublishedFrom(version)) {
            const from: string = i18n('tooltip.from', DateHelper.formatDateTime(version.getActiveFrom(), false));
            return `${from} ${byUser}`;
        }

        return byUser;
    }

    private isPublishedFrom(version: VersionHistoryItem): boolean {
        return version.isPublishAction() && !version.isRepublished() && !version.isInstantlyPublished();
    }

    setObject(version: VersionHistoryItem) {
        this.toggleClass('publish-action', version.isPublishAction());
        this.addClass(version.getStatus());
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
