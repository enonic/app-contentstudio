import {Button} from '@enonic/ui';
import React, {useCallback} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {resetVersionsSelection} from '../../../../store/context/versionStore';

const COMPONENT_NAME = 'VersionSelectionToolbar';

 /**
 * Toolbar component for version selection actions
 * Shows "Compare" and "Cancel" buttons when versions are selected
 */
interface VersionSelectionToolbarProps {
    selectionSize: number;
    onCancel?: () => void;
}

export const VersionSelectionToolbar = ({selectionSize, onCancel}: VersionSelectionToolbarProps): React.ReactElement => {
    const showChangesButtonLabel = useI18n('text.versions.showChanges');
    const cancelButtonLabel = useI18n('action.cancel');

    const handleCancel = useCallback(() => {
        resetVersionsSelection();
        onCancel?.();
    }, [onCancel]);

    return (
        <div
            className='flex justify-center items-center gap-2.5 sticky top-0 bg-surface-neutral/85 py-3 z-1'
            data-component={COMPONENT_NAME}
        >
            <Button
                label={showChangesButtonLabel}
                variant='filled'
                disabled={selectionSize !== 2}
            />
            <Button
                label={cancelButtonLabel}
                variant='outline'
                onClick={handleCancel}
            />
        </div>
    );
};

VersionSelectionToolbar.displayName = COMPONENT_NAME;
