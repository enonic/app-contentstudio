import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../../../../../shared/lib/hooks/useI18n';
import { useImageUploaderContext } from '../ImageUploaderContext';
import {
    isPropertySetDirty,
    resetCropInPropertySet,
    resetFocusInPropertySet,
    resetPropertySet,
} from '../lib/propertySet';
import { type Point } from '../lib/types';
import { Button } from '@enonic/ui';

export const ImageUploaderInputResetButton = (): ReactElement | null => {
    const { mode, value, crop, focus, dimensions, setCrop, setFocus, reset } = useImageUploaderContext();
    const resetLabel = useI18n('action.reset');
    const [isDirty, setIsDirty] = useState(false);
    const [hasFocusMoved, setHasFocusMoved] = useState(false);
    const initialFocusRef = useRef<Point | null>(null);

    useEffect(() => {
        const set = value.getPropertySet();

        if (!set) return;

        setIsDirty(isPropertySetDirty(value));
        const listener = () => setIsDirty(isPropertySetDirty(value));
        set.onChanged(listener);

        return () => set.unChanged(listener);
    }, [value]);

    useEffect(() => {
        if (mode !== 'focus') {
            initialFocusRef.current = null;
            setHasFocusMoved(false);
            return;
        }

        if (!focus) return;

        if (initialFocusRef.current === null) {
            initialFocusRef.current = focus;
            return;
        }

        setHasFocusMoved(focus.x !== initialFocusRef.current.x || focus.y !== initialFocusRef.current.y);
    }, [mode, focus]);

    const handleReset = useCallback(() => {
        if (resetPropertySet(value)) {
            reset();
        }
    }, [value, reset]);

    const handleCropReset = useCallback(() => {
        if (resetCropInPropertySet(value)) {
            setCrop(null);
            if (dimensions) {
                setFocus({ x: dimensions.w / 2, y: dimensions.h / 2 });
            }
        }
    }, [value, dimensions, setCrop, setFocus]);

    const handleFocusReset = useCallback(() => {
        if (resetFocusInPropertySet(value)) {
            const newFocus = {
                x: crop ? (crop.x1 + crop.x2) / 2 : dimensions.w / 2,
                y: crop ? (crop.y1 + crop.y2) / 2 : dimensions.h / 2,
            };
            setFocus(newFocus);
        }
    }, [value, crop, dimensions, setFocus]);

    if (mode === 'crop') {
        if (!crop) return null;
        return (
            <Button variant="text" onClick={handleCropReset}>
                {resetLabel}
            </Button>
        );
    }

    if (mode === 'focus') {
        if (!hasFocusMoved) return null;
        return (
            <Button variant="text" onClick={handleFocusReset}>
                {resetLabel}
            </Button>
        );
    }

    if (!isDirty) return null;

    return (
        <Button variant="text" onClick={handleReset}>
            {resetLabel}
        </Button>
    );
};

ImageUploaderInputResetButton.displayName = 'ImageUploaderInputResetButton';
