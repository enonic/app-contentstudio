import {useStore} from '@nanostores/preact';
import {useCallback, useEffect} from 'react';
import {ContentId} from '../../../../../../../app/content/ContentId';
import {
    $activeVersionId,
    $versions,
    $versionsDisplayMode,
    $visualFocus,
    isVersionRevertable,
    moveVisualFocus,
    revertToVersion,
    setVisualFocus,
    toggleVersionSelection, VisualTarget
} from '../../../../../store/context/versionStore';

/**
 * Hook for keyboard navigation within versions list
 * Handles arrow keys for focus movement and Enter/Space for actions
 */
type UseVersionsKeyboardOptions = {
    contentId: ContentId;
    activeListItemId: string | null;
    isFocused: boolean;
}

export const useVersionsKeyboard = ({contentId, activeListItemId, isFocused}: UseVersionsKeyboardOptions) => {
    const visualFocus = useStore($visualFocus);
    const displayMode = useStore($versionsDisplayMode)
    const versions = useStore($versions);
    const latestContentVersionId = useStore($activeVersionId);

    // Reset visual focus to 'compare' when active item or focus changes
    useEffect(() => {
        if (activeListItemId && isFocused) {
            setVisualFocus(displayMode === 'full' ? null : 'compare');
        }
    }, [activeListItemId, isFocused, displayMode]);

    // Get available actions/buttons to set visual focus on based on active version and display mode
    const getVisualTargets = useCallback((): VisualTarget[] => {
        if (displayMode === 'full') {
            return [];
        }

        const versionWithVisualFocusOn = versions.find((v) => v.getId() === activeListItemId);

        if (versionWithVisualFocusOn) {
            if (latestContentVersionId !== versionWithVisualFocusOn.getId() && isVersionRevertable(versionWithVisualFocusOn)) {
                return ['restore', 'compare'];
            }

            return ['compare'];
        }

        return [];
    }, [activeListItemId, versions, displayMode, latestContentVersionId]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!activeListItemId) return;

        const visualTargets = getVisualTargets();

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            e.stopPropagation();
            moveVisualFocus(1, visualTargets);
            return;
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            e.stopPropagation();
            moveVisualFocus(-1, visualTargets);
            return;
        }

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();

            if (!visualTargets.length) return;

            switch (visualFocus) {
                case 'restore':
                    revertToVersion(contentId, activeListItemId);
                    break;
                case 'compare':
                    toggleVersionSelection(activeListItemId);
                    break;
            }
        }
    }, [activeListItemId, visualFocus, getVisualTargets]);

    return {handleKeyDown};
};

