import {Checkbox, cn, FlatTreeNode, TreeList, useTreeList} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import type {ComponentPropsWithoutRef} from 'react';
import {EditContentEvent} from '../../../../../app/event/EditContentEvent';
import {
    $contentTreeSelectionMode,
    getSelectedItems,
    isItemSelected,
    setActiveItem,
    setSelection,
    setSingleSelectionMode,
} from '../../../store/contentTreeSelectionStore';
import {ContentData} from './ContentData';
import {ContentTreeListItem} from './ContentTreeListItem';
import {ContentTreeListRowWrapper} from './ContentTreeListRowWrapper';

export type ContentTreeListRowProps = {
    item: FlatTreeNode<ContentData>;
};

type ContentTreeListRowSelectionControlProps = {
    data: ContentData;
    className?: string;
} & ComponentPropsWithoutRef<'div'>;

const ContentTreeListRowSelectionControl = ({
    data,
    className,
}: ContentTreeListRowSelectionControlProps): React.ReactElement => {
    const {isItemSelectable} = useTreeList();
    const selectionMode = useStore($contentTreeSelectionMode);
    const isSelected = isItemSelected(data.id);

    if (!isItemSelectable(data)) {
        return <span className={cn('w-3.5', className)}></span>;
    }

    return (
        <Checkbox
            className='content-tree-row-checkbox relative z-0 after:absolute after:-inset-2 after:content-[""] after:rounded-sm after:pointer-events-auto after:-z-10'
            tabindex={-1}
            key={data.id}
            id={'content-tree-' + data.id}
            checked={selectionMode === 'multiple' && isSelected}
        />
    );
};

export const ContentTreeListRow = ({item}: ContentTreeListRowProps): React.ReactElement => {
    function handleContextMenu(): void {
        const isItemSelected = getSelectedItems().find((content) => content.getId() === item.data.item.getId());

        if (isItemSelected) return;

        setSingleSelectionMode();
        setActiveItem(null);
        setSelection([item.data.id]);
    }

    return (
        <ContentTreeListRowWrapper item={item.data}>
            <TreeList.Row<ContentData> key={item.id} item={item} onContextMenu={handleContextMenu}>
                <TreeList.RowLeft>
                    <ContentTreeListRowSelectionControl data={item.data} />
                    <TreeList.RowLevelSpacer level={item.level} />
                    <TreeList.RowExpandControl data={item} />
                </TreeList.RowLeft>
                <TreeList.RowContent onDblClick={() => new EditContentEvent([item.data.item]).fire()}>
                    <ContentTreeListItem content={item.data} key={item.id} />
                </TreeList.RowContent>
            </TreeList.Row>
        </ContentTreeListRowWrapper>
    );
};
