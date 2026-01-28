import {Menu} from '@enonic/ui';
import {type ReactElement} from 'react';

export type IssueCommentActionsMenuItemProps = {
    label: string;
    onSelect: () => void;
    className?: string;
};

const ISSUE_COMMENT_ACTIONS_MENU_ITEM_NAME = 'IssueCommentActionsMenuItem';

export const IssueCommentActionsMenuItem = ({
    label,
    onSelect,
    className,
}: IssueCommentActionsMenuItemProps): ReactElement => {
    return (
        <Menu.Item className={className} onSelect={onSelect}>
            {label}
        </Menu.Item>
    );
};

IssueCommentActionsMenuItem.displayName = ISSUE_COMMENT_ACTIONS_MENU_ITEM_NAME;
