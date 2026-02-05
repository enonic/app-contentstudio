import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {atom, computed} from 'nanostores';
import {ContentId} from '../../../../app/content/ContentId';
import {ContentVersion} from '../../../../app/ContentVersion';
import {revert} from '../../api/versions';

import {
    Archive,
    ArchiveRestore,
    ArrowDownNarrowWide,
    ArrowLeftRight, CaseSensitive,
    CircleCheckBig,
    CircleUserRound,
    Clock,
    ClockAlert,
    CloudCheck,
    CloudOff,
    Copy,
    FilePenLine, FolderInput,
    LucideIcon,
    Pen,
    PenLine,
    SquarePen,
} from 'lucide-react';

// ============================================================================
// Constants
// ============================================================================

const MAX_SELECTED_VERSIONS = 2;

export const ContentOperation = {
    CREATE: 'content.create',
    DUPLICATE: 'content.duplicate',
    UPDATE: 'content.update',
    PERMISSIONS: 'content.permissions',
    MOVE: 'content.move',
    SORT: 'content.sort',
    PATCH: 'content.patch',
    ARCHIVE: 'content.archive',
    RESTORE: 'content.restore',
    PUBLISH: 'content.publish',
    UNPUBLISH: 'content.unpublish',
    METADATA: 'content.updateMetadata',
    WORKFLOW: 'content.updateWorkflow',
} as const;

export type ContentOperation = typeof ContentOperation[keyof typeof ContentOperation];

const CONTENT_OPERATION_SET = new Set<string>(Object.values(ContentOperation));

export const isContentOperation = (value: string): value is ContentOperation =>
    CONTENT_OPERATION_SET.has(value);

export const ContentField = {
    DISPLAY_NAME: 'displayName',
    DATA: 'data',
    X: 'x',
    PAGE: 'page',
    OWNER: 'owner',
    LANGUAGE: 'language',
    PUBLISH: 'publish',
    WORKFLOW: 'workflow',
    VARIANT_OF: 'variantOf',
    ATTACHMENTS: 'attachments',
    NAME: 'name',
    PARENT_PATH: 'parentPath',
    MANUAL_ORDER: 'manualOrderValue',
} as const;

const REVERTIBLE_FIELDS = new Set<string>([
    ContentField.DISPLAY_NAME,
    ContentField.DATA,
    ContentField.X,
    ContentField.PAGE,
    ContentField.OWNER,
    ContentField.LANGUAGE,
]);

export const isRevertibleField = (field: string): boolean => REVERTIBLE_FIELDS.has(field);

export const VersionPublishStatus = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    SCHEDULED: 'scheduled',
    EXPIRED: 'expired',
} as const;

export type VersionPublishStatus = typeof VersionPublishStatus[keyof typeof VersionPublishStatus];

export type VersionsDisplayModeType = 'standard' | 'full';

// ============================================================================
// Stores
// ============================================================================

export const $versions = atom<ContentVersion[]>([]);

export const $versionsDisplayMode = atom<VersionsDisplayModeType>('standard');

export const $selectedVersions = atom<ReadonlySet<string>>(new Set());

export const $activeVersionId = computed($versions, (versions) => versions[0]?.getId());

export const $selectionModeOn = computed($selectedVersions, (selected) => selected.size > 0);

export const $versionsByDate = computed(
    [$versions, $versionsDisplayMode],
    (versions, displayMode) => {
        const filteredVersions = displayMode === 'standard'
                                 ? versions.filter((version) => isVersionToBeDisplayedByDefault(version))
                                 : versions.filter((version) => isVersionToBeDisplayedInFullMode(version));

        return filteredVersions.reduce<Record<string, ContentVersion[]>>((acc, version) => {
            const dateKey = getFormattedVersionDate(version);
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(version);
            return acc;
        }, {});
    }
);

export const $onlineVersionId = atom<string | null>(null);

// ============================================================================
// Version Helpers
// ============================================================================

const getFirstAction = (version: ContentVersion) => version.getActions()[0];

const hasPublishAction = (version: ContentVersion): boolean =>
    version.getActions().some((action) => action.getOperation() === ContentOperation.PUBLISH);

