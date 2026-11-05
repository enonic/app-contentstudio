import { type ReactElement, useEffect, useId, useRef, useState } from 'react';
import { type TargetedMouseEvent, type TargetedTouchEvent } from 'preact';
import { useI18n } from '../../../../../../shared/lib/hooks/useI18n';
import { useImageUploaderContext } from '../ImageUploaderContext';
import { useImageArrowKeys } from '../useImageArrowKeys';
import {
    applyMove,
    applyResize,
    getCropSvgCursor,
    getClientXYFromEvent,
    HANDLE_CURSOR,
    toLocalFromClient,
    CROP_STROKE_WIDTH,
    DASH_PX,
    HANDLE_PX,
    HANDLE_HIT_PX,
    MIN_CROP_SIZE,
} from '../lib/crop';
import { type Crop, type DragState, type HandleId } from '../lib/types';
import { ImageUploaderInputCrosshair } from './ImageUploaderInputCrosshair';
import { getImagePercent, ImageUploaderInputKeyboardDescription } from './ImageUploaderInputKeyboardDescription';

export const ImageUploaderInputCropSvg = ({
    keyboardStep,
    pixelRatio,
}: {
    keyboardStep: number;
    pixelRatio: number;
}): ReactElement => {
    const { dimensions, base64Image, crop, setCrop, mode, enabled } = useImageUploaderContext();
    const label = useI18n('editor.cropimage');
    const keyboardHelp = useI18n('editor.cropimage.keyboard.help');
    const descriptionId = useId();
    const svgRef = useRef<SVGSVGElement>(null);
    const keyboardCropRef = useRef<Crop>(null);
    const [dragState, setDragState] = useState<DragState>(null);
    const [liveCrop, setLiveCrop] = useState<Crop | null>(null);
    const [isOverRect, setIsOverRect] = useState(false);
    const [hasControlFocus, setHasControlFocus] = useState(false);
    // Image-pixels per screen-pixel, used to size handle markers at a constant on-screen size.
    const [scale, setScale] = useState(1);

    const handleVisualSize = HANDLE_PX * scale;
    const handleHitSize = HANDLE_HIT_PX * scale;
    const dragThreshold = MIN_CROP_SIZE;

    // Only use liveCrop during an active drag; otherwise always derive from context crop.
    const displayRect: Crop =
        dragState != null && liveCrop != null
            ? liveCrop
            : (crop ?? { x1: 0, y1: 0, x2: dimensions.w, y2: dimensions.h });
    keyboardCropRef.current = displayRect;
    const position = useI18n(
        'editor.cropimage.position',
        getImagePercent(displayRect.x1, dimensions.w),
        getImagePercent(displayRect.y1, dimensions.h),
        getImagePercent(displayRect.x2, dimensions.w),
        getImagePercent(displayRect.y2, dimensions.h),
    );

    const isCropping = mode === 'crop' && enabled;
    const keyboard = useImageArrowKeys({
        enabled: isCropping && !dragState,
        allowMove: true,
        allowResizeAll: true,
        onStep: ({ keys, shiftKey, move }, multiplier) => {
            const rect = keyboardCropRef.current;
            const step = keyboardStep * multiplier;
            const resizeAll = !move && keys.has(' ');
            const left = Number(resizeAll || keys.has('ArrowLeft'));
            const right = Number(resizeAll || keys.has('ArrowRight'));
            const top = Number(resizeAll || keys.has('ArrowUp'));
            const bottom = Number(resizeAll || keys.has('ArrowDown'));
            let nextCrop: Crop;

            if (move) {
                nextCrop = applyMove(
                    rect,
                    { x: 0, y: 0 },
                    { x: (right - left) * step, y: (bottom - top) * step },
                    dimensions,
                );
            } else {
                const minWidth = Math.min(MIN_CROP_SIZE, dimensions.w);
                const minHeight = Math.min(MIN_CROP_SIZE, dimensions.h);
                // Share the remaining space when shrinking opposite edges together.
                const xStep = shiftKey
                    ? step
                    : -Math.min(step, Math.max(0, rect.x2 - rect.x1 - minWidth) / (left + right || 1));
                const yStep = shiftKey
                    ? step
                    : -Math.min(step, Math.max(0, rect.y2 - rect.y1 - minHeight) / (top + bottom || 1));
                nextCrop = {
                    x1: Math.max(0, rect.x1 - (shiftKey ? left : right) * xStep),
                    y1: Math.max(0, rect.y1 - (shiftKey ? top : bottom) * yStep),
                    x2: Math.min(dimensions.w, rect.x2 + (shiftKey ? right : left) * xStep),
                    y2: Math.min(dimensions.h, rect.y2 + (shiftKey ? bottom : top) * yStep),
                };
            }

            if (
                nextCrop.x1 === rect.x1 &&
                nextCrop.y1 === rect.y1 &&
                nextCrop.x2 === rect.x2 &&
                nextCrop.y2 === rect.y2
            ) {
                return;
            }

            keyboardCropRef.current = nextCrop;
            setCrop(nextCrop);
        },
    });

    const svgCursor = getCropSvgCursor(dragState, isOverRect);

    useEffect(() => {
        if (isCropping) {
            svgRef.current?.focus({ preventScroll: true });
        }
    }, [isCropping]);

    // Tracks the rendered svg width so handle markers stay a constant size on screen.
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const update = (): void => {
            const w = svg.getBoundingClientRect().width;
            if (w > 0) setScale(dimensions.w / w);
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(svg);
        return () => ro.disconnect();
    }, [dimensions.w]);

    useEffect(() => {
        if (!dragState) return;

        // Updates the live crop rectangle as the user drags a handle or moves the crop.
        const handleMove = (e: MouseEvent | TouchEvent): void => {
            e.preventDefault();
            const { clientX, clientY } = getClientXYFromEvent(e);
            const svg = svgRef.current;
            if (!svg) return;
            const p = toLocalFromClient(svg, clientX, clientY, dimensions);
            if (!p) return;
            if (dragState.type === 'resize') {
                setLiveCrop(applyResize(dragState.handle, dragState.snapshot, p, MIN_CROP_SIZE));
            } else {
                setLiveCrop(applyMove(dragState.snapshot, dragState.anchor, p, dimensions));
            }
        };

        // Commits the updated crop to context and clears drag state on pointer release.
        const handleUp = (e: MouseEvent | TouchEvent): void => {
            const { clientX, clientY } = getClientXYFromEvent(e);
            const svg = svgRef.current;
            if (svg) {
                const p = toLocalFromClient(svg, clientX, clientY, dimensions);

                if (p) {
                    if (dragState.type === 'resize') {
                        setCrop(applyResize(dragState.handle, dragState.snapshot, p, MIN_CROP_SIZE));
                    } else {
                        const dx = Math.abs(p.x - dragState.anchor.x);
                        const dy = Math.abs(p.y - dragState.anchor.y);
                        if (dx >= dragThreshold || dy >= dragThreshold) {
                            setCrop(applyMove(dragState.snapshot, dragState.anchor, p, dimensions));
                        }
                    }
                }
            }
            setDragState(null);
            setLiveCrop(null);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [dragState]); // eslint-disable-line react-hooks/exhaustive-deps

    // Updates hover state so the grab cursor shows when the pointer is inside the crop area.
    const handleSvgMouseMove = (e: TargetedMouseEvent<SVGSVGElement>): void => {
        if (!crop || dragState) return;
        const svg = svgRef.current;
        if (!svg) return;
        const p = toLocalFromClient(svg, e.clientX, e.clientY, dimensions);
        if (!p) return;
        const inside = p.x >= displayRect.x1 && p.x <= displayRect.x2 && p.y >= displayRect.y1 && p.y <= displayRect.y2;
        setIsOverRect(inside);
    };

    // Begins a move drag when the user presses inside the crop area with the mouse.
    const handleSvgMouseDown = (e: TargetedMouseEvent<SVGSVGElement>): void => {
        keyboard.stop();
        svgRef.current?.focus({ preventScroll: true });
        if (!crop) return;
        const svg = svgRef.current;
        if (!svg) return;
        const p = toLocalFromClient(svg, e.clientX, e.clientY, dimensions);
        if (!p) return;
        const inside = p.x >= displayRect.x1 && p.x <= displayRect.x2 && p.y >= displayRect.y1 && p.y <= displayRect.y2;
        if (!inside) return;
        e.preventDefault();
        setDragState({ type: 'move', anchor: p, snapshot: displayRect });
        setLiveCrop(displayRect);
    };

    // Begins a move drag when the user touches inside the crop area on a touch device.
    const handleSvgTouchStart = (e: TargetedTouchEvent<SVGSVGElement>): void => {
        keyboard.stop();
        svgRef.current?.focus({ preventScroll: true });
        if (!crop) return;
        const touch = e.touches[0];
        if (!touch) return;
        const svg = svgRef.current;
        if (!svg) return;
        const p = toLocalFromClient(svg, touch.clientX, touch.clientY, dimensions);
        if (!p) return;
        const inside = p.x >= displayRect.x1 && p.x <= displayRect.x2 && p.y >= displayRect.y1 && p.y <= displayRect.y2;
        if (!inside) return;
        e.preventDefault();
        setDragState({ type: 'move', anchor: p, snapshot: displayRect });
        setLiveCrop(displayRect);
    };

    // Begins a resize drag when the user presses a handle with the mouse.
    const handleHandleMouseDown =
        (handle: HandleId) =>
        (e: TargetedMouseEvent<SVGRectElement>): void => {
            keyboard.stop();
            svgRef.current?.focus({ preventScroll: true });
            e.stopPropagation();
            e.preventDefault();
            setDragState({ type: 'resize', handle, snapshot: displayRect });
            setLiveCrop(displayRect);
        };

    // Begins a resize drag when the user touches a handle on a touch device.
    const handleHandleTouchStart =
        (handle: HandleId) =>
        (e: TargetedTouchEvent<SVGRectElement>): void => {
            keyboard.stop();
            svgRef.current?.focus({ preventScroll: true });
            e.stopPropagation();
            e.preventDefault();
            setDragState({ type: 'resize', handle, snapshot: displayRect });
            setLiveCrop(displayRect);
        };

    // Two-tone marching-ants outline so it stays visible on any background.
    const renderCropOutline = (r: Crop): ReactElement => {
        const props = {
            x: r.x1,
            y: r.y1,
            width: r.x2 - r.x1,
            height: r.y2 - r.y1,
            fill: 'none',
            strokeWidth: CROP_STROKE_WIDTH,
            strokeDasharray: DASH_PX,
            vectorEffect: 'non-scaling-stroke',
            style: { pointerEvents: 'none' },
        };
        return (
            <>
                <rect {...props} stroke="white" />
                <rect {...props} stroke="red" strokeDashoffset={DASH_PX} />
            </>
        );
    };

    const renderHandle = (handle: HandleId, cx: number, cy: number): ReactElement => (
        <g key={handle}>
            {/* Enlarged transparent hit area for easier tapping on mobile */}
            <rect
                x={cx - handleHitSize / 2}
                y={cy - handleHitSize / 2}
                width={handleHitSize}
                height={handleHitSize}
                fill="transparent"
                style={{ cursor: HANDLE_CURSOR[handle] }}
                onMouseDown={handleHandleMouseDown(handle)}
                onTouchStart={handleHandleTouchStart(handle)}
            />
            <rect
                x={cx - handleVisualSize / 2}
                y={cy - handleVisualSize / 2}
                width={handleVisualSize}
                height={handleVisualSize}
                fill="white"
                stroke="red"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                style={{ pointerEvents: 'none' }}
            />
        </g>
    );

    const renderHandles = (r: Crop): ReactElement => {
        const { x1, y1, x2, y2 } = r;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        return (
            <>
                {renderHandle('tl', x1, y1)}
                {renderHandle('tm', mx, y1)}
                {renderHandle('tr', x2, y1)}
                {renderHandle('ml', x1, my)}
                {renderHandle('mr', x2, my)}
                {renderHandle('bl', x1, y2)}
                {renderHandle('bm', mx, y2)}
                {renderHandle('br', x2, y2)}
            </>
        );
    };

    const imageSvg = (
        <svg
            ref={svgRef}
            role={isCropping ? 'application' : undefined}
            aria-label={label}
            aria-describedby={isCropping ? descriptionId : undefined}
            tabindex={isCropping ? 0 : undefined}
            viewBox={`0 0 ${dimensions.w} ${dimensions.h}`}
            className="w-full h-full"
            overflow="visible"
            style={{ cursor: svgCursor }}
            onMouseMove={handleSvgMouseMove}
            onMouseDown={handleSvgMouseDown}
            onTouchStart={handleSvgTouchStart}
            onMouseLeave={() => setIsOverRect(false)}
            onKeyDown={keyboard.onKeyDown}
            onKeyUp={keyboard.onKeyUp}
            onFocus={() => setHasControlFocus(true)}
            onBlur={() => {
                keyboard.onBlur();
                setHasControlFocus(false);
            }}
        >
            <image href={base64Image} width={dimensions.w} height={dimensions.h} />

            {/* Shade outside the crop region using even-odd fill, clear inside */}
            <path
                d={`M0,0 H${dimensions.w} V${dimensions.h} H0 Z M${displayRect.x1},${displayRect.y1} H${displayRect.x2} V${displayRect.y2} H${displayRect.x1} Z`}
                fillRule="evenodd"
                fill="black"
                fillOpacity={0.5}
                style={{ pointerEvents: 'none' }}
            />
            {renderCropOutline(displayRect)}
            <ImageUploaderInputCrosshair
                cx={(displayRect.x1 + displayRect.x2) / 2}
                cy={(displayRect.y1 + displayRect.y2) / 2}
                pixelRatio={pixelRatio}
            />
            {renderHandles(displayRect)}
        </svg>
    );

    return (
        <>
            {imageSvg}
            {isCropping && (
                <ImageUploaderInputKeyboardDescription
                    id={descriptionId}
                    help={keyboardHelp}
                    position={position}
                    changeKey={`${displayRect.x1},${displayRect.y1},${displayRect.x2},${displayRect.y2}`}
                    active={hasControlFocus}
                />
            )}
        </>
    );
};

ImageUploaderInputCropSvg.displayName = 'ImageUploaderInputCropSvg';
