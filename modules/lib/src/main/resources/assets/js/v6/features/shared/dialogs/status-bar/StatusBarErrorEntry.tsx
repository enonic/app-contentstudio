import {cn} from '@enonic/ui';
import {StatusIcon} from '../../icons/StatusIcon';
import {StatusBarEntry} from './StatusBarEntry';

export type StatusBarErrorEntryProps = {
    className?: string;
    status: 'in-progress' | 'invalid';
    label: string;
    disabled?: boolean;
    children: React.ReactNode;
};

const STATUS_BAR_ERROR_ENTRY_NAME = 'StatusBarErrorEntry';

export const StatusBarErrorEntry = ({className, status, label, disabled, children}: StatusBarErrorEntryProps): React.ReactElement => {
    return (
        <StatusBarEntry data-component={STATUS_BAR_ERROR_ENTRY_NAME} className={cn(status === 'in-progress' ? 'bg-surface-warn' : 'bg-surface-error', className)}>
            <StatusIcon className="w-6 h-6" status={status} />
            <span className="text-sm font-semibold">{label}</span>
            {disabled || children}
        </StatusBarEntry>
    );
}

StatusBarErrorEntry.displayName = STATUS_BAR_ERROR_ENTRY_NAME;
