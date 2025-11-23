import {Checkbox, cn} from '@enonic/ui';
import {CornerDownRight} from 'lucide-react';
import {useI18n} from '../../hooks/useI18n';
import type {Props as ContentItemCheckableProps} from './ContentItemCheckable';
import {ContentItemCheckable} from './ContentItemCheckable';

export type Props = {
    includeChildren?: boolean;
    defaultIncludeChildren?: boolean;
    onIncludeChildrenChange?: (checked: boolean) => void;
} & ContentItemCheckableProps;

const CONTENT_ITEM_WITH_CHILDREN_NAME = 'ContentItemWithChildren';

export const ContentItemWithChildren = ({
    id,
    content,
    checked,
    onCheckedChange,
    defaultChecked,
    readOnly,
    className,
    includeChildren,
    onIncludeChildrenChange,
    defaultIncludeChildren,
}: Props): React.ReactElement => {
    const hasChildren = content.hasChildren();
    const includeChildrenLabel = useI18n('field.content.includeChildren');

    const includeChildrenCheckboxId = `${CONTENT_ITEM_WITH_CHILDREN_NAME}-${id || content.getId()}-include-children-checkbox`;

    return (
        <li role="row" className={cn("flex flex-col", className)}>
            <ContentItemCheckable
                id={id}
                role={undefined}
                content={content}
                checked={checked}
                defaultChecked={defaultChecked}
                onCheckedChange={onCheckedChange}
                readOnly={readOnly}
            />
            {hasChildren && (
                <div className="flex items-center gap-2.5 pl-5 py-1">
                    <CornerDownRight className="w-4 h-4 shrink-0" />
                    <Checkbox
                        id={includeChildrenCheckboxId}
                        className="font-semibold"
                        checked={includeChildren}
                        defaultChecked={defaultIncludeChildren}
                        onCheckedChange={onIncludeChildrenChange}
                        readOnly={readOnly || !(checked || defaultChecked)}
                        label={includeChildrenLabel}
                    />
                </div>
            )}
        </li>
    );
};

ContentItemWithChildren.displayName = CONTENT_ITEM_WITH_CHILDREN_NAME;
