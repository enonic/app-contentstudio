import {useEffect, useRef} from 'react';

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
    const onCancelRef = useRef(onCancel);
    onCancelRef.current = onCancel;

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            onCancelRef.current();
        };

        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [enabled]);
}
