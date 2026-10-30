import { type RefObject, useEffect } from 'react';
import { getIsElementVisible } from '../../../shared/lib/dom/getIsElementVisible';
import { isEditableTarget, matchesShortcut } from '../../../shared/lib/dom/keyboard';
import { executeSettingsAction, SETTINGS_ACTIONS } from '../model/settingsActions.store';

// The same marker keyBindingsGuard.service uses for the @enonic/ui modals.
const OPEN_DIALOG_SELECTOR = '[role="dialog"][aria-modal="true"]';

/**
 * Binds the settings action shortcuts while the settings page is visible and
 * no dialog is open. The browse shell hides the page when another sidebar
 * widget is active, which is what keeps its shortcuts from clashing with ours.
 */
export function useSettingsShortcuts(rootRef: RefObject<HTMLElement | null>): void {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.defaultPrevented || isEditableTarget(event.target)) return;
            if (document.querySelector(OPEN_DIALOG_SELECTOR) != null) return;
            if (!getIsElementVisible(rootRef.current)) return;

            const action = SETTINGS_ACTIONS.find(({ shortcut }) => shortcut && matchesShortcut(event, shortcut));
            if (!action) return;

            event.preventDefault();
            executeSettingsAction(action.id);
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [rootRef]);
}
