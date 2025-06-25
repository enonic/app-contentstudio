import {GridList, IconButton} from '@enonic/ui';
import {X} from 'lucide-react';
import type {ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {useContentRow} from './ContentRowContext';
import type {ContentRowRemoveButtonProps} from './types';

const CONTENT_ROW_REMOVE_BUTTON_NAME = 'ContentRowRemoveButton';

export const ContentRowRemoveButton = ({
    onRemove,
    disabled,
    title,
    className,
}: ContentRowRemoveButtonProps): ReactElement => {
    const {disabled: contextDisabled} = useContentRow();
    const isDisabled = disabled ?? contextDisabled;
    const removeLabel = useI18n('action.removeFromList');

    return (
        <GridList.Cell data-component={CONTENT_ROW_REMOVE_BUTTON_NAME} className={className ?? 'shrink-0 ml-auto'}>
            <GridList.Action>
                <IconButton
                    className='size-8'
                    icon={X}
                    variant='text'
                    size='sm'
                    iconSize='lg'
                    title={title ?? removeLabel}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    disabled={isDisabled}
                />
            </GridList.Action>
        </GridList.Cell>
    );
};

ContentRowRemoveButton.displayName = CONTENT_ROW_REMOVE_BUTTON_NAME;
