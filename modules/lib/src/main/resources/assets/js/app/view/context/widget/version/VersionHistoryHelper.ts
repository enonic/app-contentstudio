import {VersionHistoryItem} from './VersionHistoryItem';

export class VersionHistoryHelper {

    static isInteractableItem(version: VersionHistoryItem): boolean {
        return VersionHistoryHelper.isRevertableItem(version);
    }

    static isRevertableItem(version: VersionHistoryItem): boolean {
        return VersionHistoryHelper.isComparableItem(version) &&
               !version.isMoved() &&
               !version.isPermissions() &&
               !version.isRenamed();
    }

    static isComparableItem(version: VersionHistoryItem): boolean {
        return !version.isPublishAction() &&
               !version.isRestored() &&
               !version.isArchived() &&
               !version.isReadonly();
    }
}
