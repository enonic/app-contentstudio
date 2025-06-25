import {cn} from '@enonic/ui';
import {PublishStatus} from '../../../../app/publish/PublishStatus';
import {useI18n} from '../../hooks/useI18n';
import {createPublishStatusKey} from '../../utils/cms/content/status';

type Props = {
    status: PublishStatus;
    className?: string;
}

const STATUS_BADGE_NAME = 'StatusBadge';

export const StatusBadge = ({status, className}: Props) => {
    const label = useI18n(createPublishStatusKey(status));
    const isOnline = status === PublishStatus.ONLINE;

    return (
        <span data-component={STATUS_BADGE_NAME} className={cn('text-sm capitalize group-data-[tone=inverse]:text-alt', isOnline && 'text-success', className)}>
            {label}
        </span>
    );
};

StatusBadge.displayName = STATUS_BADGE_NAME;
