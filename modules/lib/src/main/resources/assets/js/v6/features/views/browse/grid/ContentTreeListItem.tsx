import {ListItem} from '@enonic/ui';
import {StatusBadge} from '../../../shared/status/StatusBadge';
import {ContentData} from './ContentData';
import {ContentLabel} from '../../../shared/content/ContentLabel';

export type ContentTreeListItemProps = {
    content: ContentData;
};

export const ContentTreeListItem = ({content}: ContentTreeListItemProps): React.ReactElement => (
    <ListItem className={'p-0'}>
        <ListItem.Left className="flex-1">
            <ContentLabel content={content.item} />
        </ListItem.Left>
        <ListItem.Right>
            <StatusBadge status={content.publishStatus} />
        </ListItem.Right>
    </ListItem>
);
