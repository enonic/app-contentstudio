import { Listbox, ListItem } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { $config } from '../../../../shared/config/config.store';
import { generateIssueStatusInfo } from '../../../../shared/lib/cms/issue/generateIssueStatusInfo';
import { IssueStatusBadge } from '../../../shared/status/IssueStatusBadge';
import { IssueIcon } from '../../../../entities/issue/ui/IssueIcon';

import type { IssueWithAssignees } from '../../../../../app/issue/IssueWithAssignees';

export type IssueListItemProps = {
    issue: IssueWithAssignees;
};

const ISSUE_LIST_ITEM_NAME = 'IssueListItem';

export const IssueListItem = ({ issue }: IssueListItemProps): ReactElement => {
    const { user } = useStore($config, { keys: ['user'] });
    const issueData = issue.getIssue();
    // Intentional: useI18n doesn't use React hooks internally; passing it as a translate function.
    // Replace with useI18n() from @enonic/lib-admin-ui when I18nProvider is wired up.
    const subtitle = generateIssueStatusInfo(issueData, useI18n, user);
    return (
        <Listbox.Item value={issueData.getId()} data-component={ISSUE_LIST_ITEM_NAME} className="p-0 rounded-sm">
            <ListItem role="presentation" className="w-full">
                <ListItem.Left className="text-subtle group-data-[tone=inverse]:text-alt">
                    <IssueIcon issue={issueData} />
                </ListItem.Left>
                <ListItem.Content className="min-w-0">
                    <div className="min-w-0">
                        <div className="truncate font-semibold">{issueData.getTitleWithId()}</div>
                        <div className="truncate text-sm text-subtle group-data-[tone=inverse]:text-alt">
                            {subtitle}
                        </div>
                    </div>
                </ListItem.Content>
                <ListItem.Right>
                    <IssueStatusBadge className="px-4.5" status={issueData.getIssueStatus()} />
                </ListItem.Right>
            </ListItem>
        </Listbox.Item>
    );
};

IssueListItem.displayName = ISSUE_LIST_ITEM_NAME;
