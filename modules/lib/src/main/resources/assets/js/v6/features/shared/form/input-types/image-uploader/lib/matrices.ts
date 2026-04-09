import {type Point} from './types';

export const IDENTITY_MATRIX = [
    [1, 0],
    [0, 1],
];

const FLIP_HORIZONTAL_MATRIX = [
    [-1, 0],
    [0, 1],
];

const ROTATECW_90_MATRIX = [
    [0, -1],
    [1, 0],
];

const ROTATECW_180_MATRIX = [
    [-1, 0],
    [0, -1],
];

const ROTATECW_270_MATRIX = [
    [0, 1],
    [-1, 0],
];

export const FORWARD_MATRICES: Record<number, number[][][]> = {
    2: [FLIP_HORIZONTAL_MATRIX],
    3: [ROTATECW_180_MATRIX],
    4: [FLIP_HORIZONTAL_MATRIX, ROTATECW_180_MATRIX],
    5: [FLIP_HORIZONTAL_MATRIX, ROTATECW_90_MATRIX],
    6: [ROTATECW_90_MATRIX],
    7: [FLIP_HORIZONTAL_MATRIX, ROTATECW_270_MATRIX],
    8: [ROTATECW_270_MATRIX],
};

export const INVERSE_MATRICES: Record<number, number[][][]> = {
    2: [FLIP_HORIZONTAL_MATRIX],
    3: [ROTATECW_180_MATRIX],
    4: [FLIP_HORIZONTAL_MATRIX, ROTATECW_180_MATRIX],
    5: [FLIP_HORIZONTAL_MATRIX, ROTATECW_90_MATRIX],
    6: [ROTATECW_270_MATRIX],
    7: [FLIP_HORIZONTAL_MATRIX, ROTATECW_270_MATRIX],
    8: [ROTATECW_90_MATRIX],
};

export const applyTransform = (matrices: number[][][], point: Point, fromOrigin: Point, toOrigin: Point): Point => {
    const result = matrices.reduceRight<Point>(
        (p, matrix) => ({
            x: matrix[0][0] * p.x + matrix[0][1] * p.y,
            y: matrix[1][0] * p.x + matrix[1][1] * p.y,
        }),
        {x: point.x - fromOrigin.x, y: point.y - fromOrigin.y}
    );

    return {x: toOrigin.x + result.x, y: toOrigin.y + result.y};
};
