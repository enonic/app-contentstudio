import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {Avatar, IconButton, cn} from '@enonic/ui';
import {MoreVertical} from 'lucide-react';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {getInitials} from '../../../utils/format/initials';

import type {Issue} from '../../../../../app/issue/Issue';
import type {IssueComment} from '../../../../../app/issue/IssueComment';

export type IssueCommentsListProps = {
    issue?: Issue;
    comments: IssueComment[];
    loading?: boolean;
    className?: string;
};

type IssueCommentItemProps = {
    name: string;
    timeLabel?: string;
    label?: string;
    text: string;
    textClassName?: string;
    showMeta?: boolean;
};

const ISSUE_COMMENTS_LIST_NAME = 'IssueCommentsList';

function IssueCommentItem({
    name,
    timeLabel,
    label,
    text,
    textClassName,
    showMeta = true,
}: IssueCommentItemProps): ReactElement {
    const moreLabel = useI18n('tooltip.moreActions');
    const initials = getInitials(name);

    return (
        <div className='grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 items-center'>
            <Avatar size='md' className='row-span-2'>
                <Avatar.Fallback className='bg-[#942B19] text-alt font-semibold'>{initials}</Avatar.Fallback>
            </Avatar>
            <div className='min-w-0'>
                {showMeta && (
                    <div className='flex min-w-0 flex-wrap items-baseline gap-2'>
                        <span className='truncate text-md font-semibold'>{name}</span>
                        {timeLabel && <span className='text-xs text-subtle'>{timeLabel}</span>}
                    </div>
                )}
                {label && <div className='text-md font-semibold text-subtle'>{label}</div>}
                <div className={cn('whitespace-pre-wrap text-md', textClassName)}>{text}</div>
            </div>
            <IconButton
                icon={MoreVertical}
                variant='text'
                size='sm'
                aria-label={moreLabel}
                className='row-span-2 justify-self-end self-start m-1.5'
            />
        </div>
    );
}

export const IssueCommentsList = ({
    issue,
    comments,
    loading,
    className,
}: IssueCommentsListProps): ReactElement => {
    const descriptionLabel = useI18n('field.description');
    const noCommentsText = useI18n('field.issue.noComments');
    const description = issue?.getDescription() ?? '';
    const normalizedDescription = description.trim();
    const descriptionIndex = normalizedDescription.length > 0
        ? comments.findIndex((comment) => comment.getText().trim() === normalizedDescription)
        : -1;

    return (
        <div
            data-component={ISSUE_COMMENTS_LIST_NAME}
            className={cn('flex min-h-0 max-h-80 flex-col gap-7.5 overflow-y-auto', className)}
        >
            {comments.length === 0 && !loading && normalizedDescription.length === 0 && (
                <div className='text-sm text-subtle'>{noCommentsText}</div>
            )}
            {comments.map((comment, index) => {
                const text = comment.getText();
                const isDescription = index === descriptionIndex;

                return (
                    <IssueCommentItem
                        key={comment.getId()}
                        name={comment.getCreatorDisplayName()}
                        timeLabel={comment.getCreatedTime() ? DateHelper.getModifiedString(comment.getCreatedTime()) : undefined}
                        text={text}
                        label={isDescription ? descriptionLabel : undefined}
                        showMeta={!isDescription}
                    />
                );
            })}
        </div>
    );
};

IssueCommentsList.displayName = ISSUE_COMMENTS_LIST_NAME;
