import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {atom, computed} from 'nanostores';
import {type ContentId} from '../../../../app/content/ContentId';
import {type ContentVersion, ContentVersionBuilder} from '../../../../app/ContentVersion';
import {revert} from '../../api/versions';

import {
    Archive,
    ArchiveRestore,
    ArrowDownNarrowWide,
    CaseSensitive,
    CircleCheckBig,
    CircleUserRound,
    Clock,
    ClockAlert,
    Cloud,
    CloudOff,
    Copy,
    FilePenLine,
    FolderInput,
    Globe,
    Import,
    type LucideIcon,
    Pen,
    PenLine,
    SendToBack,
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
    SYNC: 'content.sync',
} as const;

export type ContentOperation = typeof ContentOperation[keyof typeof ContentOperation];

const CONTENT_OPERATION_SET = new Set<string>(Object.values(ContentOperation));

export const isContentOperation = (value: string): value is ContentOperation =>
    CONTENT_OPERATION_SET.has(value);

export const VersionField = {
    DISPLAY_NAME: 'displayName',
    DATA: 'data',
    X: 'x',
    PAGE: 'components',
    OWNER: 'owner',
    LANGUAGE: 'language',
    PUBLISH: 'publish',
    WORKFLOW: 'workflow',
    VARIANT_OF: 'variantOf',
    ATTACHMENTS: 'attachments',
    NAME: 'name',
    PARENT_PATH: 'parentPath',
    MANUAL_ORDER: 'manualOrderValue',
    INHERIT: 'inherit',
} as const;

export const VersionOperationType = {
    ...ContentOperation,
    RENAME: 'content.rename',
    IMPORT: 'content.import',
    LOCALIZE: 'content.localize',
    SYNTHETIC_CREATE: 'content.syntheticCreate',
    EDITORIAL_PATCH: 'content.editorialPatch',
} as const;

const EDITORIAL_PATCH_FIELDS: readonly string[] = [
    VersionField.DISPLAY_NAME,
    VersionField.DATA,
    VersionField.X,
    VersionField.PAGE,
    VersionField.NAME,
    VersionField.PARENT_PATH,
];

export type VersionOperationType = typeof VersionOperationType[keyof typeof VersionOperationType];

type VersionOperationConfig = {
    standardMode: boolean;
    fullMode: boolean;
    restorable: boolean;
    comparable: boolean;
    icon: LucideIcon;
    labelKey: string;
};

