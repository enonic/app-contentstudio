import {ListItem} from '@enonic/ui';
import {useMemo} from 'react';
import {WorkflowContentIcon} from '../../../shared/icons/WorkflowContentIcon';
import {ContentData} from './ContentData';
import {ContentTreeListItemStatus} from './ContentTreeListItemStatus';

export type ContentTreeListItemProps = {
    content: ContentData;
}

export const ContentTreeListItem = ({
                                 content,
                             }: ContentTreeListItemProps): React.ReactElement => {


    const Icon = useMemo(
        () => <WorkflowContentIcon status={content.workflowStatus} contentType={content.contentType.toString()} url={content.iconUrl} />,
        []
    );

    return (
        <ListItem className={'p-0'}>
            <ListItem.DefaultContent label={content.displayName} icon={Icon} description={content.name} />
            <ListItem.Right>
                <ContentTreeListItemStatus status={content.contentStatus} />
            </ListItem.Right>
        </ListItem>
    );
};
