import { type Element } from '@enonic/lib-admin-ui/dom/Element';
import { cn } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { LayoutTokens } from '../../../shared/ui/layout.tokens';
import { LegacyElementHost } from '../../../shared/ui/LegacyElementHost';
import { $floatingContextWidth, setFloatingContextWidth } from '../model/floatingContextWidth.store';

const CONTEXT_MIN_WIDTH = LayoutTokens.contextPanel.minWidth;
const MIN_LEFT_GAP = 60;
const KEYBOARD_STEP = 16;

function clampWidth(width: number, maxWidth: number): number {
    return Math.min(Math.max(width, CONTEXT_MIN_WIDTH), Math.max(maxWidth, CONTEXT_MIN_WIDTH));
}

export type FloatingContextPanelProps = {
    element: Element;
    // Selector of the layout root that bounds the resize.
    boundsSelector: string;
    defaultWidth?: number;
    onResized: () => void;
};

// Floating stays resizable, as the legacy splitter did.
export const FloatingContextPanel = ({
    element,
    boundsSelector,
    defaultWidth = CONTEXT_MIN_WIDTH,
    onResized,
}: FloatingContextPanelProps): ReactElement => {
    const storedWidth = useStore($floatingContextWidth);
    const width = storedWidth > 0 ? storedWidth : Math.max(defaultWidth, CONTEXT_MIN_WIDTH);
    const label = useI18n('field.splitView.resize');

    const getMaxWidth = (handle: HTMLElement): number => {
        const layoutWidth = handle.closest(boundsSelector)?.getBoundingClientRect().width;
        return (layoutWidth ?? window.innerWidth) - MIN_LEFT_GAP;
    };

    const handlePointerDown = (event: { pointerId: number; clientX: number; currentTarget: EventTarget | null }) => {
        const handle = event.currentTarget;
        if (!(handle instanceof HTMLElement)) return;

        handle.setPointerCapture(event.pointerId);
        const startX = event.clientX;
        const startWidth = width;
        const maxWidth = getMaxWidth(handle);

        const { pointerId } = event;
        const handleMove = (moveEvent: PointerEvent): void => {
            if (moveEvent.pointerId !== pointerId) return;
            setFloatingContextWidth(clampWidth(startWidth + (startX - moveEvent.clientX), maxWidth));
        };
        const stopDragging = (stopEvent: PointerEvent): void => {
            if (stopEvent.pointerId !== pointerId) return;
            handle.removeEventListener('pointermove', handleMove);
            handle.removeEventListener('pointerup', stopDragging);
            handle.removeEventListener('pointercancel', stopDragging);
            onResized();
        };

        handle.addEventListener('pointermove', handleMove);
        handle.addEventListener('pointerup', stopDragging);
        handle.addEventListener('pointercancel', stopDragging);
    };

    const handleKeyDown = (event: { key: string; currentTarget: EventTarget | null; preventDefault: () => void }) => {
        const handle = event.currentTarget;
        if (!(handle instanceof HTMLElement)) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

        event.preventDefault();
        const delta = event.key === 'ArrowLeft' ? KEYBOARD_STEP : -KEYBOARD_STEP;
        setFloatingContextWidth(clampWidth(width + delta, getMaxWidth(handle)));
        onResized();
    };

    return (
        <div
            data-component='FloatingContextPanel'
            className='absolute inset-y-0 right-0 z-[2] flex bg-surface-neutral shadow-xl'
            style={{ width }}
        >
            <div
                role='separator'
                aria-orientation='vertical'
                aria-label={label}
                aria-valuenow={width}
                aria-valuemin={CONTEXT_MIN_WIDTH}
                tabIndex={0}
                className={cn(
                    'relative w-px shrink-0 cursor-col-resize bg-bdr-soft transition-colors',
                    'hover:bg-bdr-select focus-visible:ring-3 focus-visible:ring-ring focus-visible:z-10',
                    String.raw`after:content-[''] after:absolute after:inset-y-0 after:-left-1 after:w-2.5`,
                )}
                onPointerDown={handlePointerDown}
                onKeyDown={handleKeyDown}
            />
            <LegacyElementHost element={element} className='min-w-0 grow' />
        </div>
    );
};

FloatingContextPanel.displayName = 'FloatingContextPanel';
