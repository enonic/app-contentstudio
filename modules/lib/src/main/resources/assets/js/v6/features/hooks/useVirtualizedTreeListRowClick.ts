import {useCallback} from 'react';
import {useVirtualizedTreeList} from '@enonic/ui';

type TreeRowClickEvent = {
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    currentTarget: HTMLElement;
};

type UseVirtualizedTreeListRowClickParams = {
    index: number;
    id: string;
    selectable: boolean;
    defaultOnClick?: (event: TreeRowClickEvent) => void;
};

type UseVirtualizedTreeListRowClickResult = {
    onClick: (event: TreeRowClickEvent) => void;
};

export const useVirtualizedTreeListRowClick = ({
    index,
    id,
    selectable,
    defaultOnClick,
}: UseVirtualizedTreeListRowClickParams): UseVirtualizedTreeListRowClickResult => {
    const {setActiveIndex, toggleSelection} = useVirtualizedTreeList();

    const onClick = useCallback((event: TreeRowClickEvent) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) {
            defaultOnClick?.(event);
            return;
        }

        setActiveIndex(index);
        if (selectable) {
            toggleSelection(id, index);
        }

        const tree = event.currentTarget.closest<HTMLElement>('[role="tree"]');
        tree?.focus();
    }, [defaultOnClick, id, index, selectable, setActiveIndex, toggleSelection]);

    return {onClick};
};
