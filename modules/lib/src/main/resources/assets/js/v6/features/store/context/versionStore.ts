import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {atom, computed} from 'nanostores';
import {ContentVersion} from '../../../../app/ContentVersion';
import {ContentVersionHelper} from '../../../../app/ContentVersionHelper';
import {$contextContent} from './contextContent.store';
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
    Copy,
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
    WAS_ONLINE: 'was_online',
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

export const $latestPublishedVersion = computed($versions, (versions) =>
    versions.find((version) => hasPublishAction(version))
);

export const $selectionModeOn = computed($selectedVersions, (selected) => selected.size > 0);

export const $versionsByDate = computed(
    [$versions, $versionsDisplayMode],
    (versions, displayMode) => {
        const filteredVersions = displayMode === 'standard'
                                 ? versions.filter(isVersionToBeDisplayedByDefault)
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

export const isVersionsComparable = (version: ContentVersion): boolean => {
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
    if (isVersionsComparable(version)) {
        return true;
    }

    if (getFirstAction(version)?.getOperation() === ContentOperation.PUBLISH) {
        return true;
    }

    // Show unpublish marker versions
    return version.getActions().length === 0 && hasUnpublishedVersionBefore(version);
};

export const hasUnpublishedVersionBefore = (version: ContentVersion): boolean => {
    const versions = $versions.get();
    const versionIndex = versions.findIndex((v) => v.getId() === version.getId());

    if (versionIndex === -1) {
        return false;
    }

    return versions
        .slice(versionIndex + 1)
        .some((v) => hasUnpublishAction(v));
};

// ============================================================================
// Publish Status
// ============================================================================

export const getVersionPublishStatus = (version: ContentVersion): VersionPublishStatus => {
    if (!hasPublishAction(version)) {
        return VersionPublishStatus.OFFLINE;
    }

    if (hasUnpublishAction(version)) {
        return VersionPublishStatus.WAS_ONLINE;
    }

    const latestPublishedId = $latestPublishedVersion.get()?.getId();
    if (version.getId() !== latestPublishedId) {
        return VersionPublishStatus.WAS_ONLINE;
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
};

type IconResolver = (version: ContentVersion) => LucideIcon | null;

const resolveWorkflowIcon: IconResolver = (version) =>
    isWorkflowOnlyUpdate(version) ? CircleCheckBig : null;

const resolvePublishStatusIcon: IconResolver = (version) => {
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

const resolveUnpublishIcon: IconResolver = (version) => {
    const action = getFirstAction(version);
    return !action && hasUnpublishedVersionBefore(version) ? CloudOff : null;
};

const resolveDefaultOperationIcon: IconResolver = (version) => {
    const operation = getFirstAction(version)?.getOperation();
    return operation && isContentOperation(operation)
        ? OPERATION_ICON_MAP[operation]
        : null;
};

const ICON_RESOLVERS: IconResolver[] = [
    resolveWorkflowIcon,
    resolvePublishStatusIcon,
    resolveUnpublishIcon,
    resolveDefaultOperationIcon,
];

export const getIconForOperation = (version: ContentVersion): LucideIcon => {
    for (const resolver of ICON_RESOLVERS) {
        const icon = resolver(version);
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

    if (!action) {
        return hasUnpublishedVersionBefore(version)
            ? i18n(`operation.${ContentOperation.UNPUBLISH}`)
            : i18n('operation.content.unknown');
    }

    if (isWorkflowOnlyUpdate(version)) {
        return i18n('status.markedAsReady');
    }

    const operation = action.getOperation();
    return isContentOperation(operation)
        ? i18n(`operation.${operation}`)
        : i18n('operation.content.unknown');
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

export const getVisualTargets = (activeVersionId: string): VisualTarget[] => {
    if ($versionsDisplayMode.get() === 'full') {
        return [];
    }

    const activeVersion = $versions.get().find((v) => v.getId() === activeVersionId);

    if (activeVersion && isVersionsComparable(activeVersion)) {
        return ['restore', 'compare'];
    }

    return [];
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

export const revertToVersion = (versionId: string): void => {
    const content = $contextContent.get();
    if (!content) {
        return;
    }

    const version = $versions.get().find((v) => v.getId() === versionId);
    if (!version) {
        return;
    }

    ContentVersionHelper.revert(
        content.getContentId(),
        version.getId(),
        version.getTimestamp()
    );
};

