import {ListItem, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {$config} from '../../../store/config.store';
import {generateIssueStatusInfo} from '../../../utils/cms/issue/generateIssueStatusInfo';
import {IssueStatusBadge} from '../../status/IssueStatusBadge';
import {IssueIcon} from './IssueIcon';

import type {IssueWithAssignees} from '../../../../../app/issue/IssueWithAssignees';

export type IssueListItemProps = {
    issue: IssueWithAssignees;
    onSelect?: (issue: IssueWithAssignees) => void;
};

const ISSUE_LIST_ITEM_NAME = 'IssueListItem';

export const IssueListItem = ({issue, onSelect}: IssueListItemProps): ReactElement => {
    const {user} = useStore($config, {keys: ['user']});
    const issueData = issue.getIssue();
    // Intentional: useI18n doesn't use React hooks internally; passing it as a translate function.
    // Replace with useI18n() from @enonic/lib-admin-ui when I18nProvider is wired up.
    const subtitle = generateIssueStatusInfo(issueData, useI18n, user);
    const handleSelect = () => {
        onSelect?.(issue);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSelect();
        }
    };

    return (
        <ListItem
            role='button'
            tabIndex={0}
            onClick={handleSelect}
            onKeyDown={handleKeyDown}
            data-component={ISSUE_LIST_ITEM_NAME}
            className={cn(
                'cursor-pointer rounded-sm',
                'hover:bg-surface-neutral-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
                'focus-visible:ring-offset-3 focus-visible:ring-offset-ring-offset',
            )}
        >
            <ListItem.Left className='text-subtle group-data-[tone=inverse]:text-alt'>
                <IssueIcon issue={issueData} />
            </ListItem.Left>
            <ListItem.Content className='min-w-0'>
                <div className='min-w-0'>
                    <div className='truncate font-semibold'>{issueData.getTitleWithId()}</div>
                    <div className='truncate text-sm text-subtle group-data-[tone=inverse]:text-alt'>
                        {subtitle}
                    </div>
                </div>
            </ListItem.Content>
            <ListItem.Right>
                <IssueStatusBadge className='px-4.5' status={issueData.getIssueStatus()} />
            </ListItem.Right>
        </ListItem>
    );
};

IssueListItem.displayName = ISSUE_LIST_ITEM_NAME;
