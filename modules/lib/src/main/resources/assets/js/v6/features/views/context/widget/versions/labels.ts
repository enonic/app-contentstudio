import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { Clock, ClockAlert, Pen, type LucideIcon } from 'lucide-react';
import { type ContentVersion } from '../../../../../../app/ContentVersion';
import {
    getVersionPublishStatus,
    VersionPublishStatus,
    getVersionConfig,
    resolveVersionOperationType,
    VersionOperationType,
} from '../../../../../entities/content/version';

const getFirstAction = (version: ContentVersion) => version.getActions()[0];

export type VersionBranch = 'draft' | 'master';

// Operations applied to a published content land on both branches, producing
// two version entries per event; a branch marker distinguishes them.
const BRANCH_AWARE_OPERATIONS = new Set<VersionOperationType>([
    VersionOperationType.PATCH,
    VersionOperationType.EDITORIAL_PATCH,
    VersionOperationType.METADATA,
    VersionOperationType.PERMISSIONS,
]);

export const getOperationLabel = (version: ContentVersion): string => {
    const config = getVersionConfig(version);
    if (!config) {
        return i18n('operation.content.unknown');
    }

    const type = resolveVersionOperationType(version);

    if (type === VersionOperationType.PUBLISH && getVersionPublishStatus(version) === VersionPublishStatus.SCHEDULED) {
        return i18n('operation.content.scheduled');
    }

    return i18n(config.labelKey);
};

/** Branch a version's action targeted, when the operation can apply to either. */
export const getVersionBranch = (version: ContentVersion): VersionBranch | undefined => {
    const type = resolveVersionOperationType(version);
    if (type == null || !BRANCH_AWARE_OPERATIONS.has(type)) {
        return undefined;
    }

    const origin = getFirstAction(version)?.getOrigin();
    return origin === 'draft' || origin === 'master' ? origin : undefined;
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
