import {TreeList} from '@enonic/ui';
import {ContentData} from './ContentData';

export type ContentTreeListLoadingRowProps = {
    item: ContentData;
}

export const ContentTreeListLoadingRow = ({item}: ContentTreeListLoadingRowProps): React.ReactElement => {
    return (
        <TreeList.Row<ContentData> key={item.id} item={item}>
            <TreeList.RowLeft>
                <TreeList.RowSelectionControl data={item} />
                <TreeList.RowLevelSpacer level={item.path.length} />
            </TreeList.RowLeft>
            <TreeList.RowContent>
                <TreeList.LoadingRow key={item.id} item={item} />
            </TreeList.RowContent>
        </TreeList.Row>
    )
}
