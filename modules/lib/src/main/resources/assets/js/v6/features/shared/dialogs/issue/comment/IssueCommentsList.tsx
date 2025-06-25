import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {cn} from '@enonic/ui';
import {type ReactElement, useMemo} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {IssueCommentItem} from './IssueCommentItem';
import {IssueDescriptionItem} from './IssueDescriptionItem';

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
    issue,
    comments,
    loading,
    onUpdateComment,
    onDeleteComment,
    portalContainer,
    className,
    'aria-label': ariaLabel,
}: IssueCommentsListProps): ReactElement => {
    const noCommentsText = useI18n('field.issue.noComments');
    const creatorName = issue?.getCreator() ?? '';
    const description = issue?.getDescription()?.trim() ?? '';
    const hasDescription = description.length > 0;

    // Filter out the description comment from regular comments
    const regularComments = useMemo(() => {
        if (description.length === 0) {
            return comments;
        }
        return comments.filter((comment) => comment.getText().trim() !== description);
    }, [comments, description]);

    const hasNoContent = regularComments.length === 0 && !loading && !hasDescription;

    return (
        <div
            data-component={ISSUE_COMMENTS_LIST_NAME}
            aria-label={ariaLabel}
            className={cn('flex min-h-0 max-h-80 flex-col gap-2.5 overflow-y-auto px-2 -mx-2', className)}
        >
            {hasNoContent && (
                <div className='text-sm text-subtle'>{noCommentsText}</div>
            )}
            {hasDescription && (
                <IssueDescriptionItem name={creatorName} text={description} />
            )}
            {regularComments.map((comment) => (
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
