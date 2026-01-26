import type {ReactElement} from 'react';

//
// * Types
//

export type ContentSelectionProps = {
    /** IDs of selected content items */
    selection: readonly string[];
    /** Callback when selection changes (item removed) */
    onSelectionChange: (selection: readonly string[]) => void;
    /** Whether the selection is disabled */
    disabled?: boolean;
    /** Additional CSS class */
    className?: string;
};

//
// * Constants
//

const CONTENT_SELECTION_NAME = 'ContentSelection';

//
// * Component
//

/**
 * Container component for displaying selected content items.
 * Shows a list of ContentSelectionItem components for each selected item.
 *
 * TODO: Implement full functionality:
 * - Fetch content data for selected IDs
 * - Render ContentSelectionItem for each item
 * - Handle drag and drop reordering
 * - Support keyboard navigation
 */
export const ContentSelection = ({
    selection,
    onSelectionChange,
    disabled = false,
    className,
}: ContentSelectionProps): ReactElement | null => {
    // Don't render if no selection
    if (selection.length === 0) {
        return null;
    }

    return (
        <div
            data-component={CONTENT_SELECTION_NAME}
            className={className}
        >
            {/* TODO: Render ContentSelectionItem for each selected item */}
            <div className='text-subtle text-sm'>
                {selection.length} item(s) selected
            </div>
        </div>
    );
};

ContentSelection.displayName = CONTENT_SELECTION_NAME;
