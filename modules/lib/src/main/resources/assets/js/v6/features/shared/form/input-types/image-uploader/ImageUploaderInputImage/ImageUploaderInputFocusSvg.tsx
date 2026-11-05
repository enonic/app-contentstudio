import { cn } from '@enonic/ui';
import { type ReactElement, useEffect, useId, useRef, useState } from 'react';
import { type TargetedMouseEvent, type TargetedTouchEvent } from 'preact';
import { useI18n } from '../../../../../../shared/lib/hooks/useI18n';
import { useImageUploaderContext } from '../ImageUploaderContext';
import { getClientXYFromEvent } from '../lib/crop';
import { type Point } from '../lib/types';
import { FOCUS_STROKE_WIDTH, FOCUS_DASH_PX } from '../lib/focus';
import { useImageArrowKeys } from '../useImageArrowKeys';
import { ImageUploaderInputCrosshair } from './ImageUploaderInputCrosshair';
import { getImagePercent, ImageUploaderInputKeyboardDescription } from './ImageUploaderInputKeyboardDescription';

const COMPONENT_NAME = 'ImageUploaderInputFocusSvg';

export const ImageUploaderInputFocusSvg = ({
    keyboardStep,
    pixelRatio,
}: {
    keyboardStep: number;
    pixelRatio: number;
}): ReactElement => {
    const { dimensions, crop, base64Image, mode, focus, setFocus, enabled } = useImageUploaderContext();
    const label = useI18n('editor.setautofocus');
    const keyboardHelp = useI18n('editor.setautofocus.keyboard.help');

    const isFocusing = mode === 'focus' && enabled;
    const [isDragging, setIsDragging] = useState(false);
    const [isOverCircle, setIsOverCircle] = useState(false);
    const [hasControlFocus, setHasControlFocus] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const keyboardFocusRef = useRef<Point | null>(null);
    const baseId = useId();
    const maskId = `${COMPONENT_NAME}-${baseId}-mask`;
    const clipId = `${COMPONENT_NAME}-${baseId}-clip`;
    const descriptionId = `${COMPONENT_NAME}-${baseId}-description`;

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
    const displayFocus = focus ?? (isFocusing ? { x: cropXCenter, y: cropYCenter } : null);
    keyboardFocusRef.current = displayFocus;
    const position = useI18n(
        'editor.setautofocus.position',
        getImagePercent(displayFocus?.x ?? 0, dimensions.w),
        getImagePercent(displayFocus?.y ?? 0, dimensions.h),
    );

    const keyboard = useImageArrowKeys({
        enabled: isFocusing,
        onStep: ({ keys }, multiplier) => {
            const point = keyboardFocusRef.current;
            if (!point) {
                return;
            }

            const dx = Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'));
            const dy = Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp'));
            const step = keyboardStep * multiplier;
            const nextFocus = {
                x: Math.max(viewX, Math.min(viewX + viewW, point.x + dx * step)),
                y: Math.max(viewY, Math.min(viewY + viewH, point.y + dy * step)),
            };
            if (nextFocus.x === point.x && nextFocus.y === point.y) {
                return;
            }

            keyboardFocusRef.current = nextFocus;
            setFocus(nextFocus);
        },
    });

    useEffect(() => {
        if (isFocusing) {
            svgRef.current?.focus({ preventScroll: true });
        }
    }, [isFocusing]);

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
        e.currentTarget.focus({ preventScroll: true });
        const p = toLocalFromClient(e.clientX, e.clientY);
        if (!p) return;
        setIsDragging(true);
        setFocus(p);
    };

    const handleTouchStart = (e: TargetedTouchEvent<SVGSVGElement>): void => {
        if (!isFocusing) return;
        e.preventDefault();
        e.currentTarget.focus({ preventScroll: true });
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
            const { clientX, clientY } = getClientXYFromEvent(e);
            const p = toLocalFromClient(clientX, clientY);
            if (p) setFocus(p);
        };

        const handleWindowUp = (): void => {
            setIsDragging(false);
            setIsOverCircle(true);
        };

        window.addEventListener('mousemove', handleWindowMove);
        window.addEventListener('mouseup', handleWindowUp);
        window.addEventListener('touchmove', handleWindowMove, { passive: false });
        window.addEventListener('touchend', handleWindowUp);

        return () => {
            window.removeEventListener('mousemove', handleWindowMove);
            window.removeEventListener('mouseup', handleWindowUp);
            window.removeEventListener('touchmove', handleWindowMove);
            window.removeEventListener('touchend', handleWindowUp);
        };
    }, [isDragging]); // eslint-disable-line react-hooks/exhaustive-deps

    // Two-tone marching-ants ring so it stays visible on any background.
    const renderFocusRing = (cx: number, cy: number, r: number): ReactElement => {
        const props = {
            cx,
            cy,
            r,
            fill: 'none',
            strokeWidth: FOCUS_STROKE_WIDTH,
            strokeDasharray: FOCUS_DASH_PX,
            vectorEffect: 'non-scaling-stroke',
        };
        return (
            <>
                <circle {...props} stroke="white" />
                <circle {...props} stroke="red" strokeDashoffset={FOCUS_DASH_PX} />
                <ImageUploaderInputCrosshair cx={cx} cy={cy} pixelRatio={pixelRatio} />
            </>
        );
    };

    const imageSvg = (
        <svg
            ref={svgRef}
            role={isFocusing ? 'application' : undefined}
            aria-label={isFocusing ? label : undefined}
            aria-describedby={isFocusing ? descriptionId : undefined}
            aria-keyshortcuts={isFocusing ? 'ArrowUp ArrowDown ArrowLeft ArrowRight' : undefined}
            tabindex={isFocusing ? 0 : undefined}
            viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
            className={cn(
                'w-full h-full',
                isDragging ? 'cursor-grabbing' : isOverCircle ? 'cursor-grab' : isFocusing ? 'cursor-move' : '',
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setIsOverCircle(false)}
            onTouchStart={handleTouchStart}
            onKeyDown={keyboard.onKeyDown}
            onKeyUp={keyboard.onKeyUp}
            onFocus={() => setHasControlFocus(true)}
            onBlur={() => {
                keyboard.onBlur();
                setHasControlFocus(false);
            }}
        >
            <image href={base64Image} x={viewX} y={viewY} width={viewW} height={viewH} />

            {/* Keep the focal-point ring inside the image/crop rect at the edges. */}
            <clipPath id={clipId}>
                <rect x={viewX} y={viewY} width={viewW} height={viewH} />
            </clipPath>

            <g clipPath={`url(#${clipId})`}>
                {isFocusing && displayFocus && (
                    <>
                        <mask id={maskId}>
                            <rect x={viewX} y={viewY} width={viewW} height={viewH} fill="white" />
                            <circle cx={displayFocus.x} cy={displayFocus.y} r={radius} fill="black" />
                        </mask>
                        <rect
                            x={viewX}
                            y={viewY}
                            width={viewW}
                            height={viewH}
                            fill="black"
                            fillOpacity={0.5}
                            mask={`url(#${maskId})`}
                        />
                        {renderFocusRing(displayFocus.x, displayFocus.y, radius)}
                    </>
                )}

                {!isFocusing &&
                    focus &&
                    (focus.x !== cropXCenter || focus.y !== cropYCenter) &&
                    renderFocusRing(focus.x, focus.y, radius)}
            </g>
        </svg>
    );

    return (
        <>
            {imageSvg}
            {isFocusing && (
                <ImageUploaderInputKeyboardDescription
                    id={descriptionId}
                    help={keyboardHelp}
                    position={position}
                    changeKey={`${displayFocus?.x},${displayFocus?.y}`}
                    active={hasControlFocus}
                />
            )}
        </>
    );
};

ImageUploaderInputFocusSvg.displayName = COMPONENT_NAME;
