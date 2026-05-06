import {cn} from '@enonic/ui';
import {type MouseEvent, type ReactElement} from 'react';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {type Point} from '../lib/types';

export const ImageUploaderInputFocusSvg = (): ReactElement => {
    const {dimensions, crop, base64Image, mode, focus, setFocus} = useImageUploaderContext();

    const isFocusing = mode === 'focus';

    const cropXCenter = crop ? (crop.x1 + crop.x2) / 2 : dimensions.w / 2;
    const cropYCenter = crop ? (crop.y1 + crop.y2) / 2 : dimensions.h / 2;
    const viewX = crop ? crop.x1 : 0;
    const viewY = crop ? crop.y1 : 0;
    const viewW = crop ? crop.x2 - crop.x1 : dimensions.w;
    const viewH = crop ? crop.y2 - crop.y1 : dimensions.h;
    const radius = Math.min(viewW, viewH) * 0.25;
    const strokeWidth = Math.min(10, Math.min(viewW, viewH) * 0.01);

    const toLocal = (e: MouseEvent<SVGSVGElement>): Point | null => {
        const svg = e.currentTarget;
        const ctm = svg.getScreenCTM();
        if (!ctm) return null;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const local = pt.matrixTransform(ctm.inverse());
        return {
            x: Math.max(viewX, Math.min(viewX + viewW, local.x)),
            y: Math.max(viewY, Math.min(viewY + viewH, local.y)),
        };
    };

    const handleClick = (e: MouseEvent<SVGSVGElement>): void => {
        const p = toLocal(e);
        if (!p || !isFocusing) return;
        setFocus(p);
    };

    // While in focus mode, default the circle to the crop/image center so it shows
    // immediately on entering focus mode, before any click.
    const displayFocus = focus ?? (isFocusing ? {x: cropXCenter, y: cropYCenter} : null);

    return (
        <svg
            viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
            className={cn('w-full h-full', isFocusing && 'cursor-move')}
            style={{maxWidth: dimensions?.w, maxHeight: dimensions?.h}}
            onClick={handleClick}
        >
            <image href={base64Image} x={viewX} y={viewY} width={viewW} height={viewH} />

            {isFocusing && displayFocus && (
                <>
                    <mask id="focus-mask">
                        <rect x={viewX} y={viewY} width={viewW} height={viewH} fill="white" />
                        <circle cx={displayFocus.x} cy={displayFocus.y} r={radius} fill="black" />
                    </mask>
                    <rect x={viewX} y={viewY} width={viewW} height={viewH} fill="black" fillOpacity={0.5} mask="url(#focus-mask)" />
                    <circle cx={displayFocus.x} cy={displayFocus.y} r={radius} fill="none" stroke="red" strokeWidth={strokeWidth} />
                </>
            )}

            {!isFocusing && focus && focus.x !== cropXCenter && focus.y !== cropYCenter && (
                <circle cx={focus.x} cy={focus.y} r={radius} fill="none" stroke="red" strokeWidth={strokeWidth} />
            )}
        </svg>
    );
};

ImageUploaderInputFocusSvg.displayName = 'ImageUploaderInputFocusSvg';
