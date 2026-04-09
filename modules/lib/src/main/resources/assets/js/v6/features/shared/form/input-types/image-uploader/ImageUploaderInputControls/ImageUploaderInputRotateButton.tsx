import {type ReactElement, useCallback} from 'react';
import {IconButton, Tooltip} from '@enonic/ui';
import {RotateCw} from 'lucide-react';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {useI18n} from '../../../../../hooks/useI18n';
import {setRotationInPropertySet} from '../lib/propertySet';

export const ImageUploaderInputRotateButton = (): ReactElement => {
    const {value, enabled, mode, setOrientation} = useImageUploaderContext();

    const label = useI18n('action.rotate');

    const handleRotate = useCallback(() => {
        if (!value || value.isNull()) return;

        setOrientation(setRotationInPropertySet(value));
    }, [value]);

    return (
        <Tooltip value={label} delay={300}>
            <IconButton onClick={handleRotate} disabled={!enabled || mode !== 'ready'} icon={RotateCw} />
        </Tooltip>
    );
};

ImageUploaderInputRotateButton.displayName = 'ImageUploaderInputRotateButton';
