import type {LucideIcon} from 'lucide-react';
import type {ReactElement} from 'react';

export type InsertableItemProps = {
    name: string;
    icon: LucideIcon;
    displayName: string;
    description: string;
};

const INSERTABLE_ITEM_NAME = 'InsertableItem';

export const InsertableItem = ({name, icon: Icon, displayName, description}: InsertableItemProps): ReactElement => {
    return (
        <li data-portal-component-type={name} className="flex items-center gap-3 p-1 rounded-sm">
            <Icon className="size-6 shrink-0" />
            <div className="flex flex-col overflow-hidden">
                <span className="text-md font-semibold leading-5.5 truncate">{displayName}</span>
                <small className="text-sm text-subtle leading-4.5 truncate">{description}</small>
            </div>
        </li>
    );
};

InsertableItem.displayName = INSERTABLE_ITEM_NAME;
