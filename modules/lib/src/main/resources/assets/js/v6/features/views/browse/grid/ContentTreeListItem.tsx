import {ListItem} from '@enonic/ui';
import {ContentLabel} from '../../../shared/content/ContentLabel';
import {StatusBadge} from '../../../shared/status/StatusBadge';
import {type ContentData} from './ContentData';

export type ContentTreeListItemProps = {
    content: ContentData;
    showPath?: boolean;
};

export const ContentTreeListItem = ({content, showPath = false}: ContentTreeListItemProps): React.ReactElement => (
    <ListItem className='p-0'>
        <ListItem.Left className="flex-1">
            <ContentLabel content={content.item} variant={showPath ? 'detailed' : 'normal'} />
        </ListItem.Left>
        <ListItem.Right>
            <StatusBadge status={content.publishStatus} />
        </ListItem.Right>
    </ListItem>
);
