import { useCallback, useEffect, useState } from 'react';
import { useImageUploaderContext } from './ImageUploaderContext';
import {
    isPropertySetDirty,
    readNormalizedCropFromPropertySet,
    readNormalizedFocusFromPropertySet,
    resetCropInPropertySet,
    resetFocusInPropertySet,
    resetPropertySet,
    setCropInPropertySet,
    setFocusInPropertySet,
} from './lib/propertySet';

// Max distance in image pixels from the default focus that still counts as default.
const FOCUS_TOLERANCE_PX = 0.5;

export function useImageUploaderReset() {
    const { enabled, mode, value, crop, focus, dimensions, setCrop, setFocus, reset } = useImageUploaderContext();
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const set = value?.getPropertySet();
        if (!set) {
            return;
        }

        const updateDirty = () => setIsDirty(isPropertySetDirty(value));
        updateDirty();
        set.onChanged(updateDirty);
        return () => set.unChanged(updateDirty);
    }, [value]);

    const defaultFocus = crop
        ? { x: (crop.x1 + crop.x2) / 2, y: (crop.y1 + crop.y2) / 2 }
        : dimensions
          ? { x: dimensions.w / 2, y: dimensions.h / 2 }
          : null;
    const isFocusDefault =
        !focus ||
        !defaultFocus ||
        (Math.abs(focus.x - defaultFocus.x) <= FOCUS_TOLERANCE_PX &&
            Math.abs(focus.y - defaultFocus.y) <= FOCUS_TOLERANCE_PX);
    const canReset = mode === 'crop' ? !!crop : mode === 'focus' ? !isFocusDefault : isDirty;

    const resetImage = (): boolean => {
        if (!enabled || !canReset) {
            return false;
        }

        if (mode === 'crop') {
            if (!resetCropInPropertySet(value)) {
                return false;
            }
            setCrop(null);
            if (dimensions) {
                setFocus({ x: dimensions.w / 2, y: dimensions.h / 2 });
            }
        } else if (mode === 'focus') {
            if (!resetFocusInPropertySet(value)) {
                return false;
            }
            setFocus(defaultFocus);
        } else {
            if (!resetPropertySet(value)) {
                return false;
            }
            reset();
        }
        return true;
    };

    return { canReset, resetImage };
}

export function useImageUploaderApply() {
    const { enabled, value, focus, mode, finishEditing, crop, dimensions } = useImageUploaderContext();
    const canApply = enabled && !!dimensions && (mode === 'crop' || mode === 'focus');

    const apply = useCallback((): boolean => {
        if (!canApply) {
            return false;
        }

        finishEditing();
        if (mode === 'focus') {
            setFocusInPropertySet(value, focus, dimensions);
        } else {
            setCropInPropertySet(value, crop, dimensions);
        }
        return true;
    }, [canApply, value, mode, finishEditing, focus, crop, dimensions]);

    return { canApply, apply };
}

export function useImageUploaderCancel() {
    const { enabled, value, mode, dimensions, finishEditing, setCrop, setFocus } = useImageUploaderContext();
    const canCancel = enabled && !!dimensions && (mode === 'crop' || mode === 'focus');

    const cancel = useCallback((): boolean => {
        if (!canCancel) {
            return false;
        }

        if (mode === 'crop') {
            const crop = readNormalizedCropFromPropertySet(value);
            setCrop(
                crop
                    ? {
                          x1: crop.x1 * dimensions.w,
                          y1: crop.y1 * dimensions.h,
                          x2: crop.x2 * dimensions.w,
                          y2: crop.y2 * dimensions.h,
                      }
                    : null,
            );
        } else {
            const focus = readNormalizedFocusFromPropertySet(value);
            setFocus(focus ? { x: focus.x * dimensions.w, y: focus.y * dimensions.h } : null);
        }

        finishEditing();
        return true;
    }, [canCancel, value, mode, dimensions, finishEditing, setCrop, setFocus]);

    return { canCancel, cancel };
}
