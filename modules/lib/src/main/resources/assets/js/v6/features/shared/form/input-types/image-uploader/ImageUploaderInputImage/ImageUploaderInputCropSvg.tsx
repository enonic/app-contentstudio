import {type MouseEvent, type ReactElement, useMemo, useState} from 'react';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {type Point} from '../lib/types';

export const ImageUploaderInputCropSvg = (): ReactElement => {
    const {dimensions, base64Image, crop, setCrop} = useImageUploaderContext();
    const [pending, setPending] = useState<Point>();
    const [cursor, setCursor] = useState<Point>();
    const strokeWidth = Math.min(10, Math.min(dimensions.w, dimensions.h) * 0.01);

    const rect = useMemo(() => {
        if (pending && cursor) {
            return {
                x1: Math.min(pending.x, cursor.x),
                y1: Math.min(pending.y, cursor.y),
                x2: Math.max(pending.x, cursor.x),
                y2: Math.max(pending.y, cursor.y),
            };
        } else if (crop) {
            return crop;
        }

        return null;
    }, [pending, cursor, crop]);

    const toLocal = (e: MouseEvent<SVGSVGElement>): Point | null => {
        const svg = e.currentTarget;
        const ctm = svg.getScreenCTM();
        if (!ctm) return null;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const local = pt.matrixTransform(ctm.inverse());
        return {
            x: Math.max(0, Math.min(dimensions.w, local.x)),
            y: Math.max(0, Math.min(dimensions.h, local.y)),
        };
    };

    // Handlers
    const handleClick = (e: MouseEvent<SVGSVGElement>): void => {
        const p = toLocal(e);

        if (!p) return;

        if (pending) {
            // Second click: commit the crop
            setCrop({
                x1: Math.min(pending.x, p.x),
                y1: Math.min(pending.y, p.y),
                x2: Math.max(pending.x, p.x),
                y2: Math.max(pending.y, p.y),
            });
            setPending(null);
            setCursor(null);
        } else {
            // First click (also resets a previously committed crop)
            setCrop(null);
            setPending(p);
            setCursor(p);
        }
    };

    const handleMouseMove = (e: MouseEvent<SVGSVGElement>): void => {
        if (!pending) return;
        setCursor(toLocal(e));
    };

    return (
        <svg
            viewBox={`0 0 ${dimensions.w} ${dimensions.h}`}
            className="w-full h-full cursor-crosshair"
            style={{maxWidth: dimensions?.w, maxHeight: dimensions?.h}}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
        >
            <image href={base64Image} width={dimensions.w} height={dimensions.h} />

            {!rect && (
                <>
                    <rect x={0} y={0} width={dimensions.w} height={dimensions.h} fill="black" fillOpacity={0.5} />
                    {/* TODO: remove this harcoded text when crop is behavior gets updated */}
                    <text
                        x={dimensions.w / 2}
                        y={dimensions.h / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize={Math.min(dimensions.w, dimensions.h) * 0.04}
                        style={{pointerEvents: 'none'}}
                    >
                        Click the image to draw cropping area
                    </text>
                </>
            )}

            {rect && (
                <>
                    <path
                        d={`M0,0 H${dimensions.w} V${dimensions.h} H0 Z M${rect.x1},${rect.y1} H${rect.x2} V${rect.y2} H${rect.x1} Z`}
                        fillRule="evenodd"
                        fill="black"
                        strokeWidth={strokeWidth}
                        fillOpacity={0.5}
                    />
                    <rect
                        x={rect.x1}
                        y={rect.y1}
                        width={rect.x2 - rect.x1}
                        height={rect.y2 - rect.y1}
                        fill="none"
                        stroke="red"
                        strokeWidth={strokeWidth}
                    />
                </>
            )}
        </svg>
    );
};

ImageUploaderInputCropSvg.displayName = 'ImageUploaderInputCropSvg';
