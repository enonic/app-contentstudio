import { type ReactElement } from 'react';
import { CROP_STROKE_WIDTH } from '../lib/crop';

type Props = {
    cx: number;
    cy: number;
    pixelRatio: number;
};

export const ImageUploaderInputCrosshair = ({ cx, cy, pixelRatio }: Props): ReactElement => {
    // Keep a 10px crosshair with a 4px white center, regardless of the SVG's viewBox scale.
    const halfSize = 5 * pixelRatio;
    const centerSize = 2 * pixelRatio;
    const props = {
        fill: 'none',
        strokeWidth: CROP_STROKE_WIDTH,
        vectorEffect: 'non-scaling-stroke',
    };

    return (
        <g aria-hidden="true" style={{ pointerEvents: 'none' }}>
            <path
                {...props}
                d={`M${cx - halfSize},${cy} H${cx + halfSize} M${cx},${cy - halfSize} V${cy + halfSize}`}
                stroke="red"
            />
            <path
                {...props}
                d={`M${cx - centerSize},${cy} H${cx + centerSize} M${cx},${cy - centerSize} V${cy + centerSize}`}
                stroke="white"
            />
        </g>
    );
};

ImageUploaderInputCrosshair.displayName = 'ImageUploaderInputCrosshair';
