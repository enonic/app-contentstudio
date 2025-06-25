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

export const ContentItemWithChildren = ({
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

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <ContentItemCheckable
                content={content}
                checked={checked}
                defaultChecked={defaultChecked}
                onCheckedChange={onCheckedChange}
                readOnly={readOnly}
            />
            {hasChildren && (
                <div className="flex items-center gap-2.5 pl-5">
                    <CornerDownRight className="w-4 h-4 shrink-0" />
                    <Checkbox
                        className="font-semibold"
                        checked={includeChildren}
                        defaultChecked={defaultIncludeChildren}
                        onCheckedChange={onIncludeChildrenChange}
                        readOnly={readOnly || !(checked || defaultChecked)}
                        label={includeChildrenLabel}
                    />
                </div>
            )}
        </div>
    );
};
