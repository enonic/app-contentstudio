import {type ReactElement} from 'react';
import {CustomSelectorItemView} from './CustomSelectorItemView';
import {SortableListItemContext} from '@enonic/lib-admin-ui/form2/components';
import {type ContentSummary} from '../../../../../../app/content/ContentSummary';
import {CustomSelectorItem} from './CustomSelectorInput';
import {X} from 'lucide-react';
import {cn, IconButton} from '@enonic/ui';

type CustomSelectorSelectionItemViewProps = {
    items: CustomSelectorItem[];
    context: SortableListItemContext<ContentSummary>;
    listMode: 'list' | 'flat';
    onRemove: (index: number) => void;
    className?: string;
};
export const CustomSelectorSelectionItemView = ({
    context,
    items,
    listMode,
    onRemove,
    className,
}: CustomSelectorSelectionItemViewProps): ReactElement => {
    const {index, item: content} = context;
    const item = items.find((item) => item.id === content.getId());

    if (!item) return null;

    return (
        <div className={cn('flex items-center gap-2.5 w-full min-w-0', className)}>
            <CustomSelectorItemView item={item} listMode={listMode} />
            <IconButton icon={X} onClick={() => onRemove(index)} className="shrink-0" />
        </div>
    );
};

CustomSelectorSelectionItemView.displayName = 'CustomSelectorSelectionItemView';
