import {useCallback, useEffect} from 'react';
import {useStore} from '@nanostores/preact';
import {
    $versionsDisplayMode,
    $visualFocus,
    getVisualTargets,
    moveVisualFocus,
    revertToVersion,
    setVisualFocus,
    toggleVersionSelection,
} from '../../../../../store/context/versionStore';

/**
 * Hook for keyboard navigation within versions list
 * Handles arrow keys for focus movement and Enter/Space for actions
 */
type UseVersionsKeyboardOptions = {
    activeVersionId: string | null;
    isFocused: boolean;
}

export const useVersionsKeyboard = ({activeVersionId, isFocused}: UseVersionsKeyboardOptions) => {
    const visualFocus = useStore($visualFocus);
    const displayMode = useStore($versionsDisplayMode);

    // Reset visual focus to 'compare' when active item or focus changes
    useEffect(() => {
        if (activeVersionId && isFocused) {
            setVisualFocus(displayMode === 'full' ? null : 'compare');
        }
    }, [activeVersionId, isFocused, displayMode]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!activeVersionId) return;

        const visualTargets = getVisualTargets(activeVersionId);

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
                    revertToVersion(activeVersionId);
                    break;
                case 'compare':
                    toggleVersionSelection(activeVersionId);
                    break;
            }
        }
    }, [activeVersionId, visualFocus]);

    return {handleKeyDown};
};

