export const MIN_DETACHED_PANEL_HEIGHT = 160;

export type PanelPosition = { left: number; top: number };
export type PanelLayout = PanelPosition & { height?: number };
export type PanelSize = { height: number; width: number };
export type ViewportBounds = { bottom: number; left: number; right: number; top: number };
export type VerticalResizeEdge = 'bottom' | 'top';
export type VerticalResizeSnapshot = {
    edge: VerticalResizeEdge;
    startHeight: number;
    startTop: number;
};

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export function getViewportBounds(currentWindow: Window = window): ViewportBounds {
    const viewport = currentWindow.visualViewport;
    const left = viewport?.offsetLeft ?? 0;
    const top = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? currentWindow.innerWidth;
    const height = viewport?.height ?? currentWindow.innerHeight;

    return { bottom: top + height, left, right: left + width, top };
}

export function clampPanelPosition(next: PanelPosition, panel: PanelSize, viewport: ViewportBounds): PanelPosition {
    return {
        top: clamp(next.top, viewport.top, Math.max(viewport.top, viewport.bottom - panel.height)),
        left: clamp(next.left, viewport.left, Math.max(viewport.left, viewport.right - panel.width)),
    };
}

export function getPanelHeightRange(
    snapshot: VerticalResizeSnapshot,
    viewport: ViewportBounds,
    maximumHeight: number = Number.POSITIVE_INFINITY,
): { max: number; min: number } {
    const fixedBottom = snapshot.startTop + snapshot.startHeight;
    const availableHeight = snapshot.edge === 'top' ? fixedBottom - viewport.top : viewport.bottom - snapshot.startTop;
    const max = Math.max(0, Math.min(availableHeight, maximumHeight));

    return { max, min: Math.min(MIN_DETACHED_PANEL_HEIGHT, max) };
}

export function resizePanelToHeight(
    snapshot: VerticalResizeSnapshot,
    desiredHeight: number,
    viewport: ViewportBounds,
    maximumHeight?: number,
): Pick<PanelLayout, 'height' | 'top'> {
    const { min, max } = getPanelHeightRange(snapshot, viewport, maximumHeight);
    const resizedHeight = clamp(desiredHeight, min, max);
    const top = snapshot.edge === 'top' ? snapshot.startTop + snapshot.startHeight - resizedHeight : snapshot.startTop;
    const height = maximumHeight != null && resizedHeight >= maximumHeight ? undefined : resizedHeight;

    return { height, top };
}
