import {TargetedMouseEvent} from 'preact';
import {ReactNode} from 'react';
import {
    $contentTreeSelectionMode, addSelectedItem,
    hasSelectedItems,
    isItemSelected,
    removeSelectedItem, setMultipleSelectionMode, setSelection,
    setSingleSelectionMode
} from '../../../store/contentTreeSelectionStore';
import {ContentData} from './ContentData';

export type ContentTreeListRowWrapperProps = {
    children?: ReactNode;
    item: ContentData;
}

// Intercepts checkbox clicks to manage selection mode highlight-> multiple and vice versa
export const ContentTreeListRowWrapper = ({item, children}: ContentTreeListRowWrapperProps): React.ReactElement => {
    const onClick = (e: TargetedMouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const isCheckboxClick = target.closest(`.${'content-tree-row-checkbox'}`) !== null;

        if (isCheckboxClick) {
            e.stopPropagation();
            e.preventDefault();

            const selectionMode = $contentTreeSelectionMode.get();

            if (selectionMode === 'multiple') {
                if (isItemSelected(item.id)) {
                    removeSelectedItem(item.id);

                    if (!hasSelectedItems()) {
                        setSingleSelectionMode();
                    }
                } else {
                    addSelectedItem(item.id);
                }
            } else {
                setMultipleSelectionMode();
                setSelection([item.id]);
            }
        }
    }

    return <div onClickCapture={onClick}>
        {children}
    </div>
}
