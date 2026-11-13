import { type ReactElement } from 'react';
import { CustomSelectorItemView } from './CustomSelectorItemView';
import { type SortableGridListItemContext } from '@enonic/input-types';
import { type ContentSummary } from '../../../../../../app/content/ContentSummary';
import { type CustomSelectorItem } from './CustomSelectorInput';
import { X } from 'lucide-react';
import { cn, IconButton } from '@enonic/ui';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { ContentNotAvailable } from '../../../selectors/content/selection';

type CustomSelectorSelectionItemViewProps = {
    items: CustomSelectorItem[];
    context: SortableGridListItemContext<ContentSummary>;
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
    const removeLabel = useI18n('action.remove');
    const { index, item: content } = context;
    const item = items.find((item) => item.id === content.getId());

    return (
        <div className={cn('flex items-center gap-2.5 w-full min-w-0', className)}>
            {item ? (
                <CustomSelectorItemView item={item} listMode={listMode} />
            ) : (
                <CustomSelectorItemNotAvailable id={content.getId()} listMode={listMode} />
            )}
            <IconButton aria-label={removeLabel} icon={X} onClick={() => onRemove(index)} className="shrink-0" />
        </div>
    );
};

CustomSelectorSelectionItemView.displayName = 'CustomSelectorSelectionItemView';

const CustomSelectorItemNotAvailable = ({ id, listMode }: { id: string; listMode: 'list' | 'flat' }): ReactElement => {
    const notAvailableLabel = useI18n('text.option.not.available');

    if (listMode === 'list') return <ContentNotAvailable contentId={id} label={notAvailableLabel} className="w-full" />;

    return (
        <div className="flex items-center gap-2.5 min-w-0 w-full">
            <div className="relative w-[36cqw] max-w-[240px] aspect-square flex items-center justify-center shrink-0 border border-error">
                <span className="text-sm text-error text-center m-1">{notAvailableLabel}</span>
            </div>
            <div className="min-w-0">
                <span className="font-semibold text-base block whitespace-nowrap overflow-hidden text-ellipsis">
                    {id}
                </span>
            </div>
        </div>
    );
};

CustomSelectorItemNotAvailable.displayName = 'CustomSelectorItemNotAvailable';
