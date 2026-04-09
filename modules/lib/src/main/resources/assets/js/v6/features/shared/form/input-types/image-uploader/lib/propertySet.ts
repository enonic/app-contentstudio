import {type Value} from '@enonic/lib-admin-ui/data/Value';
import {type Crop, type Dimensions, type Point} from './types';

export function isPropertySetDirty(value: Value): boolean {
    if (!value || value.isNull()) return false;

    const set = value.getPropertySet();

    if (!set) return false;

    const orientation = set.getProperty('orientation')?.getLong();

    if (orientation != null && orientation !== 1) return true;
    if (set.getProperty('cropPosition') != null) return true;
    if (set.getProperty('zoomPosition') != null) return true;

    const focalSet = set.getProperty('focalPoint')?.getPropertySet();

    if (focalSet) {
        const fx = focalSet.getDouble('x');
        const fy = focalSet.getDouble('y');
        if (fx != null && fy != null && (fx !== 0.5 || fy !== 0.5)) return true;
    }

    return false;
}

export function resetPropertySet(value: Value): boolean {
    if (!value || value.isNull()) return false;

    const set = value.getPropertySet();

    if (!set) return false;

    set.removeProperty('orientation', 0);
    set.removeProperty('focalPoint', 0);
    set.removeProperty('cropPosition', 0);
    set.removeProperty('zoomPosition', 0);
    set.setDoubleByPath('focalPoint.x', 0.5);
    set.setDoubleByPath('focalPoint.y', 0.5);

    return true;
}

export function resetCropInPropertySet(value: Value): boolean {
    if (!value || value.isNull()) return false;

    const set = value.getPropertySet();

    if (!set) return false;

    set.removeProperty('cropPosition', 0);
    set.removeProperty('zoomPosition', 0);

    return true;
}

export function resetFocusInPropertySet(value: Value): boolean {
    if (!value || value.isNull()) return false;

    const set = value.getPropertySet();

    if (!set) return false;

    const crop = readNormalizedCropFromPropertySet(value);
    const fx = crop ? (crop.x1 + crop.x2) / 2 : 0.5;
    const fy = crop ? (crop.y1 + crop.y2) / 2 : 0.5;

    set.setDoubleByPath('focalPoint.x', fx);
    set.setDoubleByPath('focalPoint.y', fy);

    return true;
}

export function setCropInPropertySet(value: Value, crop: Crop, dimensions: Dimensions): void {
    if (!value || value.isNull()) return;

    const set = value.getPropertySet();

    if (!set) return;

    if (crop && dimensions) {
        set.setDoubleByPath('cropPosition.left', crop.x1 / dimensions.w);
        set.setDoubleByPath('cropPosition.top', crop.y1 / dimensions.h);
        set.setDoubleByPath('cropPosition.right', crop.x2 / dimensions.w);
        set.setDoubleByPath('cropPosition.bottom', crop.y2 / dimensions.h);
        set.setDoubleByPath('cropPosition.zoom', 1);
        set.setDoubleByPath('zoomPosition.left', 0);
        set.setDoubleByPath('zoomPosition.top', 0);
        set.setDoubleByPath('zoomPosition.right', 1);
        set.setDoubleByPath('zoomPosition.bottom', 1);
    } else {
        set.removeProperty('cropPosition', 0);
        set.removeProperty('zoomPosition', 0);
    }
}

export function setFocusInPropertySet(value: Value, focus: Point, dimensions: Dimensions): void {
    if (!value || value.isNull()) return;

    const set = value.getPropertySet();

    if (!set) return;

    if (focus && dimensions) {
        set.setDoubleByPath('focalPoint.x', focus.x / dimensions.w);
        set.setDoubleByPath('focalPoint.y', focus.y / dimensions.h);
    } else {
        set.setDoubleByPath('focalPoint.x', 0.5);
        set.setDoubleByPath('focalPoint.y', 0.5);
    }
}

export function setRotationInPropertySet(value: Value): number {
    if (!value || value.isNull()) return 1;

    const set = value.getPropertySet();

    if (!set) return 1;

    const currentOrientation = set.getProperty('orientation')?.getLong() ?? 1;
    const newOrientation = ROTATE_CW_MAP[currentOrientation] ?? 1;

    if (newOrientation === 1) {
        set.removeProperty('orientation', 0);
    } else {
        set.setLongByPath('orientation', newOrientation);
    }

    return newOrientation;
}

export function setFlipInPropertySet(value: Value): number {
    if (!value || value.isNull()) return 1;

    const set = value.getPropertySet();

    if (!set) return 1;

    const currentOrientation = set.getProperty('orientation')?.getLong() ?? 1;
    const newOrientation = MIRROR_MAP[currentOrientation] ?? 1;

    if (newOrientation === 1) {
        set.removeProperty('orientation', 0);
    } else {
        set.setLongByPath('orientation', newOrientation);
    }

    return newOrientation;
}

export function readOrientationFromPropertySet(value: Value): number {
    return value?.getPropertySet()?.getProperty('orientation')?.getLong() ?? 1;
}

export function readNormalizedCropFromPropertySet(value: Value): Crop | null {
    const cropProp = value?.getPropertySet()?.getProperty('cropPosition');

    if (!cropProp) return null;

    const cropSet = cropProp.getPropertySet();
    const left = cropSet?.getDouble('left');
    const top = cropSet?.getDouble('top');
    const right = cropSet?.getDouble('right');
    const bottom = cropSet?.getDouble('bottom');

    if (left == null || top == null || right == null || bottom == null) return null;

    return {x1: left, y1: top, x2: right, y2: bottom};
}

export function readNormalizedFocusFromPropertySet(value: Value): Point | null {
    const focalSet = value?.getPropertySet()?.getProperty('focalPoint')?.getPropertySet();

    if (!focalSet) return null;

    const x = focalSet.getDouble('x');
    const y = focalSet.getDouble('y');

    if (x == null || y == null) return null;

    return {x, y};
}

//
// * Utilities
//

const ROTATE_CW_MAP: Record<number, number> = {
    1: 6,
    2: 7,
    3: 8,
    4: 5,
    5: 2,
    6: 3,
    7: 4,
    8: 1,
};

const MIRROR_MAP: Record<number, number> = {
    1: 2,
    2: 1,
    3: 4,
    4: 3,
    5: 6,
    6: 5,
    7: 8,
    8: 7,
};
