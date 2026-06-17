import {cn} from '@enonic/ui';
import {type ReactElement, useEffect, useRef, useState} from 'react';
import {type TargetedMouseEvent, type TargetedTouchEvent} from 'preact';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {getClientXYFromEvent} from '../lib/crop';
import {type Point} from '../lib/types';
import {FOCUS_STROKE_WIDTH} from '../lib/focus';

export const ImageUploaderInputFocusSvg = (): ReactElement => {
    const {dimensions, crop, base64Image, mode, focus, setFocus} = useImageUploaderContext();

    const isFocusing = mode === 'focus';
    const [isDragging, setIsDragging] = useState(false);
    const [isOverCircle, setIsOverCircle] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const cropXCenter = crop ? (crop.x1 + crop.x2) / 2 : dimensions.w / 2;
    const cropYCenter = crop ? (crop.y1 + crop.y2) / 2 : dimensions.h / 2;
    const viewX = crop ? crop.x1 : 0;
    const viewY = crop ? crop.y1 : 0;
    const viewW = crop ? crop.x2 - crop.x1 : dimensions.w;
    const viewH = crop ? crop.y2 - crop.y1 : dimensions.h;
    const radius = Math.min(viewW, viewH) * 0.25;

    const toLocalFromClient = (clientX: number, clientY: number): Point | null => {
        const svg = svgRef.current;
        if (!svg) return null;
        const ctm = svg.getScreenCTM();
        if (!ctm) return null;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const local = pt.matrixTransform(ctm.inverse());
        return {
            x: Math.max(viewX, Math.min(viewX + viewW, local.x)),
            y: Math.max(viewY, Math.min(viewY + viewH, local.y)),
        };
    };

    // While in focus mode, default the circle to the crop/image center so it shows
    // immediately on entering focus mode, before any click.
    const displayFocus = focus ?? (isFocusing ? {x: cropXCenter, y: cropYCenter} : null);

    const handleMouseMove = (e: TargetedMouseEvent<SVGSVGElement>): void => {
        if (isDragging || !isFocusing || !displayFocus) return;
        const p = toLocalFromClient(e.clientX, e.clientY);
        if (!p) return;
        const dx = p.x - displayFocus.x;
        const dy = p.y - displayFocus.y;
        setIsOverCircle(Math.sqrt(dx * dx + dy * dy) <= radius);
    };

    const handleMouseDown = (e: TargetedMouseEvent<SVGSVGElement>): void => {
        if (!isFocusing) return;
        e.preventDefault();
        const p = toLocalFromClient(e.clientX, e.clientY);
        if (!p) return;
        setIsDragging(true);
        setFocus(p);
    };

    const handleTouchStart = (e: TargetedTouchEvent<SVGSVGElement>): void => {
        if (!isFocusing) return;
        e.preventDefault();
        const touch = e.touches[0];
        if (!touch) return;
        const p = toLocalFromClient(touch.clientX, touch.clientY);
        if (!p) return;
        setIsDragging(true);
        setFocus(p);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleWindowMove = (e: MouseEvent | TouchEvent): void => {
            const {clientX, clientY} = getClientXYFromEvent(e);
            const p = toLocalFromClient(clientX, clientY);
            if (p) setFocus(p);
        };

        const handleWindowUp = (): void => {
            setIsDragging(false);
            setIsOverCircle(true);
        };

        window.addEventListener('mousemove', handleWindowMove);
        window.addEventListener('mouseup', handleWindowUp);
        window.addEventListener('touchmove', handleWindowMove, {passive: false});
        window.addEventListener('touchend', handleWindowUp);

        return () => {
            window.removeEventListener('mousemove', handleWindowMove);
            window.removeEventListener('mouseup', handleWindowUp);
            window.removeEventListener('touchmove', handleWindowMove);
            window.removeEventListener('touchend', handleWindowUp);
        };
    }, [isDragging]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <svg
            ref={svgRef}
            viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
            className={cn('w-full h-full', isDragging ? 'cursor-grabbing' : isOverCircle ? 'cursor-grab' : isFocusing ? 'cursor-move' : '')}
            style={{maxWidth: dimensions?.w, maxHeight: dimensions?.h}}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setIsOverCircle(false)}
            onTouchStart={handleTouchStart}
        >
            <image href={base64Image} x={viewX} y={viewY} width={viewW} height={viewH} />

            {isFocusing && displayFocus && (
                <>
                    <mask id="focus-mask">
                        <rect x={viewX} y={viewY} width={viewW} height={viewH} fill="white" />
                        <circle cx={displayFocus.x} cy={displayFocus.y} r={radius} fill="black" />
                    </mask>
                    <rect x={viewX} y={viewY} width={viewW} height={viewH} fill="black" fillOpacity={0.5} mask="url(#focus-mask)" />
                    <circle
                        cx={displayFocus.x}
                        cy={displayFocus.y}
                        r={radius}
                        fill="none"
                        stroke="red"
                        strokeWidth={FOCUS_STROKE_WIDTH}
                        strokeDasharray={FOCUS_STROKE_WIDTH * 2}
                    />
                </>
            )}

            {!isFocusing && focus && focus.x !== cropXCenter && focus.y !== cropYCenter && (
                <circle
                    cx={focus.x}
                    cy={focus.y}
                    r={radius}
                    fill="none"
                    stroke="red"
                    strokeWidth={FOCUS_STROKE_WIDTH}
                    strokeDasharray={FOCUS_STROKE_WIDTH * 2}
                />
            )}
        </svg>
    );
};

ImageUploaderInputFocusSvg.displayName = 'ImageUploaderInputFocusSvg';
