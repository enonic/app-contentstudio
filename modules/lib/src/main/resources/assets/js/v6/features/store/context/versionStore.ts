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
    ArrowLeftRight,
    CircleCheckBig,
    CircleUserRound,
    Clock,
    ClockAlert,
    CloudCheck,
    CloudOff,
    Copy, FilePenLine,
    Import,
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
    IMPORT: 'content.import',
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

export type VisualTarget = 'restore' | 'compare';

export type VersionsDisplayModeType = 'standard' | 'full';

// ============================================================================
// Stores
// ============================================================================

export const $versions = atom<ContentVersion[]>([]);

export const $visualFocus = atom<VisualTarget | null>(null);

export const $versionsDisplayMode = atom<VersionsDisplayModeType>('standard');

export const $selectedVersions = atom<ReadonlySet<string>>(new Set());

export const $activeVersionId = computed($versions, (versions) => versions[0]?.getId());

export const $latestPublishedVersion = computed($versions, (versions): ContentVersion | undefined =>
    versions.find((version) => hasPublishAction(version))
);

export const $selectionModeOn = computed($selectedVersions, (selected) => selected.size > 0);

export const $versionsByDate = computed(
    [$versions, $versionsDisplayMode],
    (versions, displayMode) => {
        const filteredVersions = displayMode === 'standard'
                                 ? versions.filter((version) => isVersionToBeDisplayedByDefault(version, versions))
                                 : versions;

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

// ============================================================================
// Version Helpers
// ============================================================================

const getFirstAction = (version: ContentVersion) => version.getActions()[0];

const hasPublishAction = (version: ContentVersion): boolean =>
    version.getActions().some((action) => action.getOperation() === ContentOperation.PUBLISH);

const hasUnpublishAction = (version: ContentVersion): boolean =>
    version.getActions().some((action) => action.getOperation() === ContentOperation.UNPUBLISH);

const isWorkflowOnlyUpdate = (version: ContentVersion): boolean => {
    const action = getFirstAction(version);
    if (action?.getOperation() !== ContentOperation.UPDATE) {
        return false;
    }
    const fields = action.getFields();
    return fields.length === 1 && fields[0] === ContentField.WORKFLOW;
};

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

const isVersionToBeDisplayedByDefault = (version: ContentVersion, versions: ContentVersion[]): boolean => {
    if (isStandardModeVersion(version)) {
        return true;
    }

    const firstAction = getFirstAction(version);

    return firstAction?.getOperation() === ContentOperation.PUBLISH || firstAction?.getOperation() === ContentOperation.UNPUBLISH;
};

// ============================================================================
// Publish Status
// ============================================================================

export const getVersionPublishStatus = (version: ContentVersion): VersionPublishStatus => {
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

    return VersionPublishStatus.ONLINE;
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
    [ContentOperation.IMPORT]: Import,
    [ContentOperation.PATCH]: SquarePen,
    [ContentOperation.UNPUBLISH]: CloudOff,
    [ContentOperation.METADATA]: FilePenLine,
};

type IconResolverContext = {
    version: ContentVersion;
    versions: ContentVersion[];
    latestPublishedVersion?: ContentVersion;
}

type IconResolver = (context: IconResolverContext) => LucideIcon | null;

const resolveWorkflowIcon: IconResolver = ({version}) =>
    isWorkflowOnlyUpdate(version) ? CircleCheckBig : null;

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

const resolveDefaultOperationIcon: IconResolver = ({version}) => {
    const operation = getFirstAction(version)?.getOperation();
    return operation && isContentOperation(operation)
        ? OPERATION_ICON_MAP[operation]
        : null;
};

const ICON_RESOLVERS: IconResolver[] = [
    resolveWorkflowIcon,
    resolvePublishStatusIcon,
    resolveDefaultOperationIcon,
];

export const getIconForOperation = (
    version: ContentVersion,
    versions: ContentVersion[],
    latestPublishedVersion?: ContentVersion
): LucideIcon => {
    const context: IconResolverContext = {version, versions, latestPublishedVersion};

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

    if (isWorkflowOnlyUpdate(version)) {
        return i18n('status.markedAsReady');
    }

    const operation = action?.getOperation();
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
    if ($versionsDisplayMode.get() === 'full') {
        return;
    }

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

// ============================================================================
// Visual Focus
// ============================================================================

export const setVisualFocus = (target: VisualTarget | null): void => {
    $visualFocus.set(target);
};

export const moveVisualFocus = (direction: -1 | 1, visualTargets: VisualTarget[]): void => {
    if (visualTargets.length === 0) {
        return;
    }

    const currentFocus = $visualFocus.get();
    const currentIndex = currentFocus ? visualTargets.indexOf(currentFocus) : -1;

    const nextIndex = currentIndex === -1
        ? 0
        : (currentIndex + direction + visualTargets.length) % visualTargets.length;

    setVisualFocus(visualTargets[nextIndex]);
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

