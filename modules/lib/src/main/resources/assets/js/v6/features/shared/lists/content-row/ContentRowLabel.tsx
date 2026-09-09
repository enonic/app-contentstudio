import { cn, GridList } from '@enonic/ui';
import type { ReactElement } from 'react';
import { ContentLabel } from '../../../../entities/content/ui/content/ContentLabel';
import { ContentButton } from '../../../../entities/content/ui/content/ContentButton';
import { useContentRow } from './ContentRowContext';
import type { ContentRowLabelProps } from './types';

const CONTENT_ROW_LABEL_NAME = 'ContentRowLabel';

export const ContentRowLabel = ({
    action = 'none',
    variant = 'compact',
    className,
}: ContentRowLabelProps): ReactElement => {
    const { content, disabled, statusBelowLabelBelowSm, mainItemButtonLayoutBelowSm } = useContentRow();
    const labelVariant = variant === 'default' ? 'normal' : variant;

    return (
        <GridList.Cell
            data-component={CONTENT_ROW_LABEL_NAME}
            className={cn(
                className ?? 'flex-1 min-w-0',
                statusBelowLabelBelowSm && 'max-sm:col-start-2 max-sm:row-start-1',
                mainItemButtonLayoutBelowSm && 'max-sm:col-start-1 max-sm:row-start-1 max-sm:self-stretch',
            )}
        >
            {action === 'edit' ? (
                <GridList.Action>
                    <ContentButton content={content} disabled={disabled} labelVariant={labelVariant} />
                </GridList.Action>
            ) : (
                <ContentLabel content={content} variant={labelVariant} />
            )}
        </GridList.Cell>
    );
};

ContentRowLabel.displayName = CONTENT_ROW_LABEL_NAME;
