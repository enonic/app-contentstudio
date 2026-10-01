import { type ReactElement, useCallback, useEffect, useState } from 'react';
import { useI18n } from '../../../../../../shared/lib/hooks/useI18n';
import { useImageUploaderContext } from '../ImageUploaderContext';
import {
    isPropertySetDirty,
    resetCropInPropertySet,
    resetFocusInPropertySet,
    resetPropertySet,
} from '../lib/propertySet';
import { type Crop, type Dimensions, type Point } from '../lib/types';
import { Button } from '@enonic/ui';

// Max distance (in image pixels) from the default focus that still counts as default.
const FOCUS_TOLERANCE_PX = 0.5;

export const ImageUploaderInputResetButton = (): ReactElement | null => {
    const { mode, value, crop, focus, dimensions, setCrop, setFocus, reset } = useImageUploaderContext();
    const resetLabel = useI18n('action.reset');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const set = value.getPropertySet();

        if (!set) return;

        setIsDirty(isPropertySetDirty(value));
        const listener = () => setIsDirty(isPropertySetDirty(value));
        set.onChanged(listener);

        return () => set.unChanged(listener);
    }, [value]);

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
            setFocus(getDefaultFocus(crop, dimensions));
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
        const defaultFocus = getDefaultFocus(crop, dimensions);
        const isFocusDefault =
            !focus ||
            !defaultFocus ||
            (Math.abs(focus.x - defaultFocus.x) <= FOCUS_TOLERANCE_PX &&
                Math.abs(focus.y - defaultFocus.y) <= FOCUS_TOLERANCE_PX);

        if (isFocusDefault) return null;
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

//
// * Internal
//

// Default (auto) focus: the crop center, or the image center when there is no crop.
function getDefaultFocus(crop: Crop | undefined, dimensions: Dimensions | undefined): Point | null {
    if (crop) return { x: (crop.x1 + crop.x2) / 2, y: (crop.y1 + crop.y2) / 2 };
    if (dimensions) return { x: dimensions.w / 2, y: dimensions.h / 2 };
    return null;
}
