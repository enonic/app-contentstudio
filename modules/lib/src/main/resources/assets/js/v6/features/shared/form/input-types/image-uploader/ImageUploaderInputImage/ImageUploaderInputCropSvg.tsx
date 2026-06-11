import {type ReactElement, useEffect, useRef, useState} from 'react';
import {type TargetedMouseEvent, type TargetedTouchEvent} from 'preact';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {applyMove, applyResize, getCropSvgCursor, getClientXYFromEvent, HANDLE_CURSOR, toLocalFromClient} from '../lib/crop';
import {type Crop, type DragState, type HandleId} from '../lib/types';

export const ImageUploaderInputCropSvg = (): ReactElement => {
    const {dimensions, base64Image, crop, setCrop} = useImageUploaderContext();
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragState, setDragState] = useState<DragState>(null);
    const [liveCrop, setLiveCrop] = useState<Crop | null>(null);
    const [isOverRect, setIsOverRect] = useState(false);

    const strokeWidth = Math.min(10, Math.min(dimensions.w, dimensions.h) * 0.01);
    const handleVisualSize = Math.max(8, strokeWidth * 2.5);
    const handleHitSize = Math.max(handleVisualSize * 2, 20);
    const minSize = Math.max(strokeWidth * 2, 4);
    const dragThreshold = minSize;

    // Only use liveCrop during an active drag; otherwise always derive from context crop.
    const displayRect: Crop =
        dragState != null && liveCrop != null
            ? liveCrop
            : crop ?? {x1: 0, y1: 0, x2: dimensions.w, y2: dimensions.h};

    const svgCursor = getCropSvgCursor(dragState, isOverRect);

    useEffect(() => {
        if (!dragState) return;

        // Updates the live crop rectangle as the user drags a handle or moves the crop.
        const handleMove = (e: MouseEvent | TouchEvent): void => {
            e.preventDefault();
            const {clientX, clientY} = getClientXYFromEvent(e);
            const svg = svgRef.current;
            if (!svg) return;
            const p = toLocalFromClient(svg, clientX, clientY, dimensions);
            if (!p) return;
            if (dragState.type === 'resize') {
                setLiveCrop(applyResize(dragState.handle, dragState.snapshot, p, minSize));
            } else {
                setLiveCrop(applyMove(dragState.snapshot, dragState.anchor, p, dimensions));
            }
        };

        // Commits the updated crop to context and clears drag state on pointer release.
        const handleUp = (e: MouseEvent | TouchEvent): void => {
            const {clientX, clientY} = getClientXYFromEvent(e);
            const svg = svgRef.current;
            if (svg) {
                const p = toLocalFromClient(svg, clientX, clientY, dimensions);

                if (p) {
                    if (dragState.type === 'resize') {
                        setCrop(applyResize(dragState.handle, dragState.snapshot, p, minSize));
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
        window.addEventListener('touchmove', handleMove, {passive: false});
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
        if (!crop) return;
        const svg = svgRef.current;
        if (!svg) return;
        const p = toLocalFromClient(svg, e.clientX, e.clientY, dimensions);
        if (!p) return;
        const inside = p.x >= displayRect.x1 && p.x <= displayRect.x2 && p.y >= displayRect.y1 && p.y <= displayRect.y2;
        if (!inside) return;
        e.preventDefault();
        setDragState({type: 'move', anchor: p, snapshot: displayRect});
        setLiveCrop(displayRect);
    };

    // Begins a move drag when the user touches inside the crop area on a touch device.
    const handleSvgTouchStart = (e: TargetedTouchEvent<SVGSVGElement>): void => {
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
        setDragState({type: 'move', anchor: p, snapshot: displayRect});
        setLiveCrop(displayRect);
    };

    // Begins a resize drag when the user presses a handle with the mouse.
    const handleHandleMouseDown =
        (handle: HandleId) =>
        (e: TargetedMouseEvent<SVGRectElement>): void => {
            e.stopPropagation();
            e.preventDefault();
            setDragState({type: 'resize', handle, snapshot: displayRect});
            setLiveCrop(displayRect);
        };

    // Begins a resize drag when the user touches a handle on a touch device.
    const handleHandleTouchStart =
        (handle: HandleId) =>
        (e: TargetedTouchEvent<SVGRectElement>): void => {
            e.stopPropagation();
            e.preventDefault();
            setDragState({type: 'resize', handle, snapshot: displayRect});
            setLiveCrop(displayRect);
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
                style={{cursor: HANDLE_CURSOR[handle]}}
                onMouseDown={handleHandleMouseDown(handle)}
                onTouchStart={handleHandleTouchStart(handle)}
            />
            <rect
                x={cx - handleVisualSize / 2}
                y={cy - handleVisualSize / 2}
                width={handleVisualSize}
                height={handleVisualSize}
                fill="red"
                stroke="white"
                strokeWidth={Math.max(1, strokeWidth * 0.3)}
                style={{pointerEvents: 'none'}}
            />
        </g>
    );

    const renderHandles = (r: Crop): ReactElement => {
        const {x1, y1, x2, y2} = r;
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

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${dimensions.w} ${dimensions.h}`}
            className="w-full h-full"
            overflow="visible"
            style={{maxWidth: dimensions?.w, maxHeight: dimensions?.h, cursor: svgCursor}}
            onMouseMove={handleSvgMouseMove}
            onMouseDown={handleSvgMouseDown}
            onTouchStart={handleSvgTouchStart}
            onMouseLeave={() => setIsOverRect(false)}
        >
            <image href={base64Image} width={dimensions.w} height={dimensions.h} />

            {/* Shade outside the crop region using even-odd fill, clear inside */}
            <path
                d={`M0,0 H${dimensions.w} V${dimensions.h} H0 Z M${displayRect.x1},${displayRect.y1} H${displayRect.x2} V${displayRect.y2} H${displayRect.x1} Z`}
                fillRule="evenodd"
                fill="black"
                fillOpacity={0.5}
                style={{pointerEvents: 'none'}}
            />
            <rect
                x={displayRect.x1}
                y={displayRect.y1}
                width={displayRect.x2 - displayRect.x1}
                height={displayRect.y2 - displayRect.y1}
                fill="none"
                stroke="red"
                strokeWidth={strokeWidth}
                style={{pointerEvents: 'none'}}
            />
            {renderHandles(displayRect)}
        </svg>
    );
};

ImageUploaderInputCropSvg.displayName = 'ImageUploaderInputCropSvg';
