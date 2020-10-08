import {ContentVersion} from '../../../../ContentVersion';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {i18n} from 'lib-admin-ui/util/Messages';

export class VersionViewer
    extends NamesAndIconViewer<ContentVersion> {

    constructor() {
        super('version-viewer');
    }

    resolveIconClass(version: ContentVersion): string {
        if (version.isPublished()) {
            return 'icon-version-published';
        }
        if (version.isUnpublished()) {
            return 'icon-version-unpublished';
        }
        if (version.isInReadyState()) {
            return 'icon-state-ready';
        }

        return 'icon-version-modified';
    }

    resolveDisplayName(version: ContentVersion): string {
        const modifiedDate = version.hasPublishInfo() ?
                             version.getPublishInfo().getPublishDate() : version.getModified();
        let displayName = `${DateHelper.formatDateTime(modifiedDate)}`;

        if (version.hasPublishInfo() && !version.isCurrentlyPublished()) {
            displayName = '';
            const publishedFrom = version.getPublishInfo().getPublishedFrom();
            if (publishedFrom) {
                displayName = `${i18n('text.from')}: ${DateHelper.formatDateTime(publishedFrom)}`;
            }
            const publishedTo = version.getPublishInfo().getPublishedTo();
            if (publishedTo) {
                if (displayName.length > 0) {
                    displayName += '<br>';
                }
                displayName += `${i18n('text.to')}: ${DateHelper.formatDateTime(publishedTo)}`;
            }
        }

        return displayName;
    }

    resolveSubName(version: ContentVersion): string {
        const modifierName = version.hasPublishInfo() ?
                             version.getPublishInfo().getPublisherDisplayName() : version.getModifierDisplayName();
        return i18n('dialog.compareVersions.versionSubName', '', modifierName);
    }

    setObject(version: ContentVersion) {
        this.toggleClass('divider', version.isActive() && !version.isAlias());

        return super.setObject(version);
    }
}
