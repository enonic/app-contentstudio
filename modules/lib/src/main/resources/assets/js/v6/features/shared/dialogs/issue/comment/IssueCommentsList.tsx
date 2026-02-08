import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {cn} from '@enonic/ui';
import {type ReactElement} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {IssueCommentItem} from './IssueCommentItem';

import type {Issue} from '../../../../../../app/issue/Issue';
import type {IssueComment} from '../../../../../../app/issue/IssueComment';

export type IssueCommentsListProps = {
    issue?: Issue;
    comments: IssueComment[];
    loading?: boolean;
    onUpdateComment?: (commentId: string, text: string) => Promise<boolean> | boolean;
    onDeleteComment?: (commentId: string) => void;
    portalContainer?: HTMLElement | null;
    className?: string;
    'aria-label'?: string;
};

const ISSUE_COMMENTS_LIST_NAME = 'IssueCommentsList';

export const IssueCommentsList = ({
    issue: _issue,
    comments,
    loading,
    onUpdateComment,
    onDeleteComment,
    portalContainer,
    className,
    'aria-label': ariaLabel,
}: IssueCommentsListProps): ReactElement => {
    const noCommentsText = useI18n('field.issue.noComments');
    const hasNoContent = comments.length === 0 && !loading;

    return (
        <div
            data-component={ISSUE_COMMENTS_LIST_NAME}
            aria-label={ariaLabel}
            className={cn('flex min-h-0 max-h-80 flex-col gap-2.5 overflow-y-auto px-2 -mx-2', className)}
        >
            {hasNoContent && (
                <div className='text-sm text-subtle'>{noCommentsText}</div>
            )}
            {comments.map((comment) => (
                <IssueCommentItem
                    key={comment.getId()}
                    name={comment.getCreatorDisplayName()}
                    timeLabel={comment.getCreatedTime() ? DateHelper.getModifiedString(comment.getCreatedTime()) : undefined}
                    text={comment.getText()}
                    onUpdate={onUpdateComment ? (nextText) => onUpdateComment(comment.getId(), nextText) : undefined}
                    onDelete={onDeleteComment ? () => onDeleteComment(comment.getId()) : undefined}
                    portalContainer={portalContainer}
                />
            ))}
        </div>
    );
};

IssueCommentsList.displayName = ISSUE_COMMENTS_LIST_NAME;
