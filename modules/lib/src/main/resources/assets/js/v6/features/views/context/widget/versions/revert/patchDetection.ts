import {type ContentVersion} from '../../../../../../../app/ContentVersion';
import {ContentOperation} from '../../../../../store/context/versionOperations';
import {$versions} from '../../../../../store/context/versionStore';

const hasPatchOperation = (version: ContentVersion): boolean =>
    version.getActions().some((action) => action.getOperation() === ContentOperation.PATCH);

/**
 * Checks if any versions that happened after the given version (earlier in the list)
 * have a `content.patch` operation. Used to decide whether reverting requires
 * extra user confirmation.
 */
export const hasPatchVersionsBefore = (versionId: string): boolean => {
    const versions = $versions.get();
    const targetIndex = versions.findIndex((v) => v.getId() === versionId);

    if (targetIndex <= 0) {
        return false;
    }

    return versions.slice(0, targetIndex).some(hasPatchOperation);
};
