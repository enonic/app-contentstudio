import { useEffect } from 'react';
import { hasOpenModal } from '../../../shared/lib/dom/hasOpenModal';
import { isEditableTarget, matchesShortcut } from '../../../shared/lib/dom/keyboard';
import { executeBrowseAction } from '../model/browseActions.commands';
import { BROWSE_ACTIONS } from '../model/browseActions.store';

/** Binds the shortcuts of the browse actions while `active`. */
export function useBrowseShortcuts(active: boolean): void {
    useEffect(() => {
        if (!active) return;

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.defaultPrevented || hasOpenModal()) return;

            const editable = isEditableTarget(event.target);
            const action = BROWSE_ACTIONS.find(
                ({ shortcut, global }) => shortcut && (global || !editable) && matchesShortcut(event, shortcut),
            );
            if (!action) return;

            event.preventDefault();
            executeBrowseAction(action.id);
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [active]);
}
