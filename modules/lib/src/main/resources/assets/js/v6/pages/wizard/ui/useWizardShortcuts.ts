import { useEffect } from 'react';
import { hasOpenModal } from '../../../shared/lib/dom/hasOpenModal';
import { isEditableTarget, matchesShortcut } from '../../../shared/lib/dom/keyboard';
import { executeWizardAction } from '../model/wizardActions.commands';
import type { WizardActionId } from '../model/wizardActions.store';

type WizardShortcut = {
    id: WizardActionId;
    shortcut: string;
    /** Works while the focus is in an input too. */
    global?: boolean;
};

export const WIZARD_SHORTCUTS: readonly WizardShortcut[] = [
    { id: 'save', shortcut: 'mod+s', global: true },
    { id: 'saveAndClose', shortcut: 'mod+enter', global: true },
    { id: 'archive', shortcut: 'mod+del', global: true },
    { id: 'move', shortcut: 'alt+m' },
    { id: 'publish', shortcut: 'ctrl+alt+p', global: true },
    { id: 'markAsReady', shortcut: 'ctrl+alt+r', global: true },
];

/** Binds the shortcuts of the wizard actions for as long as the component is mounted. */
export function useWizardShortcuts(): void {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.defaultPrevented || hasOpenModal()) return;

            const editable = isEditableTarget(event.target);
            const match = WIZARD_SHORTCUTS.find(
                ({ shortcut, global }) => (global || !editable) && matchesShortcut(event, shortcut),
            );
            if (!match) return;

            event.preventDefault();
            executeWizardAction(match.id);
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);
}
