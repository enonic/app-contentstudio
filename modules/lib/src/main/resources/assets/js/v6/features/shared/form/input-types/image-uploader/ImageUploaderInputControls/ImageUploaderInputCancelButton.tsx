import {type ReactElement, useCallback} from 'react';
import {IconButton, Tooltip} from '@enonic/ui';
import {X} from 'lucide-react';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {useI18n} from '../../../../../hooks/useI18n';

export const ImageUploaderInputCancelButton = (): ReactElement => {
    const {value, mode, dimensions, setMode, setCrop, setFocus} = useImageUploaderContext();
    const label = useI18n('action.cancel');

    const handleCancel = useCallback(() => {
        const set = value.getPropertySet();

        if (mode === 'crop') {
            const x1 = set.getPropertyByPath('cropPosition.left')?.getDouble() ?? null;
            const y1 = set.getPropertyByPath('cropPosition.top')?.getDouble() ?? null;
            const x2 = set.getPropertyByPath('cropPosition.right')?.getDouble() ?? null;
            const y2 = set.getPropertyByPath('cropPosition.bottom')?.getDouble() ?? null;

            if (x1 === null || y1 === null || x2 === null || y2 === null) {
                setCrop(null);
            } else {
                setCrop({x1: x1 * dimensions.w, y1: y1 * dimensions.h, x2: x2 * dimensions.w, y2: y2 * dimensions.h});
            }
        }

        if (mode === 'focus') {
            const x = set.getPropertyByPath('focalPoint.x')?.getDouble() ?? null;
            const y = set.getPropertyByPath('focalPoint.y')?.getDouble() ?? null;

            if (x === null || y === null) {
                setFocus(null);
            } else {
                setFocus({x: x * dimensions.w, y: y * dimensions.h});
            }
        }

        setMode('ready');
    }, [value, mode, dimensions, setMode, setCrop, setFocus]);

    return (
        <Tooltip value={label} delay={300}>
            <IconButton icon={X} onClick={handleCancel} />
        </Tooltip>
    );
};

ImageUploaderInputCancelButton.displayName = 'ImageUploaderInputCancelButton';
