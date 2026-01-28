import {IconButton, Menu} from '@enonic/ui';
import {MoreVertical} from 'lucide-react';
import {type ReactElement} from 'react';
import {IssueCommentActionsMenuItem} from './IssueCommentActionsMenuItem';

export type IssueCommentActionsMenuProps = {
    onEdit?: () => void;
    onDelete?: () => void;
    moreLabel: string;
    editLabel: string;
    deleteLabel: string;
    portalContainer?: HTMLElement | null;
    className?: string;
};

const ISSUE_COMMENT_ACTIONS_MENU_NAME = 'IssueCommentActionsMenu';

export const IssueCommentActionsMenu = ({
    onEdit,
    onDelete,
    moreLabel,
    editLabel,
    deleteLabel,
    portalContainer,
    className,
}: IssueCommentActionsMenuProps): ReactElement | null => {
    const hasActions = onEdit || onDelete;

    if (!hasActions) {
        return null;
    }

    return (
        <Menu>
            <Menu.Trigger asChild>
                <IconButton
                    icon={MoreVertical}
                    variant='text'
                    size='sm'
                    iconSize={20}
                    iconStrokeWidth={2}
                    aria-label={moreLabel}
                    className={className}
                />
            </Menu.Trigger>
            <Menu.Portal container={portalContainer ?? undefined}>
                <Menu.Content className='min-w-36'>
                    {onEdit && (
                        <IssueCommentActionsMenuItem onSelect={onEdit} label={editLabel} />
                    )}
                    {onDelete && (
                        <IssueCommentActionsMenuItem
                            onSelect={onDelete}
                            label={deleteLabel}
                            className='text-error data-[active=true]:not-dark:text-error-rev'
                        />
                    )}
                </Menu.Content>
            </Menu.Portal>
        </Menu>
    );
};

IssueCommentActionsMenu.displayName = ISSUE_COMMENT_ACTIONS_MENU_NAME;
