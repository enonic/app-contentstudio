import {useStore} from '@nanostores/preact';
import {useCallback} from 'react';
import {ContentId} from '../../../../../../../app/content/ContentId';
import {
    $activeVersionId,
    $versions,
    isVersionRevertable,
    requestRevert,
    toggleVersionSelection,
} from '../../../../../store/context/versionStore';

/**
 * Hook for keyboard navigation within versions list
 * Space toggles selection, ArrowRight expands, ArrowLeft collapses
 * ArrowRight on expanded item focuses restore when available
 */
type UseVersionsKeyboardOptions = {
    contentId: ContentId;
    activeListItemId: string | null;
    expandedVersionId: string | null;
    restoreFocusVersionId: string | null;
    onExpand: (versionId: string) => void;
    onCollapse: () => void;
    onSetRestoreFocus: (versionId: string | null) => void;
}

export const useVersionsKeyboard = ({
    contentId,
    activeListItemId,
    expandedVersionId,
    restoreFocusVersionId,
    onExpand,
    onCollapse,
    onSetRestoreFocus,
}: UseVersionsKeyboardOptions) => {
    const versions = useStore($versions);
    const latestContentVersionId = useStore($activeVersionId);

    const hasRestoreButton = useCallback((): boolean => {
        if (!activeListItemId || expandedVersionId !== activeListItemId) {
            return false;
        }
        const version = versions.find((item) => item.getId() === activeListItemId);
        return version != null && latestContentVersionId !== version.getId() && isVersionRevertable(version);
    }, [activeListItemId, expandedVersionId, versions, latestContentVersionId]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!activeListItemId) return;

        // Don't intercept events when focus is on an interactive element (e.g. restore button)
        if (e.target instanceof HTMLButtonElement) return;

        // Collapse when navigating to another item with arrow keys
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            if (expandedVersionId) {
                onCollapse();
            }
            onSetRestoreFocus(null);
            // Let the event propagate to Listbox for navigation
            return;
        }

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            e.stopPropagation();

            if (expandedVersionId !== activeListItemId) {
                onExpand(activeListItemId);
                onSetRestoreFocus(null);
                return;
            }

            if (hasRestoreButton()) {
                onSetRestoreFocus(activeListItemId);
            } else {
                onSetRestoreFocus(null);
            }
            return;
        }

        if (e.key === 'ArrowLeft') {
            if (expandedVersionId === activeListItemId) {
                e.preventDefault();
                e.stopPropagation();
                onCollapse();
                onSetRestoreFocus(null);
            }
            return;
        }

        // Space: toggle version selection
        if (e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            toggleVersionSelection(activeListItemId);
            return;
        }

        // Enter: activate restore when focused
        if (e.key === 'Enter') {
            if (restoreFocusVersionId === activeListItemId && hasRestoreButton()) {
                e.preventDefault();
                e.stopPropagation();
                requestRevert(contentId, activeListItemId);
            }
        }
    }, [
        activeListItemId,
        expandedVersionId,
        restoreFocusVersionId,
        hasRestoreButton,
        contentId,
        onExpand,
        onCollapse,
        onSetRestoreFocus,
    ]);

    return {handleKeyDown};
};
