import {cn} from '@enonic/ui';

export type StatusBarEntryProps = {
    className?: string;
    children: React.ReactNode;
    'data-component'?: string;
};

const STATUS_BAR_ENTRY_NAME = 'StatusBarEntry';

export const StatusBarEntry = ({
    className,
    children,
    'data-component': dataComponent = STATUS_BAR_ENTRY_NAME,
}: StatusBarEntryProps): React.ReactElement => {
    return (
        <div data-component={dataComponent} className={cn('grid grid-flow-col auto-cols-max grid-cols-[max-content_1fr] items-center gap-2 min-h-19 p-5 rounded-lg', className)}>
            {children}
        </div>
    );
};

StatusBarEntry.displayName = STATUS_BAR_ENTRY_NAME;
