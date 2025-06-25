import {atom, computed} from 'nanostores';
import {ContentVersion} from '../../../../app/ContentVersion';
import {ContentVersionHelper} from '../../../../app/ContentVersionHelper';
import {ContentOperation, VersionPublishStatus} from '../../utils/widget/versions/versions';
import {$contextContent} from './contextContent.store';

export type VisualTarget = 'edit' | 'restore' | 'compare';

export const $versions = atom<ContentVersion[]>([]);

export const $visualFocus = atom<VisualTarget | null>(null);

export const $versionsByDate = computed($versions, (versions) => {
    const versionsByDate: Record<string, ContentVersion[]> = {};

    versions.forEach((version) => {
        const timestamp = version.getTimestamp();
        // Format date as YYYY-MM-DD
        const dateKey = `${timestamp.getFullYear()}-${(timestamp.getMonth() + 1).toString().padStart(2,
            '0')}-${timestamp.getDate().toString().padStart(2, '0')}`;

        if (!versionsByDate[dateKey]) {
            versionsByDate[dateKey] = [];
        }

        versionsByDate[dateKey].push(version);
    });

    return versionsByDate;
});

export const $latestVersionId = computed($versions, (versions) => {
    return versions[0]?.getId();
});

export const $latestPublishedVersion = computed($versions, (versions) => {
    return versions.find((version) => version.getActions().some(a => a.getOperation() === ContentOperation.PUBLISH.toString()));
});

export const $selectedVersions = atom<ReadonlySet<string>>(new Set());

export const $selectionModeOn = computed($selectedVersions, (selected) => {
    return selected.size > 0;
})

export const setVersions = (versions: ContentVersion[]): void => {
    $versions.set(versions);
}

export const clearVersions = (): void => {
    $versions.set([]);
}

export const appendVersions = (versions: ContentVersion[]): void => {
    $versions.set([...$versions.get(), ...versions]);
}

export const setSelectedVersions = (currentSelection: string[]): void => {
    if (currentSelection.length > 2) {
        $selectedVersions.set(new Set([currentSelection[currentSelection.length - 2], currentSelection[currentSelection.length - 1]])); // Limit selection to 2 last selected versions
    } else {
        $selectedVersions.set(new Set(currentSelection ?? []));
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
        const newSelection = Array.from($selectedVersions.get());
        newSelection.push(versionId);
        setSelectedVersions(newSelection);
    }
}

export const resetVersionsSelection = (): void => {
    $selectedVersions.set(new Set());
}

export const setVisualFocus = (target: VisualTarget | null): void => {
    $visualFocus.set(target);
}

export const getVisualTargets = (versionId: string): VisualTarget[] => {
    if ($latestVersionId.get() === versionId) {
        return ['edit', 'restore', 'compare'];
    }
    return ['restore', 'compare'];
}

export const moveVisualFocus = (direction: -1 | 1, visualTargets: VisualTarget[]): void => {
    if (visualTargets.length === 0) {
        return;
    }

    const currentFocus = $visualFocus.get();
    const currentIndex = currentFocus ? visualTargets.indexOf(currentFocus) : -1;

    const nextIndex =
        currentIndex === -1
            ? 0
            : (currentIndex + direction + visualTargets.length) % visualTargets.length;

    setVisualFocus(visualTargets[nextIndex]);
}

export const getVersionPublishStatus = (version: ContentVersion): VersionPublishStatus => {
    const publishAction = version.getActions().find(action => action.getOperation() === ContentOperation.PUBLISH.toString());

    if (publishAction) {
        const hasUnpublishAction = version.getActions().find(action => action.getOperation() === ContentOperation.UNPUBLISH.toString());

        if (hasUnpublishAction) {
            return 'was_online';
        }

        const wasPublishedAgain = version.getId() !== $latestPublishedVersion.get()?.getId();
        return wasPublishedAgain ? 'was_online' : 'online';
    }

    return 'offline';
}

export const revertToVersion = (versionId: string): void => {
    const content = $contextContent.get();

    if (!content) {
        return;
    }

    const version = $versions.get().find(v => v.getId() === versionId);

    if (!version) {
        return;
    }

    ContentVersionHelper.revert(content.getContentId(), version.getId(), version.getTimestamp());
}
