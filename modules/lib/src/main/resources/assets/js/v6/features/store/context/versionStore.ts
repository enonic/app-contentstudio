import {atom, computed} from 'nanostores';
import {ContentVersion} from '../../../../app/ContentVersion';
import {ContentOperation, VersionPublishStatus} from '../../utils/widget/versions/versions';


export const $versions =  atom<ContentVersion[]>([]);

export const $versionsByDate = computed($versions, (versions) => {
    const versionsByDate: Record<string, ContentVersion[]> = {};

    versions.forEach((version) => {
        const dateKey = version.getTimestamp().toDateString();

        if (!versionsByDate[dateKey]) {
            versionsByDate[dateKey] = [];
        }

        versionsByDate[dateKey].push(version);
    });

    console.log(versions, versionsByDate);

    return versionsByDate;
});

export const $activeVersionId =  computed($versions, (versions) => {
    return versions[0]?.getId();
});

export const $latestPublishedVersion = computed($versions, (versions) => {
    return versions.find((version) => version.getActions().some(a => a.getOperation() === ContentOperation.PUBLISH));
});

export const $selectedVersions = atom<ReadonlySet<string>>(new Set());

export const $selectionModeOn = computed($selectedVersions, (selected) => {
    return selected.size > 0;
})

export const $expandedVersion = atom<string | undefined>(undefined)

export const setExpandedVersion = (versionId: string | undefined): void => {
    $expandedVersion.set(versionId);
}

export const setVersions = (versions: ContentVersion[]): void => {
    $versions.set(versions);
}

export const clearVersions = (): void => {
    $versions.set([]);
}

export const appendVersions = (versions: ContentVersion[]): void => {
    $versions.set([...$versions.get(), ...versions]);
}

export const selectVersion = (versionId: string): void => {
    if (!isVersionSelected(versionId)) {
        const arr = Array.from($selectedVersions.get());
        if (arr.length > 1) {
            arr.shift();
        }
        arr.push(versionId);
        $selectedVersions.set(new Set(arr));
    }
}

export const deselectVersion = (versionId: string): void => {
    if (isVersionSelected(versionId)) {
        const newSelection = new Set($selectedVersions.get());
        newSelection.delete(versionId);
        $selectedVersions.set(newSelection);
    }
}

export const isVersionSelected = (versionId: string): boolean => {
    return $selectedVersions.get().has(versionId);
}

export const toggleVersionSelection = (versionId: string): void => {
    if (isVersionSelected(versionId)) {
        deselectVersion(versionId);
    } else {
        selectVersion(versionId);
    }
}

export const resetVersionSelection = (): void => {
    $selectedVersions.set(new Set());
}

export const getVersionPublishStatus = (version: ContentVersion): VersionPublishStatus => {
    const publishAction = version.getActions().find(action => action.getOperation() === ContentOperation.PUBLISH);

    if (publishAction) {
        const hasUnpublishAction = version.getActions().find(action => action.getOperation() === ContentOperation.UNPUBLISH);

        if (hasUnpublishAction) {
            return 'was_online';
        }

        const wasPublishedAgain = version.getId() !== $latestPublishedVersion.get()?.getId();
        return wasPublishedAgain ? 'was_online' : 'online';
    }

    return 'offline';
}
