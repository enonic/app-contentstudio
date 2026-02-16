import {Button, ButtonProps, cn} from '@enonic/ui';
import {ReactElement} from 'react';

export type InlineButtonProps = Omit<ButtonProps, 'size'>;

const INLINE_BUTTON_NAME = 'InlineButton';

export const InlineButton = ({className, ...props}: InlineButtonProps): ReactElement => {
    return (
        <Button
            data-component={INLINE_BUTTON_NAME}
            {...props}
            size="sm"
            className={cn(`h-8 px-1.5 -my-0.75 focus-visible:ring-offset-0`, className)}
        />
    );
};

InlineButton.displayName = INLINE_BUTTON_NAME;
