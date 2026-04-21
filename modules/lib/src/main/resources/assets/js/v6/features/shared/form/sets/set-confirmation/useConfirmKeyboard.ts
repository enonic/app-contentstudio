import {useEffect} from 'react';

type UseConfirmKeyboardOptions = {
    onCancel: () => void;
    enabled: boolean;
};

/**
 * Wires global Escape-to-cancel while a confirmation portal is open. Listens
 * in the capture phase so it wins over descendant handlers (e.g. Combobox
 * popups) that would otherwise consume Escape first.
 */
export function useConfirmKeyboard({onCancel, enabled}: UseConfirmKeyboardOptions): void {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            onCancel();
        };

        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [onCancel, enabled]);
}
