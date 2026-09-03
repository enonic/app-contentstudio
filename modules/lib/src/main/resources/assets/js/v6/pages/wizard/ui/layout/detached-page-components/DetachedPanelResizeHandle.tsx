import { cn } from '@enonic/ui';
import {
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactElement,
} from 'react';
import {
    getPanelHeightRange,
    type VerticalResizeEdge,
    type VerticalResizeSnapshot,
    type ViewportBounds,
} from './detachedPanelResize';

type DetachedPanelResizeHandleProps = {
    controls: string;
    edge: VerticalResizeEdge;
    label: string;
    maximumHeight?: number;
    onKeyDown: (edge: VerticalResizeEdge, event: ReactKeyboardEvent<HTMLDivElement>) => void;
    onPointerDown: (edge: VerticalResizeEdge, event: ReactPointerEvent<HTMLDivElement>) => void;
    snapshot: VerticalResizeSnapshot;
    viewport: ViewportBounds;
};

export const DetachedPanelResizeHandle = ({
    controls,
    edge,
    label,
    maximumHeight,
    onKeyDown,
    onPointerDown,
    snapshot,
    viewport,
}: DetachedPanelResizeHandleProps): ReactElement => {
    const range = getPanelHeightRange(snapshot, viewport, maximumHeight);

    return (
        <div
            data-resize-edge={edge}
            role="separator"
            aria-orientation="horizontal"
            aria-label={label}
            aria-controls={controls}
            aria-valuemin={Math.round(range.min)}
            aria-valuemax={Math.round(range.max)}
            aria-valuenow={Math.round(snapshot.startHeight)}
            tabIndex={0}
            className={cn(
                'absolute inset-x-0 z-10 h-3 cursor-row-resize touch-none outline-none',
                String.raw`after:content-[''] after:pointer-events-none after:absolute after:left-1/2 after:h-1 after:w-10 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-bdr-soft`,
                'hover:after:bg-bdr-select focus-visible:after:bg-bdr-select',
                edge === 'top' ? 'top-0 after:top-0 pointer-coarse:h-6' : 'bottom-0 after:top-full pointer-coarse:h-8',
            )}
            onPointerDown={(event) => onPointerDown(edge, event)}
            onKeyDown={(event) => onKeyDown(edge, event)}
        />
    );
};

DetachedPanelResizeHandle.displayName = 'DetachedPanelResizeHandle';
