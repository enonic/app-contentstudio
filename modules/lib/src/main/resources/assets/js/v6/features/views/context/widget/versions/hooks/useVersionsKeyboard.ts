import {useStore} from '@nanostores/preact';
import {useCallback} from 'react';
import {type ContentId} from '../../../../../../../app/content/ContentId';
import {
    isVersionComparable,
    isVersionRevertable,
} from '../../../../../store/context/versionOperations';
import {
    $activeVersionId,
    $versions,
    toggleVersionSelection,
} from '../../../../../store/context/versionStore';
import {useRevertActions} from '../revert/useRevertActions';

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
    const revertActions = useRevertActions();

    const hasRestoreButton = useCallback((): boolean => {
        if (!revertActions || !activeListItemId || expandedVersionId !== activeListItemId) {
            return false;
        }
        const version = versions.find((item) => item.getId() === activeListItemId);
        return version != null && latestContentVersionId !== version.getId() && isVersionRevertable(version);
    }, [revertActions, activeListItemId, expandedVersionId, versions, latestContentVersionId]);

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

        // Space: toggle version selection (only for comparable versions)
        if (e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            const version = versions.find((item) => item.getId() === activeListItemId);
            if (version && isVersionComparable(version)) {
                toggleVersionSelection(activeListItemId);
            }
            return;
        }

        // Enter: activate restore when focused
        if (e.key === 'Enter') {
            if (revertActions && restoreFocusVersionId === activeListItemId && hasRestoreButton()) {
                e.preventDefault();
                e.stopPropagation();
                revertActions.requestRevert(contentId, activeListItemId);
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
        revertActions,
        versions,
    ]);

    return {handleKeyDown};
};
