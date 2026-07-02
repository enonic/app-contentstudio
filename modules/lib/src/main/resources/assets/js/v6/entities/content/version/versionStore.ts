import { atom, computed } from 'nanostores';
import { type ContentVersion, ContentVersionBuilder } from '../../../../app/ContentVersion';
import {
    getFormattedVersionDate,
    isStandardModeVersion,
    isVersionComparable,
    isVersionToBeDisplayedInFullMode,
    resolveVersionOperationType,
    SYNTHETIC_VERSION_ID,
    VersionOperationType,
} from './versionOperations';

const MAX_SELECTED_VERSIONS = 2;

export type VersionsDisplayModeType = 'standard' | 'full';

//
// * Stores
//

export const $versions = atom<ContentVersion[]>([]);

export const $allVersionsLoaded = atom(false);

export function setAllVersionsLoaded(loaded: boolean): void {
    $allVersionsLoaded.set(loaded);
}

export const $versionsDisplayMode = atom<VersionsDisplayModeType>('standard');

export function setVersionsDisplayMode(mode: VersionsDisplayModeType): void {
    $versionsDisplayMode.set(mode);
}

export const $selectedVersions = atom<ReadonlySet<string>>(new Set());

/**
 * The createdTime of the current content. Used to derive a synthetic CREATE
 * placeholder if the content's history starts after creation (e.g. older items
 * with no recorded CREATE event).
 */
export const $contentCreatedTime = atom<Date | undefined>(undefined);

//
// * Derived stores
//

export const $activeVersionId = computed($versions, (versions) => versions[0]?.getId());

/**
 * Versions plus a synthetic CREATE placeholder appended when all versions are
 * loaded and the oldest known version is not itself a CREATE/IMPORT/SYNC event.
 */
export const $versionsForDisplay = computed(
    [$versions, $allVersionsLoaded, $contentCreatedTime],
    (versions, allLoaded, createdTime) => {
        if (!allLoaded || !createdTime || versions.length === 0) {
            return versions;
        }

        const oldestType = resolveVersionOperationType(versions[versions.length - 1]);
        const alreadyHasCreate =
            oldestType === VersionOperationType.CREATE ||
            oldestType === VersionOperationType.IMPORT ||
            oldestType === VersionOperationType.SYNC;

        if (alreadyHasCreate) {
            return versions;
        }

        const builder = new ContentVersionBuilder();
        builder.id = SYNTHETIC_VERSION_ID;
        builder.timestamp = createdTime;
        builder.actions = [];

        return [...versions, builder.build()];
    },
);

export const $versionsByDate = computed([$versionsForDisplay, $versionsDisplayMode], (versions, displayMode) => {
    const filteredVersions =
        displayMode === 'standard'
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
});

export const $comparableVersionsCount = computed($versionsByDate, (versionsByDate) =>
    Object.values(versionsByDate).reduce((count, versions) => count + versions.filter(isVersionComparable).length, 0),
);

//
// * Commands
//

export const setVersions = (versions: ContentVersion[]): void => {
    $versions.set(versions);
};

export const clearVersions = (): void => {
    $versions.set([]);
};

export const appendVersions = (versions: ContentVersion[]): void => {
    $versions.set([...$versions.get(), ...versions]);
};

export const setContentCreatedTime = (createdTime: Date | undefined): void => {
    $contentCreatedTime.set(createdTime);
};

export const setSelectedVersions = (currentSelection: string[]): void => {
    if (currentSelection.length > MAX_SELECTED_VERSIONS) {
        // ? Earliest entries are dropped silently to keep the list bounded; this is
        // ? intentional UX — only the two most recent picks survive.
        $selectedVersions.set(new Set(currentSelection.slice(-MAX_SELECTED_VERSIONS)));
        return;
    }
    $selectedVersions.set(new Set(currentSelection));
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

export const toggleVersionSelection = (versionId: string): void => {
    const current = $selectedVersions.get();
    if (current.has(versionId)) {
        deselectVersion(versionId);
    } else {
        setSelectedVersions([...current, versionId]);
    }
};

export const resetVersionsSelection = (): void => {
    $selectedVersions.set(new Set());
};
