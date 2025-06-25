import {Button, type ButtonProps, cn} from '@enonic/ui';
import type {ReactElement} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../../app/event/EditContentEvent';
import {ContentLabel} from './ContentLabel';

const CONTENT_BUTTON_NAME = 'ContentButton';

export type ContentButtonProps = {
    content: ContentSummaryAndCompareStatus;
} & Omit<ButtonProps, 'onClick' | 'children'>;

export const ContentButton = ({
    content,
    className,
    ...rest
}: ContentButtonProps): ReactElement => {
    const handleClick = () => {
        new EditContentEvent([content]).fire();
    };

    return (
        <Button
            data-component={CONTENT_BUTTON_NAME}
            className={cn('box-content justify-start flex-1 h-6 p-1 -ml-1', className)}
            onClick={handleClick}
            {...rest}
        >
            <ContentLabel content={content} variant="compact" />
        </Button>
    );
};

ContentButton.displayName = CONTENT_BUTTON_NAME;
