import type {ReactElement} from 'react';

//
// * Types
//

export type ContentSelectionItemProps = {
    /** Content ID */
    id: string;
    /** Content display name */
    displayName?: string;
    /** Content path */
    path?: string;
    /** Icon URL */
    iconUrl?: string;
    /** Whether the item can be edited */
    editable?: boolean;
    /** Whether the item can be removed */
    removable?: boolean;
    /** Callback when edit is clicked */
    onEdit?: (id: string) => void;
    /** Callback when remove is clicked */
    onRemove?: (id: string) => void;
    /** Additional CSS class */
    className?: string;
};

//
// * Constants
//

const CONTENT_SELECTION_ITEM_NAME = 'ContentSelectionItem';

//
// * Component
//

/**
 * Single selected content item with edit/remove actions.
 * Displays content info and action buttons.
 *
 * TODO: Implement full functionality:
 * - Show content icon, name, and path
 * - Edit button to open content in editor
 * - Remove button to deselect item
 * - Drag handle for reordering
 * - Accessibility support
 */
export const ContentSelectionItem = ({
    id,
    displayName,
    path,
    iconUrl,
    editable = true,
    removable = true,
    onEdit,
    onRemove,
    className,
}: ContentSelectionItemProps): ReactElement => {
    return (
        <div
            data-component={CONTENT_SELECTION_ITEM_NAME}
            data-content-id={id}
            className={className}
        >
            {/* TODO: Implement full item UI */}
            <span className='text-sm'>{displayName ?? id}</span>
        </div>
    );
};

ContentSelectionItem.displayName = CONTENT_SELECTION_ITEM_NAME;
