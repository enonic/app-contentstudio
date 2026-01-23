import {useCallback, useEffect, type RefObject} from 'react';

type UseCloseOnOutsideParams = {
    open: boolean;
    onClose: () => void;
    refs: RefObject<HTMLElement | null>[];
};

export const useCloseOnOutside = ({open, onClose, refs}: UseCloseOnOutsideParams): void => {
    const handlePointerDown = useCallback((event: PointerEvent): void => {
        const target = event.target;
        if (!(target instanceof Node)) {
            return;
        }

        for (const ref of refs) {
            if (ref.current?.contains(target)) {
                return;
            }
        }

        onClose();
    }, [onClose, refs]);

    useEffect(() => {
        if (!open) {
            return;
        }

        document.addEventListener('pointerdown', handlePointerDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
        };
    }, [open, handlePointerDown]);
};
