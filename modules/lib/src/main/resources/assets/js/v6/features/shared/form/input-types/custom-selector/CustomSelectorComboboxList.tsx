import {ReactElement} from 'react';
import {Checkbox, cn, Combobox, ComboboxRootProps, Listbox, useCombobox} from '@enonic/ui';
import {CustomSelectorItem} from './CustomSelectorInput';
import {CustomSelectorItemView} from './CustomSelectorItemView';
import {useInfiniteScroll} from '../../../../hooks/useInfiniteScroll';

type CustomSelectorInputComboboxListProps = {
    items: CustomSelectorItem[];
    selectionMode: ComboboxRootProps['selectionMode'];
    listMode: 'list' | 'flat';
    isLoading: boolean;
    onLoadMore: () => void;
    hasMore: boolean;
    className?: string;
};

export const CustomSelectorInputComboboxList = ({
    items,
    selectionMode,
    listMode,
    isLoading,
    onLoadMore,
    hasMore,
    className,
}: CustomSelectorInputComboboxListProps): ReactElement => {
    const {selection} = useCombobox();
    const loadMoreRef = useInfiniteScroll<HTMLDivElement>({hasMore, isLoading, onLoadMore});

    return (
        <Combobox.ListContent
            className={cn(
                'rounded-md w-full overflow-y-scroll scroll-smooth @container',
                listMode === 'list' ? 'max-h-60' : 'max-h-120',
                className
            )}
        >
            {items.map((item) => (
                <Listbox.Item key={item.id} value={item.id}>
                    <CustomSelectorItemView item={item} listMode={listMode} />
                    {selectionMode !== 'single' && (
                        <Checkbox tabIndex={-1} checked={selection.has(item.id)} onClick={(event) => event.preventDefault()} />
                    )}
                </Listbox.Item>
            ))}
            {hasMore && <div ref={loadMoreRef} className="h-0 w-full opacity-0" />}
        </Combobox.ListContent>
    );
};

CustomSelectorInputComboboxList.displayName = 'CustomSelectorInputComboboxList';
