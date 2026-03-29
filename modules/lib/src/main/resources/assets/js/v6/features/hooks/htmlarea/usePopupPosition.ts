import {useEffect, useState} from 'react';
import {clamp} from '../../store/dialogs/ckeditorDialogUtils';

export type PopupPosition = {
    top: number;
    left: number;
    side: 'top' | 'bottom';
};

type UsePopupPositionOptions = {
    open: boolean;
    popupRef: { current: HTMLElement | null };
    getAnchorElement: () => HTMLElement | null;
    isRtl?: boolean;
    popupOffset?: number;
    viewportOffset?: number;
    deps?: readonly unknown[];
    onMissingAnchor?: () => void;
};

const DEFAULT_POPUP_OFFSET = 8;
const DEFAULT_VIEWPORT_OFFSET = 8;

export function usePopupPosition({
    open,
    popupRef,
    getAnchorElement,
    isRtl = false,
    popupOffset = DEFAULT_POPUP_OFFSET,
    viewportOffset = DEFAULT_VIEWPORT_OFFSET,
    deps = [],
    onMissingAnchor,
}: UsePopupPositionOptions): PopupPosition | null {
    const [position, setPosition] = useState<PopupPosition | null>(null);

    useEffect(() => {
        if (!open) {
            setPosition(null);
            return;
        }

        const popupElement = popupRef.current;
        const anchorElement = getAnchorElement();

        if (!popupElement || !anchorElement) {
            onMissingAnchor?.();
            return;
        }

        const updatePosition = (): void => {
            if (!popupRef.current) {
                return;
            }

            const nextAnchorElement = getAnchorElement();

            if (!nextAnchorElement) {
                onMissingAnchor?.();
                return;
            }

            const popupRect = popupRef.current.getBoundingClientRect();
            const anchorRect = nextAnchorElement.getBoundingClientRect();
            const maxLeft = Math.max(viewportOffset, window.innerWidth - popupRect.width - viewportOffset);
            const left = clamp(
                isRtl ? anchorRect.right - popupRect.width : anchorRect.left,
                viewportOffset,
                maxLeft,
            );
            const placeAbove =
                window.innerHeight - anchorRect.bottom < popupRect.height + popupOffset &&
                anchorRect.top > popupRect.height + popupOffset;
            const top = placeAbove
                ? Math.max(viewportOffset, anchorRect.top - popupRect.height - popupOffset)
                : Math.min(window.innerHeight - popupRect.height - viewportOffset, anchorRect.bottom + popupOffset);

            setPosition({
                top,
                left,
                side: placeAbove ? 'top' : 'bottom',
            });
        };

        updatePosition();

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, isRtl, ...deps]);

    return position;
}