const VERSION_OPERATION_MATRIX: Record<VersionOperationType, VersionOperationConfig> = {
    [VersionOperationType.CREATE]: {
        standardMode: true,
        fullMode: true,
        restorable: true,
        comparable: true,
        icon: PenLine,
        labelKey: 'operation.content.create'
    },
    [VersionOperationType.DUPLICATE]: {
        standardMode: true,
        fullMode: true,
        restorable: true,
        comparable: true,
        icon: Copy,
        labelKey: 'operation.content.duplicate'
    },
    [VersionOperationType.UPDATE]: {
        standardMode: true,
        fullMode: true,
        restorable: true,
        comparable: true,
        icon: Pen,
        labelKey: 'operation.content.update'
    },
    [VersionOperationType.PUBLISH]: {
        standardMode: false,
        fullMode: true,
        restorable: false,
        comparable: false,
        icon: Cloud,
        labelKey: 'operation.content.publish'
    },
    [VersionOperationType.UNPUBLISH]: {
        standardMode: false,
        fullMode: true,
        restorable: false,
        comparable: false,
        icon: CloudOff,
        labelKey: 'operation.content.unpublish'
    },
    [VersionOperationType.PERMISSIONS]: {
        standardMode: false,
        fullMode: true,
        restorable: false,
        comparable: false,
        icon: CircleUserRound,
        labelKey: 'operation.content.permissions'
    },
    [VersionOperationType.MOVE]: {
        standardMode: true,
        fullMode: true,
        restorable: false,
        comparable: true,
        icon: FolderInput,
        labelKey: 'operation.content.move'
    },
    [VersionOperationType.RENAME]: {
        standardMode: true,
        fullMode: true,
        restorable: false,
        comparable: true,
        icon: CaseSensitive,
        labelKey: 'operation.content.name'
    },
    [VersionOperationType.SORT]: {
        standardMode: true,
        fullMode: true,
        restorable: false,
        comparable: true,
        icon: ArrowDownNarrowWide,
        labelKey: 'operation.content.sort'
    },
    [VersionOperationType.PATCH]: {
        standardMode: false,
        fullMode: true,
        restorable: false,
        comparable: false,
        icon: SquarePen,
        labelKey: 'operation.content.patch'
    },
    [VersionOperationType.EDITORIAL_PATCH]: {
        standardMode: true,
        fullMode: true,
        restorable: false,
        comparable: false,
        icon: SquarePen,
        labelKey: 'operation.content.patch'
    },
    [VersionOperationType.ARCHIVE]: {
        standardMode: false,
        fullMode: true,
        restorable: false,
        comparable: false,
        icon: Archive,
        labelKey: 'operation.content.archive'
    },
    [VersionOperationType.RESTORE]: {
        standardMode: false,
        fullMode: true,
        restorable: false,
        comparable: false,
        icon: ArchiveRestore,
        labelKey: 'operation.content.restore'
    },
    [VersionOperationType.METADATA]: {
        standardMode: false,
        fullMode: true,
        restorable: false,
        comparable: false,
        icon: FilePenLine,
        labelKey: 'operation.content.updateMetadata'
    },
    [VersionOperationType.WORKFLOW]: {
        standardMode: false,
        fullMode: true,
        restorable: false,
        comparable: false,
        icon: CircleCheckBig,
        labelKey: 'operation.content.updateWorkflow'
    },
    [VersionOperationType.SYNC]: {
        standardMode: true,
        fullMode: true,
        restorable: true,
        comparable: true,
        icon: SendToBack,
        labelKey: 'operation.content.sync'
    },
    [VersionOperationType.IMPORT]: {
        standardMode: true,
        fullMode: true,
        restorable: true,
        comparable: true,
        icon: Import,
        labelKey: 'operation.content.import'
    },
    [VersionOperationType.LOCALIZE]: {
        standardMode: false,
        fullMode: true,
        restorable: true,
        comparable: true,
        icon: Globe,
        labelKey: 'operation.content.localize'
    },
    [VersionOperationType.SYNTHETIC_CREATE]: {
        standardMode: true,
        fullMode: true,
        restorable: false,
        comparable: false,
        icon: PenLine,
        labelKey: 'operation.content.create'
    },
};

export const VersionPublishStatus = {
    PUBLISHED: 'published',
    OFFLINE: 'offline',
    SCHEDULED: 'scheduled',
    EXPIRED: 'expired',
    UNPUBLISHED: 'unpublished',
} as const;

export type VersionPublishStatus = typeof VersionPublishStatus[keyof typeof VersionPublishStatus];

export type VersionsDisplayModeType = 'standard' | 'full';

// ============================================================================
// Stores
// ============================================================================

export const $versions = atom<ContentVersion[]>([]);

export const $allVersionsLoaded = atom(false);

export const $versionsDisplayMode = atom<VersionsDisplayModeType>('standard');

export const $selectedVersions = atom<ReadonlySet<string>>(new Set());

export const $activeVersionId = computed($versions, (versions) => versions[0]?.getId());

