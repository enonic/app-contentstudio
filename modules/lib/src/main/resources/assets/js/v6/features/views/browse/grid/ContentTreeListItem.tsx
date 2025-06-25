import {ListItem} from '@enonic/ui';
import {useMemo} from 'react';
import {WorkflowContentIcon} from '../../../shared/icons/WorkflowContentIcon';
import {StatusBadge} from '../../../shared/status/StatusBadge';
import {ContentData} from './ContentData';

export type ContentTreeListItemProps = {
    content: ContentData;
}

export const ContentTreeListItem = ({
    content,
}: ContentTreeListItemProps): React.ReactElement => {


    const Icon = useMemo(
        () => <WorkflowContentIcon status={content.workflowStatus} contentType={content.contentType.toString()} url={content.iconUrl} />,
        [content]
    );

    return (
        <ListItem className={'p-0'}>
            <ListItem.DefaultContent label={content.displayName} icon={Icon} description={content.name} />
            <ListItem.Right>
                <StatusBadge status={content.publishStatus} />
            </ListItem.Right>
        </ListItem>
    );
};
