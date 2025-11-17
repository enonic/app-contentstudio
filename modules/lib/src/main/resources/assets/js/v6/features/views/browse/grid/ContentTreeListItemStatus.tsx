import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {cn} from '@enonic/ui';
import {CS6ContentStatus} from '../../../../../app/content/ContentStatus';


function getClassForStatus(status: CS6ContentStatus): string {
    return ({
        'offline': 'text-subtle',
        'scheduled': 'italic text-subtle',
        'expired': 'text-warning',
        'online': 'text-success',
    } satisfies Record<CS6ContentStatus, string>)[status]
}

type Props = {
    status: CS6ContentStatus;
    className?: string;
}

export const ContentTreeListItemStatus = ({status, className}: Props) => {
    const label = i18n(`status.${status}`)

    return <span
        className={cn(
        'text-sm capitalize text-main group-data-[tone=inverse]:text-alt',
        getClassForStatus(status),
        className,
    )}>{label}</span>;
};