export const $versionsByDate = computed(
    [$versions, $versionsDisplayMode],
    (versions, displayMode) => {
        const filteredVersions = displayMode === 'standard'
                                 ? versions.filter(isStandardModeVersion)
                                 : versions.filter(isVersionToBeDisplayedInFullMode);

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

export const $onlineVersionId = atom<string | undefined>(undefined);

type PublishBadge = {
    versionId: string;
    publishStatus: VersionPublishStatus;
    publishedFrom: Date;
    publishedTo: Date | undefined;
};

const getPublishAction = (version: ContentVersion) =>
    version.getActions().find(a => a.getOperation() === ContentOperation.PUBLISH);

const isPublishEvent = (version: ContentVersion): boolean =>
    getPublishAction(version) != null;

const isUnpublishEvent = (version: ContentVersion): boolean =>
    version.getActions().some(a => a.getOperation() === ContentOperation.UNPUBLISH);

const findUnpublishDate = (versions: ContentVersion[], publishIndex: number): Date | undefined => {
    for (let i = publishIndex - 1; i >= 0; i--) {
        if (isUnpublishEvent(versions[i])) {
            return versions[i].getTimestamp();
        }
        if (isPublishEvent(versions[i])) {
            return undefined;
        }
    }
    return undefined;
};

const resolveBadgeTargetId = (publishVersion: ContentVersion): string => {
    const editorialId = getPublishAction(publishVersion)?.getEditorial();
    return editorialId ?? publishVersion.getId();
};

const $allPublishBadges = computed($versions, (versions): PublishBadge[] => {
    const badges: PublishBadge[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < versions.length; i++) {
        const v = versions[i];
        if (!isPublishEvent(v) || !v.getPublishInfo()) {
            continue;
        }

        const targetId = resolveBadgeTargetId(v);
        if (seen.has(targetId)) {
            continue;
        }

        seen.add(targetId);
        badges.push({
            versionId: targetId,
            publishStatus: getVersionPublishStatus(v),
            publishedFrom: v.getTimestamp(),
            publishedTo: findUnpublishDate(versions, i) ?? v.getPublishInfo()?.getTo(),
        });
    }

    return badges;
});

const $publishBadge = computed([$allPublishBadges, $onlineVersionId], (badges, onlineVersionId): PublishBadge | undefined => {
    if (!onlineVersionId) {
        return undefined;
    }
    return badges[0];
});

export const $activePublishVersionId = computed($publishBadge, badge => badge?.versionId);

export const $activePublishStatus = computed($publishBadge, badge => badge?.publishStatus);

export const $activePublishedFrom = computed($publishBadge, badge => badge?.publishedFrom);

export const $activePublishedTo = computed($publishBadge, badge => badge?.publishedTo);

export const $pastPublishBadges = computed([$allPublishBadges, $onlineVersionId], (badges, onlineVersionId): ReadonlyMap<string, PublishBadge> => {
    const pastBadges = onlineVersionId ? badges.slice(1) : badges;
    return new Map(pastBadges.map(b => [b.versionId, b]));
});

// ============================================================================
// Version Helpers
// ============================================================================

const getFirstAction = (version: ContentVersion) => version.getActions()[0];

/** Formats version date as YYYY-MM-DD */
export const getFormattedVersionDate = (version: ContentVersion): string => {
    const timestamp = version.getTimestamp();
    const year = timestamp.getFullYear();
    const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
    const day = timestamp.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const SYNTHETIC_VERSION_ID = '__synthetic_create__';

const isSyntheticVersion = (version: ContentVersion): boolean =>
    version.getId() === SYNTHETIC_VERSION_ID;

export const resolveVersionOperationType = (version: ContentVersion): VersionOperationType | undefined => {
    if (isSyntheticVersion(version)) {
        return VersionOperationType.SYNTHETIC_CREATE;
    }

    const action = getFirstAction(version);

    if (!action) {
        return VersionOperationType.IMPORT;
    }

    const operation = action.getOperation();

    if (operation === ContentOperation.MOVE) {
        const fields = action.getFields();
        if (fields.length === 1 && fields[0] === VersionField.NAME) {
            return VersionOperationType.RENAME;
        }
    }

    if (operation === ContentOperation.METADATA) {
        const fields = action.getFields();
        if (fields.some(f => f === VersionField.INHERIT)) {
            return VersionOperationType.LOCALIZE;
        }
    }

    if (operation === ContentOperation.PATCH) {
        const fields = action.getFields();
        if (fields.some(f => EDITORIAL_PATCH_FIELDS.includes(f))) {
            return VersionOperationType.EDITORIAL_PATCH;
        }
    }

    return isContentOperation(operation) ? operation : undefined;
};

export const appendSyntheticCreateVersion = (createdDate: Date): void => {
    const versions = $versions.get();
    if (versions.length === 0) {
        return;
    }

    const lastVersion = versions[versions.length - 1];
    const lastType = resolveVersionOperationType(lastVersion);

    if (lastType === VersionOperationType.CREATE || lastType === VersionOperationType.IMPORT || lastType === VersionOperationType.SYNC) {
        return;
    }

    const builder = new ContentVersionBuilder();
    builder.id = SYNTHETIC_VERSION_ID;
    builder.timestamp = createdDate;
    builder.actions = [];

    $versions.set([...versions, builder.build()]);
};

const getVersionConfig = (version: ContentVersion): VersionOperationConfig | undefined => {
    const type = resolveVersionOperationType(version);
    return type ? VERSION_OPERATION_MATRIX[type] : undefined;
};

export const isVersionRevertable = (version: ContentVersion): boolean =>
    getVersionConfig(version)?.restorable ?? false;

export const isVersionComparable = (version: ContentVersion): boolean =>
    getVersionConfig(version)?.comparable ?? false;

export const isStandardModeVersion = (version: ContentVersion): boolean =>
    getVersionConfig(version)?.standardMode ?? false;

const isVersionToBeDisplayedInFullMode = (version: ContentVersion): boolean => {
    return getVersionConfig(version)?.fullMode ?? true;
};

// ============================================================================
// Publish Status
// ============================================================================

export const getVersionPublishStatus = (version: ContentVersion): VersionPublishStatus => {
    const publishInfo = version.getPublishInfo();

    if (publishInfo) {
        const now = new Date();
        const publishedFrom = publishInfo.getFrom();
        const publishedTo = publishInfo.getTo();

        if (publishedFrom && publishedFrom > now) {
            return VersionPublishStatus.SCHEDULED;
        }

        if (publishedTo && publishedTo < now) {
            return VersionPublishStatus.EXPIRED;
        }

        const actions = version.getActions();

        if (actions.some(a => a.getOperation() === ContentOperation.PUBLISH)) {
            return VersionPublishStatus.PUBLISHED;
        }

        return VersionPublishStatus.UNPUBLISHED;
    }

    return VersionPublishStatus.OFFLINE;
};

// ============================================================================
// Icon Resolution
// ============================================================================

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

    return type ? VERSION_OPERATION_MATRIX[type].icon : Pen;
};

// ============================================================================
// Labels
// ============================================================================

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
        setSelectedVersions([...$selectedVersions.get(), versionId]);
    }
};

