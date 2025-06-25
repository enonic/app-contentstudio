import {Checkbox, cn} from '@enonic/ui';
import {type ReactElement} from 'react';
import {CornerDownRight} from 'lucide-react';
import {useI18n} from '../../hooks/useI18n';
import {ContentItemProps, ContentListItem} from './ContentListItem';

export type ContentListItemWithChildrenProps = {
    id?: string;
    includeChildren?: boolean;
    defaultIncludeChildren?: boolean;
    onIncludeChildrenChange?: (checked: boolean) => void;
    showIncludeChildren?: boolean;
    readOnly?: boolean;
    className?: string;
} & Omit<ContentItemProps, 'className'>;

const CONTENT_LIST_ITEM_WITH_CHILDREN_NAME = 'ContentListItemWithChildren';

export const ContentListItemWithChildren = ({
    id,
    content,
    includeChildren,
    onIncludeChildrenChange,
    defaultIncludeChildren,
    showIncludeChildren = true,
    readOnly,
    className,
    ...props
}: ContentListItemWithChildrenProps): ReactElement => {
    const includeChildrenLabel = useI18n('field.content.includeChildren');
    const hasChildren = content.hasChildren();
    const showIncludeChildrenCheckbox = hasChildren && showIncludeChildren;

    const includeChildrenCheckboxId = `${CONTENT_LIST_ITEM_WITH_CHILDREN_NAME}-${id || content.getId()}-include-children-checkbox`;

    return (
        <li role="row" className={cn("flex flex-col gap-1", className)}>
            <ContentListItem content={content} {...props} />
            {showIncludeChildrenCheckbox && (
                <div className="flex items-center gap-2.5 h-8 pl-5">
                    <CornerDownRight className="size-4 shrink-0" />
                    <Checkbox
                        id={includeChildrenCheckboxId}
                        className="font-semibold"
                        checked={includeChildren}
                        defaultChecked={defaultIncludeChildren}
                        onCheckedChange={onIncludeChildrenChange}
                        readOnly={readOnly}
                        disabled={readOnly}
                        label={includeChildrenLabel}
                    />
                </div>
            )}
        </li>
    );
};

ContentListItemWithChildren.displayName = CONTENT_LIST_ITEM_WITH_CHILDREN_NAME;
