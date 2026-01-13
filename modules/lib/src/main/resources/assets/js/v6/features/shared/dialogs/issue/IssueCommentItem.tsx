import {Avatar, IconButton, cn} from '@enonic/ui';
import {MoreVertical} from 'lucide-react';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {getInitials} from '../../../utils/format/initials';

export type IssueCommentItemProps = {
    name: string;
    timeLabel?: string;
    label?: string;
    text: string;
    textClassName?: string;
    showMeta?: boolean;
};

const ISSUE_COMMENT_ITEM_NAME = 'IssueCommentItem';

export const IssueCommentItem = ({
    name,
    timeLabel,
    label,
    text,
    textClassName,
    showMeta = true,
}: IssueCommentItemProps): ReactElement => {
    const moreLabel = useI18n('tooltip.moreActions');
    const initials = getInitials(name);

    return (
        <div
            data-component={ISSUE_COMMENT_ITEM_NAME}
            className='grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 items-center py-2.5'>
            <Avatar size='md' className='row-span-2 self-start mt-2.25'>
                <Avatar.Fallback>{initials}</Avatar.Fallback>
            </Avatar>
            <div className='flex flex-col gap-1.5 min-w-0 leading-5.5'>
                {showMeta && (
                    <div className='flex min-w-0 flex-wrap items-baseline gap-2'>
                        <span className='truncate text-md font-semibold'>{name}</span>
                        {timeLabel && <span className='text-xs text-subtle'>{timeLabel}</span>}
                    </div>
                )}
                {label && <div className='text-md font-semibold'>{label}</div>}
                <div className={cn('whitespace-pre-wrap text-md', textClassName)}>{text}</div>
            </div>
            <IconButton
                icon={MoreVertical}
                variant='text'
                size='sm'
                iconSize={20}
                iconStrokeWidth={2}
                aria-label={moreLabel}
                className='row-span-2 justify-self-end self-start'
            />
        </div>
    );
};

IssueCommentItem.displayName = ISSUE_COMMENT_ITEM_NAME;
