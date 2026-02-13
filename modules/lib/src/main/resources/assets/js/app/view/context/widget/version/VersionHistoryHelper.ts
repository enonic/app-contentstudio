import {type VersionHistoryItem} from './VersionHistoryItem';

export class VersionHistoryHelper {

    static isRevertableItem(version: VersionHistoryItem): boolean {
        return VersionHistoryHelper.isComparableItem(version) &&
               !version.isMoved() &&
               !version.isPermissions() &&
               !version.isRenamed() &&
               !version.isSorted();
    }

    static isComparableItem(version: VersionHistoryItem): boolean {
        return !version.isPublishAction() &&
               !version.isRestored() &&
               !version.isArchived() &&
               !version.isReadonly();
    }
}
