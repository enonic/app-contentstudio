import { cn, GridList, IconButton } from '@enonic/ui';
import { X } from 'lucide-react';
import type { ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { useContentRow } from './ContentRowContext';
import type { ContentRowRemoveButtonProps } from './types';

const CONTENT_ROW_REMOVE_BUTTON_NAME = 'ContentRowRemoveButton';

export const ContentRowRemoveButton = ({
    onRemove,
    disabled,
    title,
    className,
}: ContentRowRemoveButtonProps): ReactElement => {
    const { disabled: contextDisabled, mainItemButtonLayoutBelowSm } = useContentRow();
    const isDisabled = disabled ?? contextDisabled;
    const removeLabel = useI18n('action.removeFromList');

    return (
        <GridList.Cell
            data-component={CONTENT_ROW_REMOVE_BUTTON_NAME}
            className={cn(
                className ?? 'shrink-0 ml-auto',
                mainItemButtonLayoutBelowSm && 'max-sm:col-start-2 max-sm:row-start-1 max-sm:self-start',
            )}
        >
            <GridList.Action>
                <IconButton
                    className={cn('size-8', mainItemButtonLayoutBelowSm && 'max-sm:size-6')}
                    icon={X}
                    variant="text"
                    size="sm"
                    iconSize="lg"
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
