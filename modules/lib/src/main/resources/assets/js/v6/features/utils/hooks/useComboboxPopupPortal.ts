import {useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject} from 'react';

type ComboboxPopupPortal = {
    anchorRef: RefObject<HTMLDivElement>;
    popupRef: RefObject<HTMLDivElement>;
    popupStyle: CSSProperties;
    portalTarget: HTMLElement | null;
};

const INITIAL_STYLE: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 0,
    visibility: 'hidden',
};

export const useComboboxPopupPortal = (open: boolean): ComboboxPopupPortal => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [popupStyle, setPopupStyle] = useState<CSSProperties>(INITIAL_STYLE);
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    const updatePosition = useCallback(() => {
        const anchor = anchorRef.current;
        if (!anchor) {
            setPopupStyle(INITIAL_STYLE);
            return;
        }

        const rect = anchor.getBoundingClientRect();

        setPopupStyle({
            position: 'fixed',
            top: rect.bottom,
            left: rect.left,
            width: rect.width,
            visibility: 'visible',
        });
    }, []);

    useLayoutEffect(() => {
        if (!open) {
            return;
        }

        const anchor = anchorRef.current;
        const dialog = anchor?.closest<HTMLElement>('[role="dialog"]');
        setPortalTarget(dialog ?? document.body);

        updatePosition();

        const handleReposition = () => updatePosition();
        window.addEventListener('scroll', handleReposition, true);
        window.addEventListener('resize', handleReposition);

        return () => {
            window.removeEventListener('scroll', handleReposition, true);
            window.removeEventListener('resize', handleReposition);
        };
    }, [open, updatePosition]);

    return {
        anchorRef,
        popupRef,
        popupStyle,
        portalTarget,
    };
};
