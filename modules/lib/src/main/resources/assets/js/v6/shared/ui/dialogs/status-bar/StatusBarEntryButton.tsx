import { Button, ButtonProps, cn } from '@enonic/ui';
import { forwardRef } from 'react';

export type StatusBarEntryButtonProps = Pick<ButtonProps, 'className' | 'onClick' | 'children'>;

const STATUS_BAR_ENTRY_BUTTON_NAME = 'StatusBarEntryButton';

export const StatusBarEntryButton = forwardRef<HTMLButtonElement, StatusBarEntryButtonProps>(
    ({ className, children, ...props }, ref): React.ReactElement => {
        return (
            <Button
                ref={ref}
                data-component={STATUS_BAR_ENTRY_BUTTON_NAME}
                className={cn('col-span-full md:col-auto', 'bg-transparent hover:bg-btn-primary-hover/50', className)}
                variant="outline"
                size="sm"
                {...props}
            >
                {children}
            </Button>
        );
    },
);

StatusBarEntryButton.displayName = STATUS_BAR_ENTRY_BUTTON_NAME;
