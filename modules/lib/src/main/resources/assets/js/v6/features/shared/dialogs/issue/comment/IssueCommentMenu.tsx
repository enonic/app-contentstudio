import {IconButton, Menu} from '@enonic/ui';
import {MoreVertical} from 'lucide-react';
import {type ReactElement} from 'react';

export type IssueCommentMenuProps = {
    onEdit?: () => void;
    onDelete?: () => void;
    moreLabel: string;
    editLabel: string;
    deleteLabel: string;
    portalContainer?: HTMLElement | null;
    className?: string;
};

const ISSUE_COMMENT_MENU_NAME = 'IssueCommentMenu';

export const IssueCommentMenu = ({
    onEdit,
    onDelete,
    moreLabel,
    editLabel,
    deleteLabel,
    portalContainer,
    className,
}: IssueCommentMenuProps): ReactElement | null => {
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
                        <Menu.Item onSelect={onEdit}>{editLabel}</Menu.Item>
                    )}
                    {onDelete && (
                        <Menu.Item
                            onSelect={onDelete}
                            className='text-error data-[active=true]:not-dark:text-error-rev'
                        >
                            {deleteLabel}
                        </Menu.Item>
                    )}
                </Menu.Content>
            </Menu.Portal>
        </Menu>
    );
};

IssueCommentMenu.displayName = ISSUE_COMMENT_MENU_NAME;
