import type {LucideIcon} from 'lucide-react';
import type {ReactElement} from 'react';
import {ItemLabel} from '../../../../../shared/ItemLabel';
import type {PortalComponentType} from '../../../../../store/page-editor';
import {useInsertableDrag} from './useInsertableDrag';

export type InsertableItemProps = {
    name: PortalComponentType;
    icon: LucideIcon;
    displayName: string;
    description: string;
};

const INSERTABLE_ITEM_NAME = 'InsertableItem';

export const InsertableItem = ({name, icon: Icon, displayName, description}: InsertableItemProps): ReactElement => {
    const {onMouseDown} = useInsertableDrag({itemType: name, itemLabel: displayName});

    return (
        <li
            data-portal-component-type={name}
            onMouseDown={onMouseDown}
            className="p-1 rounded-sm cursor-grab select-none"
        >
            <ItemLabel icon={<Icon />} primary={displayName} secondary={description} />
        </li>
    );
};

InsertableItem.displayName = INSERTABLE_ITEM_NAME;