const hasUnpublishAction = (version: ContentVersion): boolean =>
    version.getActions().some((action) => action.getOperation() === ContentOperation.UNPUBLISH);

/** Formats version date as YYYY-MM-DD */
export const getFormattedVersionDate = (version: ContentVersion): string => {
    const timestamp = version.getTimestamp();
    const year = timestamp.getFullYear();
    const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
    const day = timestamp.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const isStandardModeVersion = (version: ContentVersion): boolean => {
    const action = getFirstAction(version);

    if (!action) {
        return false;
    }

    const operation = action.getOperation();

    if (operation === ContentOperation.CREATE || operation === ContentOperation.PUBLISH || operation === ContentOperation.UNPUBLISH) {
        return true;
    }

    if (operation === ContentOperation.UPDATE) {
        return action.getFields().some(isRevertibleField);
    }

    return false;
};

export const isVersionRevertable = (version: ContentVersion): boolean => {
    const action = getFirstAction(version);

    if (!action) {
        return false;
    }

    const operation = action.getOperation();

    if (operation === ContentOperation.CREATE) {
        return true;
    }

    if (operation === ContentOperation.UPDATE) {
        return action.getFields().some(isRevertibleField);
    }

    return false;
};

const isVersionToBeDisplayedByDefault = (version: ContentVersion): boolean => {
    if (isStandardModeVersion(version)) {
        return true;
    }

    const firstAction = getFirstAction(version);

    return firstAction?.getOperation() === ContentOperation.PUBLISH || firstAction?.getOperation() === ContentOperation.UNPUBLISH;
};

const isVersionToBeDisplayedInFullMode = (version: ContentVersion): boolean => {
    const firstAction = getFirstAction(version);

    // Don't display versions where 'manualOrderValue' was changed (These versions are created for children of manually sorted parents)
    if (firstAction.getOperation() === ContentOperation.SORT && firstAction.getFields().some(f => f === ContentField.MANUAL_ORDER)) {
        return false;
    }

    return true;
}

// ============================================================================
// Publish Status
// ============================================================================

export const getVersionPublishStatus = (version: ContentVersion, onlineVersionId?: string): VersionPublishStatus => {
    if (onlineVersionId && version.getId() === onlineVersionId) {
        return VersionPublishStatus.ONLINE;
    }

    if (!hasPublishAction(version) || hasUnpublishAction(version)) {
        return VersionPublishStatus.OFFLINE;
    }

    const now = new Date();
    const publishInfo = version.getPublishInfo();
    const publishedFrom = publishInfo?.getPublishedFrom();
    const publishedTo = publishInfo?.getPublishedTo();

    if (publishedFrom && publishedFrom > now) {
        return VersionPublishStatus.SCHEDULED;
    }

    if (publishedTo && publishedTo < now) {
        return VersionPublishStatus.EXPIRED;
    }

    return VersionPublishStatus.OFFLINE;
};

// ============================================================================
// Icon Resolution (Chain of Responsibility)
// ============================================================================

const OPERATION_ICON_MAP: Record<ContentOperation, LucideIcon> = {
    [ContentOperation.PUBLISH]: CloudCheck,
    [ContentOperation.CREATE]: PenLine,
    [ContentOperation.PERMISSIONS]: CircleUserRound,
    [ContentOperation.SORT]: ArrowDownNarrowWide,
    [ContentOperation.MOVE]: ArrowLeftRight,
    [ContentOperation.ARCHIVE]: Archive,
    [ContentOperation.RESTORE]: ArchiveRestore,
    [ContentOperation.UPDATE]: Pen,
    [ContentOperation.DUPLICATE]: Copy,
    [ContentOperation.PATCH]: SquarePen,
    [ContentOperation.UNPUBLISH]: CloudOff,
    [ContentOperation.METADATA]: FilePenLine,
    [ContentOperation.WORKFLOW]: CircleCheckBig,
};

type IconResolverContext = {
    version: ContentVersion;
    versions: ContentVersion[];
}

type IconResolver = (context: IconResolverContext) => LucideIcon | null;

const resolvePublishStatusIcon: IconResolver = ({version}) => {
    const action = getFirstAction(version);
    if (action?.getOperation() !== ContentOperation.PUBLISH) {
        return null;
    }

    const status = getVersionPublishStatus(version);

    if (status === VersionPublishStatus.SCHEDULED) {
        return Clock;
    }

    if (status === VersionPublishStatus.EXPIRED) {
        return ClockAlert;
    }

    return null;
};

const resolveMoveOperationIcon: IconResolver = ({version}) => {
    const action = getFirstAction(version);
    if (action?.getOperation() !== ContentOperation.MOVE) {
        return null;
    }

    const fields = action.getFields();
    const isRenameOnly = fields.length === 1 && fields[0] === ContentField.NAME;

    return isRenameOnly
        ? CaseSensitive
        : FolderInput;
};

const resolveDefaultOperationIcon: IconResolver = ({version}) => {
    const operation = getFirstAction(version)?.getOperation();
    return operation && isContentOperation(operation)
        ? OPERATION_ICON_MAP[operation]
        : null;
};

const ICON_RESOLVERS: IconResolver[] = [
    resolvePublishStatusIcon,
    resolveMoveOperationIcon,
    resolveDefaultOperationIcon,
];

export const getIconForOperation = (
    version: ContentVersion,
    versions: ContentVersion[],
): LucideIcon => {
    const context: IconResolverContext = {version, versions};

    for (const resolver of ICON_RESOLVERS) {
        const icon = resolver(context);
        if (icon) {
            return icon;
        }
    }
    return Pen;
};

// ============================================================================
// Labels
// ============================================================================

export const getOperationLabel = (version: ContentVersion): string => {
    const action = getFirstAction(version);

    const operation = action?.getOperation();

    // Separate Rename from Move
    if (operation === ContentOperation.MOVE) {
        const fields = action.getFields();
        const isRenameOnly = fields.length === 1 && fields[0] === ContentField.NAME;

        if (isRenameOnly) {
            return i18n('operation.content.name');
        }
    }

    return isContentOperation(operation)
        ? i18n(`operation.${operation}`)
        : i18n('operation.content.unknown');
};

export const getModifierLabel = (version: ContentVersion): string => {
    const modifierName = version.getModifierDisplayName()
        || version.getPublishInfo()?.getPublisherDisplayName();

    return modifierName ? i18n('field.version.by', modifierName) : null;
}

// ============================================================================
// Store Actions
// ============================================================================

export const setVersions = (versions: ContentVersion[]): void => {
    $versions.set(versions);
};

export const clearVersions = (): void => {
    $versions.set([]);
};

export const appendVersions = (versions: ContentVersion[]): void => {
    $versions.set([...$versions.get(), ...versions]);
};

export const setSelectedVersions = (currentSelection: string[]): void => {
    const selection = currentSelection.length > MAX_SELECTED_VERSIONS
        ? currentSelection.slice(-MAX_SELECTED_VERSIONS)
        : currentSelection;

    $selectedVersions.set(new Set(selection));
};

export const deselectVersion = (versionId: string): void => {
    const current = $selectedVersions.get();
    if (!current.has(versionId)) {
        return;
    }

    const newSelection = new Set(current);
    newSelection.delete(versionId);
    $selectedVersions.set(newSelection);
};

export const isVersionSelected = (versionId: string): boolean => {
    return $selectedVersions.get().has(versionId);
};

export const toggleVersionSelection = (versionId: string): void => {
    if (isVersionSelected(versionId)) {
        deselectVersion(versionId);
    } else {
        setSelectedVersions([...Array.from($selectedVersions.get()), versionId]);
    }
};

export const resetVersionsSelection = (): void => {
    $selectedVersions.set(new Set());
};

export const setOnlineVersionId = (versionId: string | undefined): void => {
    $onlineVersionId.set(versionId);
}

// ============================================================================
// Content Actions
// ============================================================================

export const revertToVersion = (contentId: ContentId, versionId: string): void => {
    revert(
        contentId,
        versionId
    ).then((result) => {
        if (result.isOk()) {
            NotifyManager.get().showSuccess(i18n('notify.version.changed', versionId));
        } else if (result.isErr()) {
            DefaultErrorHandler.handle(result.error);
        }
    });
};
