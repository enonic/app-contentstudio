import {type ReactElement, useCallback} from 'react';
import {Button} from '@enonic/ui';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {useI18n} from '../../../../../hooks/useI18n';
import {setCropInPropertySet, setFocusInPropertySet} from '../lib/propertySet';

export const ImageUploaderInputApplyButton = (): ReactElement => {
    const {value, focus, mode, setMode, crop, dimensions} = useImageUploaderContext();
    const applyLabel = useI18n('action.apply');

    const handleApply = useCallback(() => {
        if (mode === 'focus') {
            setMode('ready');
            setFocusInPropertySet(value, focus, dimensions);
        }

        if (mode === 'crop') {
            setMode('ready');
            setCropInPropertySet(value, crop, dimensions);
        }
    }, [value, mode, setMode, focus, crop, dimensions]);

    return (
        <Button variant="filled" onClick={handleApply}>
            {applyLabel}
        </Button>
    );
};

ImageUploaderInputApplyButton.displayName = 'ImageUploaderInputApplyButton';
