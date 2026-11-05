import { Button, Toolbar } from '@enonic/ui';
import type { LucideIcon } from 'lucide-react';
import type { KeyboardEvent, MouseEvent, ReactElement } from 'react';
import { ItemLabel } from '../../../../../shared/ui/ItemLabel';
import { requestComponentInsert, type PortalComponentType } from '../../../model/page-editor';
import { useInsertableDrag } from './useInsertableDrag';

export type InsertableItemProps = {
    name: PortalComponentType;
    icon: LucideIcon;
    displayName: string;
    description: string;
    disabled?: boolean;
    onInserted?: (path: string, trigger: HTMLButtonElement) => void;
};

const INSERTABLE_ITEM_NAME = 'InsertableItem';

export const InsertableItem = ({
    name,
    icon: Icon,
    displayName,
    description,
    disabled,
    onInserted,
}: InsertableItemProps): ReactElement => {
    const { onMouseDown } = useInsertableDrag({ itemType: name, itemLabel: displayName });

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        if (disabled || event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        event.currentTarget.click();
    };

    const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
        if (disabled || event.defaultPrevented || event.detail !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        const path = requestComponentInsert(name);
        if (path) {
            onInserted?.(path.toString(), event.currentTarget);
        }
    };

    return (
        <Toolbar.Item asChild disabled={disabled}>
            <Button
                data-portal-component-type={name}
                onMouseDown={onMouseDown}
                onKeyDown={handleKeyDown}
                onClick={handleClick}
                className="h-auto justify-start p-1 rounded-sm cursor-grab select-none"
            >
                <ItemLabel icon={<Icon />} primary={displayName} secondary={description} />
            </Button>
        </Toolbar.Item>
    );
};

InsertableItem.displayName = INSERTABLE_ITEM_NAME;
