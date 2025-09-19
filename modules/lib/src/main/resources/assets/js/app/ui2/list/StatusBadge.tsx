import {cn} from '@enonic/ui';
import {CompareStatus, CompareStatusFormatter} from '../../content/CompareStatus';

type Props = {
    status: CompareStatus;
    className?: string;
}

export const StatusBadge = ({status, className}: Props) => {
    const label = CompareStatusFormatter.formatStatusText(status);

    return <span className={cn(
        'text-sm capitalize text-main',
        ({
            'new': '',
            'modified': 'italic text-subtle',
            'outofdate': 'text-fbk-error',
            'published': 'text-fbk-success',
            'moved': 'italic text-subtle',
            'archived': '',
            'unknown': '',
        } satisfies Record<CompareStatus, string>)[status],
        className,
    )}>{label}</span>;
};
