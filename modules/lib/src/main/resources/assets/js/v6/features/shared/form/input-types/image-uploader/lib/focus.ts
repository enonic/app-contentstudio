import {applyTransform, FORWARD_MATRICES, INVERSE_MATRICES} from './matrices';
import {type Dimensions, type Point} from './types';

export function adjustFocusToBaseOrientation(point: Point, fromOrientation: number, dimensions: Dimensions): Point | null {
    if (!point) return null;
    if (fromOrientation === 1) return point;

    const matrices = INVERSE_MATRICES[fromOrientation];

    if (!matrices) return point;

    const sideways = fromOrientation >= 5;
    const orientedCenter: Point = {x: dimensions.w / 2, y: dimensions.h / 2};
    const baseCenter: Point = sideways ? {x: dimensions.h / 2, y: dimensions.w / 2} : orientedCenter;

    return applyTransform(matrices, point, orientedCenter, baseCenter);
}

export function adjustFocusForOrientation(point: Point, toOrientation: number, dimensions: Dimensions): Point | null {
    if (!point) return null;
    if (toOrientation === 1) return point;

    const matrices = FORWARD_MATRICES[toOrientation];

    if (!matrices) return point;

    const sideways = toOrientation >= 5;
    const orientedCenter: Point = {x: dimensions.w / 2, y: dimensions.h / 2};
    const baseCenter: Point = sideways ? {x: dimensions.h / 2, y: dimensions.w / 2} : orientedCenter;

    return applyTransform(matrices, point, baseCenter, orientedCenter);
}