export const resetVersionsSelection = (): void => {
    $selectedVersions.set(new Set());
};

export const setOnlineVersionId = (versionId: string | undefined): void => {
    $onlineVersionId.set(versionId);
};

// ============================================================================
// Patch Detection
// ============================================================================

const hasPatchOperation = (version: ContentVersion): boolean =>
    version.getActions().some((action) => action.getOperation() === ContentOperation.PATCH);

/**
 * Checks if any versions that happened after the given version (earlier in the list)
 * have a content.patch operation.
 */
export const hasPatchVersionsBefore = (versionId: string): boolean => {
    const versions = $versions.get();
    const targetIndex = versions.findIndex((v) => v.getId() === versionId);

    if (targetIndex <= 0) {
        return false;
    }

    return versions.slice(0, targetIndex).some(hasPatchOperation);
};

// ============================================================================
// Pending Revert Confirmation
// ============================================================================

type PendingRevert = {
    contentId: ContentId;
    versionId: string;
};

export const $pendingRevert = atom<PendingRevert | undefined>(undefined);

export const requestRevert = (contentId: ContentId, versionId: string): void => {
    if (hasPatchVersionsBefore(versionId)) {
        $pendingRevert.set({contentId, versionId});
    } else {
        revertToVersion(contentId, versionId);
    }
};

export const confirmRevert = (): void => {
    const pending = $pendingRevert.get();
    if (pending) {
        $pendingRevert.set(undefined);
        revertToVersion(pending.contentId, pending.versionId);
    }
};

export const cancelRevert = (): void => {
    $pendingRevert.set(undefined);
};

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
