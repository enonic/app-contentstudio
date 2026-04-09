import {type ReactElement, useCallback, useEffect, useState} from 'react';
import {ContentRequiresSaveEvent} from '../../../../../../../app/event/ContentRequiresSaveEvent';
import {useI18n} from '../../../../../hooks/useI18n';
import {InlineButton} from '../../../../InlineButton';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {isPropertySetDirty, resetCropInPropertySet, resetFocusInPropertySet, resetPropertySet} from '../lib/propertySet';

export const ImageUploaderInputResetButton = (): ReactElement | null => {
    const {contentId, mode, value, crop, focus, dimensions, setCrop, setFocus, reset} = useImageUploaderContext();
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

        new ContentRequiresSaveEvent(contentId).fire();
    }, [contentId, value, reset]);

    const handleCropReset = useCallback(() => {
        if (resetCropInPropertySet(value)) {
            setCrop(null);
        }
    }, [value, setCrop]);

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
        return (
            <InlineButton onClick={handleCropReset} disabled={!crop}>
                {resetLabel}
            </InlineButton>
        );
    }

    if (mode === 'focus') {
        return (
            <InlineButton onClick={handleFocusReset} disabled={!focus}>
                {resetLabel}
            </InlineButton>
        );
    }

    if (!isDirty) return null;

    return <InlineButton onClick={handleReset}>{resetLabel}</InlineButton>;
};

ImageUploaderInputResetButton.displayName = 'ImageUploaderInputResetButton';
