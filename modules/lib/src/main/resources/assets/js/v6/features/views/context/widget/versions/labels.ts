import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Clock, ClockAlert, Pen, type LucideIcon} from 'lucide-react';
import {type ContentVersion} from '../../../../../../app/ContentVersion';
import {getVersionPublishStatus, VersionPublishStatus} from '../../../../store/context/versionPublishState';
import {
    getVersionConfig,
    resolveVersionOperationType,
    VersionOperationType,
} from '../../../../store/context/versionOperations';

const getFirstAction = (version: ContentVersion) => version.getActions()[0];

export const getOperationLabel = (version: ContentVersion): string => {
    const config = getVersionConfig(version);
    if (!config) {
        return i18n('operation.content.unknown');
    }

    const type = resolveVersionOperationType(version);

    if (type === VersionOperationType.PUBLISH && getVersionPublishStatus(version) === VersionPublishStatus.SCHEDULED) {
        return i18n('operation.content.scheduled');
    }

    if (type === VersionOperationType.PATCH || type === VersionOperationType.EDITORIAL_PATCH) {
        const origin = getFirstAction(version)?.getOrigin();

        if (origin === 'draft') {
            return i18n('operation.content.patch.draft');
        }
        if (origin === 'master') {
            return i18n('operation.content.patch.master');
        }
    }

    return i18n(config.labelKey);
};

export const getModifierLabel = (version: ContentVersion): string | undefined => {
    const modifierName = version.getActions()[0]?.getUserDisplayName();
    return modifierName ? i18n('field.version.by', modifierName) : undefined;
};

export const getIconForOperation = (version: ContentVersion): LucideIcon => {
    const type = resolveVersionOperationType(version);

    if (type === VersionOperationType.PUBLISH) {
        const status = getVersionPublishStatus(version);
        if (status === VersionPublishStatus.SCHEDULED) {
            return Clock;
        }
        if (status === VersionPublishStatus.EXPIRED) {
            return ClockAlert;
        }
    }

    const config = getVersionConfig(version);
    return config?.icon ?? Pen;
};
