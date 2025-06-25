import {Checkbox, cn} from '@enonic/ui';
import {type ReactElement} from 'react';
import {CornerDownRight} from 'lucide-react';
import {useI18n} from '../../hooks/useI18n';
import type {ContentListItemSelectableProps as ContentItemCheckableProps} from './ContentListItemSelectable';
import {ContentListItemSelectable} from './ContentListItemSelectable';

export type ContentListItemSelectableWithChildrenProps = {
    includeChildren?: boolean;
    defaultIncludeChildren?: boolean;
    onIncludeChildrenChange?: (checked: boolean) => void;
    showIncludeChildren?: boolean;
    /**
     * TabIndex for interactive elements.
     * Set to -1 when used inside TreeList to enable F2 action mode navigation.
     */
    tabIndex?: number;
} & ContentItemCheckableProps;

const CONTENT_LIST_ITEM_SELECTABLE_WITH_CHILDREN_NAME = 'ContentListItemSelectableWithChildren';

export const ContentListItemSelectableWithChildren = ({
    id,
    content,
    checked,
    onCheckedChange,
    defaultChecked,
    readOnly,
    includeChildren,
    onIncludeChildrenChange,
    defaultIncludeChildren,
    showIncludeChildren = true,
    className,
    tabIndex,
}: ContentListItemSelectableWithChildrenProps): ReactElement => {
    const includeChildrenLabel = useI18n('field.content.includeChildren');
    const hasChildren = content.hasChildren();
    const showIncludeChildrenCheckbox = hasChildren && showIncludeChildren;

    const includeChildrenCheckboxId =
        `${CONTENT_LIST_ITEM_SELECTABLE_WITH_CHILDREN_NAME}-${id || content.getId()}-include-children-checkbox`;

    return (
        <li role="row" className={cn("flex flex-col gap-1", className)}>
            <ContentListItemSelectable
                id={id}
                role={undefined}
                content={content}
                checked={checked}
                defaultChecked={defaultChecked}
                onCheckedChange={onCheckedChange}
                readOnly={readOnly}
                tabIndex={tabIndex}
            />
            {showIncludeChildrenCheckbox && (
                <div className="flex items-center gap-2.5 h-8 pl-5">
                    <CornerDownRight className="size-4 shrink-0" />
                    <Checkbox
                        id={includeChildrenCheckboxId}
                        className="font-semibold"
                        checked={includeChildren}
                        defaultChecked={defaultIncludeChildren}
                        onCheckedChange={onIncludeChildrenChange}
                        readOnly={readOnly || !(defaultChecked || checked)}
                        disabled={!(defaultChecked || checked)}
                        label={includeChildrenLabel}
                        tabIndex={tabIndex}
                    />
                </div>
            )}
        </li>
    );
};

ContentListItemSelectableWithChildren.displayName = CONTENT_LIST_ITEM_SELECTABLE_WITH_CHILDREN_NAME;
