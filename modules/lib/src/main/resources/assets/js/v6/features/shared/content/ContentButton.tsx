import {Button, type ButtonProps, cn} from '@enonic/ui';
import type {ReactElement} from 'react';
import type {ContentSummary} from '../../../../app/content/ContentSummary';
import {EditContentEvent} from '../../../../app/event/EditContentEvent';
import {ContentLabel, type ContentLabelVariant} from './ContentLabel';

const CONTENT_BUTTON_NAME = 'ContentButton';

export type ContentButtonProps = {
    content: ContentSummary;
    labelVariant?: ContentLabelVariant;
} & Omit<ButtonProps, 'onClick' | 'children'>;

export const ContentButton = ({
    content,
    labelVariant,
    className,
    ...rest
}: ContentButtonProps): ReactElement => {
    const handleClick = () => {
        new EditContentEvent([content]).fire();
    };

    return (
        <Button
            data-component={CONTENT_BUTTON_NAME}
            className={cn('box-content justify-start flex-1 h-6 p-1 -ml-1', labelVariant && 'h-8', className)}
            onClick={handleClick}
            {...rest}
        >
            <ContentLabel content={content} variant={labelVariant ?? 'compact'} />
        </Button>
    );
};

ContentButton.displayName = CONTENT_BUTTON_NAME;
