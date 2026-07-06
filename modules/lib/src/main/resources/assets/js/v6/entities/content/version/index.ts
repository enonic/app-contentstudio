import { computed } from 'nanostores';
import { $allVersionsLoaded as $_allVersionsLoadedAtom } from './versionStore';
import { $selectedVersions as $_selectedVersionsAtom } from './versionStore';
import { $versions as $_versionsAtom } from './versionStore';
import { $versionsDisplayMode as $_versionsDisplayModeAtom } from './versionStore';

export { loadContentVersions } from './versionsLoader';
export {
    ContentOperation,
    getVersionConfig,
    getVersionOperationTime,
    isVersionComparable,
    isVersionRevertable,
    resolveVersionOperationType,
    VersionOperationType,
} from './versionOperations';
export {
    $publishBadgeByVersionId,
    getVersionPublishStatus,
    setOnlineVersionId,
    VersionPublishStatus,
} from './versionPublishState';
export {
    $activeVersionId,
    $comparableVersionsCount,
    $versionsByDate,
    appendVersions,
    resetVersionsSelection,
    setAllVersionsLoaded,
    setContentCreatedTime,
    setSelectedVersions,
    setVersions,
    setVersionsDisplayMode,
    toggleVersionSelection,
} from './versionStore';

//
// * Read-only views
//
// Atoms stay private to the slice; writes go through commands.
//

export const $allVersionsLoaded = computed($_allVersionsLoadedAtom, (value) => value);
export const $selectedVersions = computed($_selectedVersionsAtom, (value) => value);
export const $versions = computed($_versionsAtom, (value) => value);
export const $versionsDisplayMode = computed($_versionsDisplayModeAtom, (value) => value);
