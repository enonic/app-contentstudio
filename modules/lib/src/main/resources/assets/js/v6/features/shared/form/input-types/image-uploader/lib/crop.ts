import {applyTransform, FORWARD_MATRICES, INVERSE_MATRICES} from './matrices';
import {type HandleId, type Crop, type DragState, type Dimensions, type Point} from './types';

export const CROP_STROKE_WIDTH = 2;

// Cursor styles for the 8 handle positions on the crop rectangle.
export const HANDLE_CURSOR: Record<HandleId, string> = {
    tl: 'nw-resize',
    tr: 'ne-resize',
    bl: 'sw-resize',
    br: 'se-resize',
    tm: 'row-resize',
    bm: 'row-resize',
    ml: 'col-resize',
    mr: 'col-resize',
};

// Converts client (viewport) coordinates to SVG local coordinates, clamped to image bounds.
export function toLocalFromClient(svg: SVGSVGElement, clientX: number, clientY: number, dimensions: Dimensions): Point | null {
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const local = pt.matrixTransform(ctm.inverse());
    return {
        x: Math.max(0, Math.min(dimensions.w, local.x)),
        y: Math.max(0, Math.min(dimensions.h, local.y)),
    };
}

// Extracts clientX/Y from either a mouse event or a touch event (uses changedTouches on touchend).
export function getClientXYFromEvent(e: MouseEvent | TouchEvent): {clientX: number; clientY: number} {
    if ('touches' in e && e.touches.length > 0) return {clientX: e.touches[0].clientX, clientY: e.touches[0].clientY};
    if ('changedTouches' in e && e.changedTouches.length > 0)
        return {clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY};
    return {clientX: (e as MouseEvent).clientX, clientY: (e as MouseEvent).clientY};
}

// Returns the CSS cursor for the crop SVG based on the current drag state and hover position.
export function getCropSvgCursor(dragState: DragState, isOverRect: boolean): string {
    if (dragState?.type === 'move') return 'grabbing';
    if (dragState?.type === 'resize') return HANDLE_CURSOR[dragState.handle];
    return isOverRect ? 'grab' : 'default';
}

// Translates the crop rectangle by the delta from anchor to current, clamped to image bounds.
export function applyMove(snapshot: Crop, anchor: Point, current: Point, dimensions: Dimensions): Crop {
    const dx = current.x - anchor.x;
    const dy = current.y - anchor.y;
    const w = snapshot.x2 - snapshot.x1;
    const h = snapshot.y2 - snapshot.y1;
    const x1 = Math.max(0, Math.min(dimensions.w - w, snapshot.x1 + dx));
    const y1 = Math.max(0, Math.min(dimensions.h - h, snapshot.y1 + dy));
    return {x1, y1, x2: x1 + w, y2: y1 + h};
}

// Moves the edge(s) controlled by the given handle to point p, enforcing a minimum crop size.
export function applyResize(handle: HandleId, snapshot: Crop, p: Point, minSize: number): Crop {
    let {x1, y1, x2, y2} = snapshot;
    if (handle === 'tl' || handle === 'ml' || handle === 'bl') x1 = Math.min(p.x, x2 - minSize);
    if (handle === 'tr' || handle === 'mr' || handle === 'br') x2 = Math.max(p.x, x1 + minSize);
    if (handle === 'tl' || handle === 'tm' || handle === 'tr') y1 = Math.min(p.y, y2 - minSize);
    if (handle === 'bl' || handle === 'bm' || handle === 'br') y2 = Math.max(p.y, y1 + minSize);
    return {x1, y1, x2, y2};
}

// Transforms a crop from display orientation coordinates back to base (orientation 1) coordinates
// so it can be stored consistently regardless of how the image is currently rotated/flipped.
export function adjustCropToBaseOrientation(crop: Crop, fromOrientation: number, dimensions: Dimensions): Crop | null {
    if (!crop) return null;

    if (fromOrientation === 1) return crop;

    const matrices = INVERSE_MATRICES[fromOrientation];

    if (!matrices) return crop;

    const sideways = fromOrientation >= 5;
    const orientedCenter: Point = {x: dimensions.w / 2, y: dimensions.h / 2};
    const baseCenter: Point = sideways ? {x: dimensions.h / 2, y: dimensions.w / 2} : orientedCenter;

    const p1 = applyTransform(matrices, {x: crop.x1, y: crop.y1}, orientedCenter, baseCenter);
    const p2 = applyTransform(matrices, {x: crop.x2, y: crop.y2}, orientedCenter, baseCenter);

    return rectFromPoints(p1, p2);
}

// Transforms a crop from base (orientation 1) coordinates to the given display orientation
// so the crop rectangle lines up correctly with the rendered (rotated/flipped) image.
export function adjustCropForOrientation(crop: Crop, toOrientation: number, dimensions: Dimensions): Crop | null {
    if (!crop) return null;
    if (toOrientation === 1) return crop;

    const matrices = FORWARD_MATRICES[toOrientation];

    if (!matrices) return crop;

    const sideways = toOrientation >= 5;
    const orientedCenter: Point = {x: dimensions.w / 2, y: dimensions.h / 2};
    const baseCenter: Point = sideways ? {x: dimensions.h / 2, y: dimensions.w / 2} : orientedCenter;

    const p1 = applyTransform(matrices, {x: crop.x1, y: crop.y1}, baseCenter, orientedCenter);
    const p2 = applyTransform(matrices, {x: crop.x2, y: crop.y2}, baseCenter, orientedCenter);

    return rectFromPoints(p1, p2);
}

//
// * Utilities
//

function rectFromPoints(p1: Point, p2: Point): Crop {
    return {
        x1: Math.min(p1.x, p2.x),
        y1: Math.min(p1.y, p2.y),
        x2: Math.max(p1.x, p2.x),
        y2: Math.max(p1.y, p2.y),
    };
}
