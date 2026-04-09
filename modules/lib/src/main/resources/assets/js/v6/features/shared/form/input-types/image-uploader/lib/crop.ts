import {applyTransform, FORWARD_MATRICES, INVERSE_MATRICES} from './matrices';
import {type Crop, type Dimensions, type Point} from './types';

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
