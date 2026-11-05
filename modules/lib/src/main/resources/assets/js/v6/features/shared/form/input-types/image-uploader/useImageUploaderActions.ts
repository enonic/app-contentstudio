import { useCallback, useEffect, useState } from 'react';
import { useImageUploaderContext } from './ImageUploaderContext';
import {
    isPropertySetDirty,
    readNormalizedCropFromPropertySet,
    readNormalizedFocusFromPropertySet,
    readOrientationFromPropertySet,
    resetPropertySet,
    setCropInPropertySet,
    setFocusInPropertySet,
    setOrientationInPropertySet,
} from './lib/propertySet';

export function useImageUploaderReset() {
    const {
        enabled,
        mode,
        value,
        crop,
        focus,
        dimensions,
        orientation,
        transformResetOrientationRef,
        setCrop,
        setFocus,
        setOrientation,
        reset,
    } = useImageUploaderContext();
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

    const isEditing = mode === 'crop' || mode === 'focus' || mode === 'transform';
    const defaultFocus = crop
        ? { x: (crop.x1 + crop.x2) / 2, y: (crop.y1 + crop.y2) / 2 }
        : dimensions
          ? { x: dimensions.w / 2, y: dimensions.h / 2 }
          : null;
    const resetOrientation = transformResetOrientationRef.current;
    const canReset =
        mode === 'crop'
            ? !!crop &&
              !!dimensions &&
              (crop.x1 !== 0 || crop.y1 !== 0 || crop.x2 !== dimensions.w || crop.y2 !== dimensions.h)
            : mode === 'focus'
              ? !!focus &&
                !!defaultFocus &&
                (Math.abs(focus.x - defaultFocus.x) > 0.5 || Math.abs(focus.y - defaultFocus.y) > 0.5)
              : mode === 'transform'
                ? orientation !== resetOrientation
                : isDirty;

    const resetImage = (): boolean => {
        if (!enabled || !canReset) {
            return false;
        }

        if (mode === 'crop') {
            setCrop(null);
        } else if (mode === 'focus') {
            setFocus(defaultFocus);
        } else if (mode === 'transform') {
            setOrientation(resetOrientation);
        } else {
            if (!resetPropertySet(value)) return false;
            reset();
        }
        return true;
    };

    return { canReset, isEditing, resetImage };
}

export function useImageUploaderApply() {
    const { enabled, value, focus, mode, finishEditing, crop, dimensions, orientation, isPreviewReady } =
        useImageUploaderContext();
    const canApply =
        enabled && !!dimensions && (mode === 'crop' || mode === 'focus' || (mode === 'transform' && isPreviewReady));

    const apply = useCallback((): boolean => {
        if (!canApply) {
            return false;
        }

        if (mode === 'focus') {
            setFocusInPropertySet(value, focus, dimensions);
        } else if (mode === 'crop') {
            setCropInPropertySet(value, crop, dimensions);
        } else {
            setOrientationInPropertySet(value, orientation);
            if (crop) setCropInPropertySet(value, crop, dimensions);
            if (focus) setFocusInPropertySet(value, focus, dimensions);
        }
        finishEditing();
        return true;
    }, [canApply, value, mode, finishEditing, focus, crop, dimensions, orientation]);

    return { canApply, apply };
}

export function useImageUploaderCancel() {
    const { enabled, value, mode, dimensions, finishEditing, setCrop, setFocus, setOrientation } =
        useImageUploaderContext();
    const canCancel = enabled && !!dimensions && (mode === 'crop' || mode === 'focus' || mode === 'transform');

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
        } else if (mode === 'focus') {
            const focus = readNormalizedFocusFromPropertySet(value);
            setFocus(focus ? { x: focus.x * dimensions.w, y: focus.y * dimensions.h } : null);
        } else {
            setOrientation(readOrientationFromPropertySet(value));
        }

        finishEditing();
        return true;
    }, [canCancel, value, mode, dimensions, finishEditing, setCrop, setFocus, setOrientation]);

    return { canCancel, cancel };
}
