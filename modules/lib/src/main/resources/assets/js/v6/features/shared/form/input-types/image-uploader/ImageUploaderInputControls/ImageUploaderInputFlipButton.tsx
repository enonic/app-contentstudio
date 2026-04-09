import {type ReactElement, useCallback} from 'react';
import {IconButton, Tooltip} from '@enonic/ui';
import {FlipHorizontal} from 'lucide-react';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {useI18n} from '../../../../../hooks/useI18n';
import {setFlipInPropertySet} from '../lib/propertySet';

export const ImageUploaderInputFlipButton = (): ReactElement => {
    const {value, enabled, mode, setOrientation} = useImageUploaderContext();

    const label = useI18n('action.mirror');

    const handleFlip = useCallback(() => {
        if (!value || value.isNull()) return;

        setOrientation(setFlipInPropertySet(value));
    }, [value]);

    return (
        <Tooltip value={label} delay={300}>
            <IconButton onClick={handleFlip} disabled={!enabled || mode !== 'ready'} icon={FlipHorizontal} />
        </Tooltip>
    );
};

ImageUploaderInputFlipButton.displayName = 'ImageUploaderInputFlipButton';
