import {ListItem} from '@enonic/ui';
import {ContentLabel} from '../../../shared/content/ContentLabel';
import {StatusBadge} from '../../../shared/status/StatusBadge';
import {ContentData} from './ContentData';

export type ContentTreeListItemProps = {
    content: ContentData;
};

export const ContentTreeListItem = ({content}: ContentTreeListItemProps): React.ReactElement => (
    <ListItem className='p-0'>
        <ListItem.Left className="flex-1">
            <ContentLabel content={content.item} />
        </ListItem.Left>
        <ListItem.Right>
            <StatusBadge status={content.publishStatus} />
        </ListItem.Right>
    </ListItem>
);
