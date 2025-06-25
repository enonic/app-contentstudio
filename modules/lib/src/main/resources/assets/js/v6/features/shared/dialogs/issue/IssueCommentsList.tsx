import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {cn} from '@enonic/ui';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {IssueCommentItem} from './IssueCommentItem';

import type {Issue} from '../../../../../app/issue/Issue';
import type {IssueComment} from '../../../../../app/issue/IssueComment';

export type IssueCommentsListProps = {
    issue?: Issue;
    comments: IssueComment[];
    loading?: boolean;
    className?: string;
};

const ISSUE_COMMENTS_LIST_NAME = 'IssueCommentsList';

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
            className={cn('flex min-h-0 max-h-80 flex-col gap-2.5 overflow-y-auto', className)}
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
