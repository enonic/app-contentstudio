import {Button, ButtonProps, cn} from '@enonic/ui';

export type StatusBarEntryButtonProps = Pick<ButtonProps, 'className' | 'onClick' | 'children'>;

const STATUS_BAR_ENTRY_BUTTON_NAME = 'StatusBarEntryButton';

export const StatusBarEntryButton = ({className, children, ...props}: StatusBarEntryButtonProps): React.ReactElement => {
    return <Button
        data-component={STATUS_BAR_ENTRY_BUTTON_NAME}
        className={cn('bg-transparent hover:bg-btn-primary-hover/50', className)}
        variant='outline'
        size='sm'
        {...props}
    >
        {children}
    </Button>
}

StatusBarEntryButton.displayName = STATUS_BAR_ENTRY_BUTTON_NAME;
