import {VersionHistoryItem} from './VersionHistoryItem';

export class VersionHistoryHelper {

    static isInteractableItem(version: VersionHistoryItem): boolean {
        return !version.isPublishAction() &&
               !version.isPermissionsUpdated() &&
               !version.isRestored() &&
               !version.isArchived();
    }
}
