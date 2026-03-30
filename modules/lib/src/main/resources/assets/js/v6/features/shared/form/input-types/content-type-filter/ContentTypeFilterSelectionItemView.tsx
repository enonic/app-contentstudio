import {type SortableListItemContext} from '@enonic/lib-admin-ui/form2/components';
import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {cn, IconButton} from '@enonic/ui';
import {X} from 'lucide-react';
import {type ReactElement} from 'react';
import {ContentTypeFilterItemView} from './ContentTypeFilterItemView';

type ContentTypeFilterSelectionItemViewProps = {
    context: SortableListItemContext<ContentTypeSummary>;
    onRemove: (index: number) => void;
    className?: string;
};

const COMPONENT_NAME = 'ContentTypeFilterSelectionItemView';

export const ContentTypeFilterSelectionItemView = ({
    context,
    onRemove,
    className,
}: ContentTypeFilterSelectionItemViewProps): ReactElement => {
    const {index, item: contentType} = context;

    return (
        <div className={cn('flex items-center gap-2.5 w-full', className)}>
            <ContentTypeFilterItemView contentType={contentType} />
            <IconButton icon={X} onClick={() => onRemove(index)} className="shrink-0" />
        </div>
    );
};

ContentTypeFilterSelectionItemView.displayName = COMPONENT_NAME;
