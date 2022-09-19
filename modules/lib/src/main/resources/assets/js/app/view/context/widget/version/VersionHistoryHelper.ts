import {VersionHistoryItem} from './VersionHistoryItem';

export class VersionHistoryHelper {

    static isInteractableItem(version: VersionHistoryItem): boolean {
        return VersionHistoryHelper.isRevertableItem(version) && !version.isMoved();
    }

    static isRevertableItem(version: VersionHistoryItem): boolean {
        return !version.isPublishAction() &&
               !version.isRestored() &&
               !version.isArchived();
    }
}
