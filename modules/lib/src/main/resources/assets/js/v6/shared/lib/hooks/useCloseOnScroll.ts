import { useEffect, useRef } from 'react';

export function useCloseOnScroll(open: boolean, onClose: () => void): void {
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!open) return;
        const handle = () => onCloseRef.current();
        window.addEventListener('scroll', handle, true);
        return () => window.removeEventListener('scroll', handle, true);
    }, [open]);
}
