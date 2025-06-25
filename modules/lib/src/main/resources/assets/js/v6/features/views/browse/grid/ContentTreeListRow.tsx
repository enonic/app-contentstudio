import {Checkbox, cn, TreeList, useTreeList} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import type {ComponentPropsWithoutRef} from 'react';
import {EditContentEvent} from '../../../../../app/event/EditContentEvent';
import {$contentTreeSelectionMode, isItemSelected} from '../../../store/contentTreeSelectionStore';
import {ContentData} from './ContentData';
import {ContentTreeListItem} from './ContentTreeListItem';
import {ContentTreeListRowWrapper} from './ContentTreeListRowWrapper';

export type ContentTreeListRowProps = {
    item: ContentData;
}

type ContentTreeListRowSelectionControlProps = {
    data: ContentData;
    className?: string;
} & ComponentPropsWithoutRef<'div'>;

const ContentTreeListRowSelectionControl = ({ data, className }: ContentTreeListRowSelectionControlProps): React.ReactElement => {
    const { isItemSelectable } = useTreeList();
    const selectionMode = useStore($contentTreeSelectionMode);
    const isSelected = isItemSelected(data.id);

    if (!isItemSelectable(data)) {
        return <span className={cn('w-3.5', className)}></span>;
    }

    return <Checkbox
        className='content-tree-row-checkbox relative z-0 after:absolute after:-inset-2 after:content-[""] after:rounded-sm after:pointer-events-auto after:-z-10'
        tabindex={-1} key={data.id} id={'content-tree-' + data.id} checked={selectionMode === 'multiple' && isSelected}/>
};

export const ContentTreeListRow = ({item}: ContentTreeListRowProps): React.ReactElement => {
    return (
        <ContentTreeListRowWrapper item={item}>
            <TreeList.Row<ContentData> key={item.id} item={item}>
                <TreeList.RowLeft>
                    <ContentTreeListRowSelectionControl data={item} />
                    <TreeList.RowLevelSpacer level={item.path.length} />
                    <TreeList.RowExpandControl data={item} />
                </TreeList.RowLeft>
                <TreeList.RowContent onDblClick={() => new EditContentEvent([item.item]).fire()}>
                    <ContentTreeListItem content={item} key={item.id}/>
                </TreeList.RowContent>
            </TreeList.Row>
        </ContentTreeListRowWrapper>
    )
}
