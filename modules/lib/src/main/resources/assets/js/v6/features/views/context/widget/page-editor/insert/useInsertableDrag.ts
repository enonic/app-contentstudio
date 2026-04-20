import {useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent} from 'react';
import {PageEventsManager} from '../../../../../../../app/wizard/PageEventsManager';
import {CreateOrDestroyDraggableEvent} from '../../../../../../../page-editor/event/incoming/manipulation/CreateOrDestroyDraggableEvent';
import {SetDraggableVisibleEvent} from '../../../../../../../page-editor/event/incoming/manipulation/SetDraggableVisibleEvent';
import {endDrag, startDrag, updateDrag, type PortalComponentType} from '../../../../../store/page-editor/drag';

const DRAG_THRESHOLD_PX = 4;
const LIVE_EDIT_IFRAME_SELECTOR = '.live-form-panel iframe';

export type UseInsertableDragArgs = {
    itemType: PortalComponentType;
    itemLabel: string;
};

export type UseInsertableDragResult = {
    onMouseDown: (event: ReactMouseEvent<HTMLLIElement>) => void;
};

function findLiveEditIframe(): HTMLIFrameElement | null {
    return document.querySelector<HTMLIFrameElement>(LIVE_EDIT_IFRAME_SELECTOR);
}

function isOverIframe(x: number, y: number, iframe: HTMLIFrameElement | null): boolean {
    if (!iframe) return false;
    return document.elementFromPoint(x, y) === iframe;
}

export function useInsertableDrag({itemType, itemLabel}: UseInsertableDragArgs): UseInsertableDragResult {
    const activeRef = useRef(false);

    const handleMouseDown = useCallback((event: ReactMouseEvent<HTMLLIElement>) => {
        if (event.button !== 0) return;

        const startX = event.clientX;
        const startY = event.clientY;
        let started = false;
        let inIframe = false;
        let outerVisible = false;
        let cleaned = false;
        let iframeEl: HTMLIFrameElement | null = null;
        let cursorStyleEl: HTMLStyleElement | null = null;

        const enterIframe = () => {
            if (inIframe) return;
            inIframe = true;
            new SetDraggableVisibleEvent(itemType, true).fire();
            if (outerVisible) {
                outerVisible = false;
                endDrag();
            }
        };

        const leaveIframe = () => {
            if (!inIframe) return;
            inIframe = false;
            new SetDraggableVisibleEvent(itemType, false).fire();
        };

        const onDocMouseOut = (e: MouseEvent) => {
            if (e.relatedTarget != null) return;
            if (isOverIframe(e.clientX, e.clientY, iframeEl)) {
                enterIframe();
            }
        };

        const onDocMouseOver = (e: MouseEvent) => {
            if (e.relatedTarget != null) return;
            if (!isOverIframe(e.clientX, e.clientY, iframeEl)) {
                leaveIframe();
            }
        };

        const beginDrag = () => {
            if (started) return;
            started = true;
            activeRef.current = true;
            cursorStyleEl = document.createElement('style');
            cursorStyleEl.textContent = '*, *::before, *::after { cursor: grabbing !important; }';
            document.head.appendChild(cursorStyleEl);
            iframeEl = findLiveEditIframe();
            new CreateOrDestroyDraggableEvent(itemType, true).fire();
            new SetDraggableVisibleEvent(itemType, false).fire();
            PageEventsManager.get().onComponentDragStopped(onIframeDropped);
            iframeEl?.addEventListener('mouseenter', enterIframe);
            iframeEl?.addEventListener('mouseleave', leaveIframe);
            document.addEventListener('mouseout', onDocMouseOut, true);
            document.addEventListener('mouseover', onDocMouseOver, true);
        };

        const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            document.removeEventListener('mousemove', onMove, true);
            document.removeEventListener('mouseup', onUp, true);
            document.removeEventListener('mouseout', onDocMouseOut, true);
            document.removeEventListener('mouseover', onDocMouseOver, true);
            iframeEl?.removeEventListener('mouseenter', enterIframe);
            iframeEl?.removeEventListener('mouseleave', leaveIframe);
            PageEventsManager.get().unComponentDragStopped(onIframeDropped);
            if (started) {
                new CreateOrDestroyDraggableEvent(itemType, false).fire();
                cursorStyleEl?.remove();
                cursorStyleEl = null;
            }
            endDrag();
            outerVisible = false;
            activeRef.current = false;
        };

        const onIframeDropped = () => {
            cleanup();
        };

        const onMove = (moveEvent: MouseEvent) => {
            if (!started) {
                if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < DRAG_THRESHOLD_PX) return;
                beginDrag();
            }

            const overIframe = isOverIframe(moveEvent.clientX, moveEvent.clientY, iframeEl);
            if (overIframe && !inIframe) {
                enterIframe();
            } else if (!overIframe && inIframe) {
                leaveIframe();
            }

            if (inIframe) return;

            if (!outerVisible) {
                outerVisible = true;
                startDrag({itemType, itemLabel, x: moveEvent.clientX, y: moveEvent.clientY, dropAllowed: false});
                return;
            }

            updateDrag({x: moveEvent.clientX, y: moveEvent.clientY});
        };

        const onUp = () => {
            cleanup();
        };

        document.addEventListener('mousemove', onMove, true);
        document.addEventListener('mouseup', onUp, true);
    }, [itemType, itemLabel]);

    useEffect(() => () => {
        if (activeRef.current) {
            new CreateOrDestroyDraggableEvent(itemType, false).fire();
            endDrag();
        }
    }, [itemType]);

    return {onMouseDown: handleMouseDown};
}
