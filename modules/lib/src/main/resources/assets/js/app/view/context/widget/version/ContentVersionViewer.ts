import {ContentVersion} from '../../../../ContentVersion';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {NamesAndIconView, NamesAndIconViewBuilder} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {VersionHistoryItem} from './VersionHistoryItem';
import {VersionContext} from './VersionContext';

export class ContentVersionViewer
    extends Viewer<VersionHistoryItem> {

    protected namesAndIconView: NamesAndIconView;

    constructor() {
        super();
        this.namesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.compact).build();
        this.appendChild(this.namesAndIconView);
    }

    private getIconClass(version: VersionHistoryItem): string {
        return version.getIconCls();
    }

    setObject(item: VersionHistoryItem) {
        const version: ContentVersion = item.getContentVersion();
        const displayDate: Date = item.getDateTime();
        const displayName: string = version.hasPublishInfo() ?
                             version.getPublishInfo().getPublisherDisplayName() : version.getModifierDisplayName();
        const isAlias: boolean = item.isAlias();
        const dateTime: string = `${DateHelper.formatDate(displayDate)} ${DateHelper.getFormattedTimeFromDate(displayDate)}`;
        const subName: string = i18n('text.by', isAlias ? dateTime : '', displayName);

        this.toggleClass('divider', this.isVersionActive(item) && !item.isAlias());

        this.namesAndIconView
            .setMainName(isAlias ? item.getAliasDisplayName() : dateTime)
            .setSubName(subName)
            .setIconClass(this.getIconClass(item));

        return super.setObject(item);
    }

    private isVersionActive(item: VersionHistoryItem): boolean {
        return VersionContext.isActiveVersion(item.getContentIdAsString(), item.getContentVersion().getId());
    }
}
